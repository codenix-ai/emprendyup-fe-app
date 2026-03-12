// ─────────────────────────────────────────────
//  emprendy.ai — Jira MCP Client
// ─────────────────────────────────────────────
import Anthropic from '@anthropic-ai/sdk';
import { Finding, TestResult } from './types';

const client = new Anthropic();

const MCP_BETA = 'mcp-client-2025-04-04';

const JIRA_MCP_URL = process.env.JIRA_MCP_URL ?? '';
const JIRA_ENABLED = JIRA_MCP_URL.length > 0;

const MCP_SERVER = {
  type: 'url' as const,
  url: JIRA_MCP_URL,
  name: 'jira-mcp',
};

// ── Wrapper: run a Jira MCP call, degrade gracefully on any error ──────
async function callJira<T>(fn: () => Promise<T>, fallback: T): Promise<T> {
  if (!JIRA_ENABLED) {
    console.warn('[JIRA] JIRA_MCP_URL not set — skipping');
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

// ── Create issue from a code Finding ──────────
export async function createIssueFromFinding(finding: Finding): Promise<string> {
  return callJira(async () => {
    const response = await client.beta.messages.create({
      betas: [MCP_BETA],
      model: 'claude-opus-4-5',
      max_tokens: 2000,
      mcp_servers: [MCP_SERVER],
      system: `Eres el Jira Scribe de emprendy.ai.
Crea issues en el proyecto ${process.env.JIRA_PROJECT_KEY ?? 'EMPR'}.
Sigue estas reglas:
- issueType: "Bug" para errores, "Story" para mejoras
- priority: Blocker → critical, High → high, Medium → medium, Low → low
- Siempre agrega los labels: ["${finding.layer}", "severity:${finding.severity}", "auto-detected"]
- Descripción en español, técnica y concisa
- Incluye pasos de reproducción si aplica
- Agrega el snippet de código afectado en un bloque de código Jira {code}`,

      messages: [
        {
          role: 'user',
          content: `Crea un Jira issue para este hallazgo de código:

Tipo:      ${finding.type}
Módulo:    ${finding.module}
Archivo:   ${finding.file}:${finding.line}
Severidad: ${finding.severity}
Layer:     ${finding.layer}
Error:     ${finding.description}
Regla:     ${finding.rule ?? 'N/A'}

Código afectado:
\`\`\`
${finding.codeSnippet}
\`\`\`

${finding.fix ? `Fix sugerido por el linter: ${finding.fix}` : ''}`,
        },
      ],
    } as any);

    const text = response.content
      .filter((b) => b.type === 'text')
      .map((b) => (b as any).text)
      .join('\n');
    return text.match(/([A-Z]+-\d+)/)?.[1] ?? 'CREATED';
  }, 'SKIPPED');
}

// ── Create issue from a failed test ───────────
export async function createIssueFromTestFailure(result: TestResult): Promise<string> {
  return callJira(async () => {
    const response = await client.beta.messages.create({
      betas: [MCP_BETA],
      model: 'claude-opus-4-5',
      max_tokens: 2000,
      mcp_servers: [MCP_SERVER],
      system: `Eres el Jira Scribe de emprendy.ai.
Crea un Bug en el proyecto ${process.env.JIRA_PROJECT_KEY ?? 'EMPR'} por falla en test E2E.
Labels obligatorios: ["regression", "e2e", "auto-detected", "${result.module}"]
Incluye los pasos del test como pasos de reproducción.
Adjunta el path del screenshot en la descripción.`,

      messages: [
        {
          role: 'user',
          content: `Test E2E fallido en módulo: ${result.module}
Escenario: ${result.scenario}
Error:     ${result.error ?? 'Sin mensaje de error'}
Duración:  ${result.duration}ms
Screenshot: ${result.screenshot ?? 'N/A'}

Pasos ejecutados:
${result.steps.map((s, i) => `${i + 1}. [${s.status.toUpperCase()}] ${s.action}${s.error ? ` → ${s.error}` : ''}`).join('\n')}`,
        },
      ],
    } as any);

    const text = response.content
      .filter((b) => b.type === 'text')
      .map((b) => (b as any).text)
      .join('\n');
    return text.match(/([A-Z]+-\d+)/)?.[1] ?? 'CREATED';
  }, 'SKIPPED');
}

// ── Transition issue status ────────────────────
export async function transitionIssue(issueKey: string, targetStatus: string): Promise<void> {
  await callJira(async () => {
    await client.beta.messages.create({
      betas: [MCP_BETA],
      model: 'claude-opus-4-5',
      max_tokens: 500,
      mcp_servers: [MCP_SERVER],
      messages: [
        {
          role: 'user',
          content: `Transiciona el issue ${issueKey} al estado "${targetStatus}" en Jira.`,
        },
      ],
    } as any);
    console.log(`[JIRA] ${issueKey} → ${targetStatus}`);
  }, undefined);
}

// ── Add comment to issue ──────────────────────
export async function addComment(issueKey: string, comment: string): Promise<void> {
  await callJira(async () => {
    await client.beta.messages.create({
      betas: [MCP_BETA],
      model: 'claude-opus-4-5',
      max_tokens: 500,
      mcp_servers: [MCP_SERVER],
      messages: [
        {
          role: 'user',
          content: `Agrega el siguiente comentario al issue ${issueKey} en Jira:\n\n${comment}`,
        },
      ],
    } as any);
  }, undefined);
}

// ── Check if similar issue exists (dedup) ─────
export async function findDuplicateIssue(
  description: string,
  file: string
): Promise<string | null> {
  return callJira(async () => {
    const response = await client.beta.messages.create({
      betas: [MCP_BETA],
      model: 'claude-opus-4-5',
      max_tokens: 300,
      mcp_servers: [MCP_SERVER],
      messages: [
        {
          role: 'user',
          content: `Busca en Jira proyecto ${process.env.JIRA_PROJECT_KEY ?? 'EMPR'} si existe un issue abierto similar a:
Descripción: ${description}
Archivo: ${file}

Si existe, responde SOLO con la clave del issue (ej: EMPR-42). Si no existe, responde: NONE`,
        },
      ],
    } as any);

    const text = response.content
      .filter((b) => b.type === 'text')
      .map((b) => (b as any).text)
      .join('')
      .trim();
    return text === 'NONE' ? null : (text.match(/([A-Z]+-\d+)/)?.[1] ?? null);
  }, null);
}
