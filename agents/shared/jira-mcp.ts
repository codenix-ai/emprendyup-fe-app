// ─────────────────────────────────────────────
//  emprendy.ai — Jira MCP Client
// ─────────────────────────────────────────────
import Anthropic from '@anthropic-ai/sdk';
import { JiraIssue, Finding, TestResult, Layer } from './types';

const client = new Anthropic();

const MCP_SERVER = {
  type: 'url' as const,
  url: process.env.JIRA_MCP_URL ?? '',
  name: 'jira-mcp',
};

// ── Create issue from a code Finding ──────────
export async function createIssueFromFinding(finding: Finding): Promise<string> {
  const response = await client.messages.create({
    model: 'claude-opus-4-5',
    max_tokens: 2000,
    // @ts-ignore — mcp_servers is a valid param
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
  });

  const text = response.content
    .filter((b) => b.type === 'text')
    .map((b) => (b as any).text)
    .join('\n');
  const match = text.match(/([A-Z]+-\d+)/);
  return match?.[1] ?? 'CREATED';
}

// ── Create issue from a failed test ───────────
export async function createIssueFromTestFailure(result: TestResult): Promise<string> {
  const response = await client.messages.create({
    model: 'claude-opus-4-5',
    max_tokens: 2000,
    // @ts-ignore
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
  });

  const text = response.content
    .filter((b) => b.type === 'text')
    .map((b) => (b as any).text)
    .join('\n');
  const match = text.match(/([A-Z]+-\d+)/);
  return match?.[1] ?? 'CREATED';
}

// ── Transition issue status ────────────────────
export async function transitionIssue(issueKey: string, targetStatus: string): Promise<void> {
  await client.messages.create({
    model: 'claude-opus-4-5',
    max_tokens: 500,
    // @ts-ignore
    mcp_servers: [MCP_SERVER],
    messages: [
      {
        role: 'user',
        content: `Transiciona el issue ${issueKey} al estado "${targetStatus}" en Jira.`,
      },
    ],
  });
  console.log(`[JIRA] ${issueKey} → ${targetStatus}`);
}

// ── Add comment to issue ──────────────────────
export async function addComment(issueKey: string, comment: string): Promise<void> {
  await client.messages.create({
    model: 'claude-opus-4-5',
    max_tokens: 500,
    // @ts-ignore
    mcp_servers: [MCP_SERVER],
    messages: [
      {
        role: 'user',
        content: `Agrega el siguiente comentario al issue ${issueKey} en Jira:\n\n${comment}`,
      },
    ],
  });
}

// ── Check if similar issue exists (dedup) ─────
export async function findDuplicateIssue(
  description: string,
  file: string
): Promise<string | null> {
  const response = await client.messages.create({
    model: 'claude-opus-4-5',
    max_tokens: 300,
    // @ts-ignore
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
  });

  const text = response.content
    .filter((b) => b.type === 'text')
    .map((b) => (b as any).text)
    .join('')
    .trim();
  return text === 'NONE' ? null : (text.match(/([A-Z]+-\d+)/)?.[1] ?? null);
}
