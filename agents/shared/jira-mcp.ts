// ─────────────────────────────────────────────
//  emprendy.ai — Jira REST API Client
//  Uses Jira REST API v3 with API token auth
// ─────────────────────────────────────────────
import { Finding, TestResult } from './types';

const JIRA_BASE_URL = (process.env.JIRA_BASE_URL ?? '').replace(/\/$/, '');
const JIRA_USER_EMAIL = process.env.JIRA_USER_EMAIL ?? '';
const JIRA_API_TOKEN = process.env.JIRA_API_TOKEN ?? '';
const JIRA_PROJECT_KEY = process.env.JIRA_PROJECT_KEY ?? 'EMPR';

const JIRA_ENABLED = JIRA_BASE_URL.length > 0 && JIRA_API_TOKEN.length > 0;

const authHeader =
  'Basic ' + Buffer.from(`${JIRA_USER_EMAIL}:${JIRA_API_TOKEN}`).toString('base64');

// ── Low-level fetch wrapper ────────────────────
async function jiraRequest(method: string, path: string, body?: unknown): Promise<unknown> {
  const res = await fetch(`${JIRA_BASE_URL}/rest/api/3${path}`, {
    method,
    headers: {
      Authorization: authHeader,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Jira ${method} ${path} → ${res.status}: ${text}`);
  }
  return res.json();
}

// ── Graceful wrapper ──────────────────────────
async function callJira<T>(fn: () => Promise<T>, fallback: T): Promise<T> {
  if (!JIRA_ENABLED) {
    console.warn('[JIRA] JIRA_BASE_URL or JIRA_API_TOKEN not set — skipping');
    return fallback;
  }
  try {
    return await fn();
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.warn(`[JIRA] Unavailable — skipping (${msg})`);
    return fallback;
  }
}

// ── Map severity to Jira priority ─────────────
function toPriority(severity: string): string {
  const map: Record<string, string> = {
    critical: 'Highest',
    high: 'High',
    medium: 'Medium',
    low: 'Low',
  };
  return map[severity] ?? 'Medium';
}

// ── Create issue from a code Finding ──────────
export async function createIssueFromFinding(finding: Finding): Promise<string> {
  return callJira(async () => {
    const payload = {
      fields: {
        project: { key: JIRA_PROJECT_KEY },
        summary: `[${finding.severity.toUpperCase()}] ${finding.type}: ${finding.description.slice(0, 120)}`,
        description: {
          type: 'doc',
          version: 1,
          content: [
            {
              type: 'paragraph',
              content: [
                {
                  type: 'text',
                  text: `File: ${finding.file}:${finding.line}\nRule: ${finding.rule ?? 'N/A'}\nLayer: ${finding.layer}\nModule: ${finding.module}\n\n${finding.description}`,
                },
              ],
            },
            ...(finding.codeSnippet
              ? [
                  {
                    type: 'codeBlock',
                    content: [{ type: 'text', text: finding.codeSnippet }],
                  },
                ]
              : []),
          ],
        },
        issuetype: { name: 'Bug' },
        priority: { name: toPriority(finding.severity) },
        labels: [finding.layer, `severity:${finding.severity}`, 'auto-detected'],
      },
    };

    const data = (await jiraRequest('POST', '/issue', payload)) as { key: string };
    console.log(`[JIRA] Created ${data.key}`);
    return data.key;
  }, 'SKIPPED');
}

// ── Create issue from a failed test ───────────
export async function createIssueFromTestFailure(result: TestResult): Promise<string> {
  return callJira(async () => {
    const steps = result.steps
      .map(
        (s, i) =>
          `${i + 1}. [${s.status.toUpperCase()}] ${s.action}${s.error ? ` → ${s.error}` : ''}`
      )
      .join('\n');

    const payload = {
      fields: {
        project: { key: JIRA_PROJECT_KEY },
        summary: `[E2E FAILURE] ${result.module}: ${result.scenario.slice(0, 100)}`,
        description: {
          type: 'doc',
          version: 1,
          content: [
            {
              type: 'paragraph',
              content: [
                {
                  type: 'text',
                  text: `Module: ${result.module}\nScenario: ${result.scenario}\nError: ${result.error ?? 'N/A'}\nDuration: ${result.duration}ms\nScreenshot: ${result.screenshot ?? 'N/A'}\n\nSteps:\n${steps}`,
                },
              ],
            },
          ],
        },
        issuetype: { name: 'Bug' },
        priority: { name: 'High' },
        labels: ['regression', 'e2e', 'auto-detected', result.module],
      },
    };

    const data = (await jiraRequest('POST', '/issue', payload)) as { key: string };
    console.log(`[JIRA] Created ${data.key}`);
    return data.key;
  }, 'SKIPPED');
}

// ── Transition issue status ────────────────────
export async function transitionIssue(issueKey: string, targetStatus: string): Promise<void> {
  await callJira(async () => {
    const data = (await jiraRequest('GET', `/issue/${issueKey}/transitions`)) as {
      transitions: { id: string; name: string }[];
    };
    const transition = data.transitions.find(
      (t) => t.name.toLowerCase() === targetStatus.toLowerCase()
    );
    if (!transition) {
      console.warn(`[JIRA] Transition "${targetStatus}" not found for ${issueKey}`);
      return;
    }
    await jiraRequest('POST', `/issue/${issueKey}/transitions`, {
      transition: { id: transition.id },
    });
    console.log(`[JIRA] ${issueKey} → ${targetStatus}`);
  }, undefined);
}

// ── Add comment to issue ──────────────────────
export async function addComment(issueKey: string, comment: string): Promise<void> {
  await callJira(async () => {
    await jiraRequest('POST', `/issue/${issueKey}/comment`, {
      body: {
        type: 'doc',
        version: 1,
        content: [{ type: 'paragraph', content: [{ type: 'text', text: comment }] }],
      },
    });
  }, undefined);
}

// ── Check if similar issue exists (dedup) ─────
export async function findDuplicateIssue(
  description: string,
  file: string
): Promise<string | null> {
  return callJira(async () => {
    const keyword = `${description.slice(0, 40)} ${file}`.replace(/['"\\]/g, ' ').slice(0, 100);
    const jql = `project = ${JIRA_PROJECT_KEY} AND summary ~ "${keyword}" AND statusCategory != Done ORDER BY created DESC`;
    const data = (await jiraRequest(
      'GET',
      `/search?jql=${encodeURIComponent(jql)}&maxResults=1&fields=key,summary`
    )) as { issues: { key: string }[] };
    return data.issues[0]?.key ?? null;
  }, null);
}
