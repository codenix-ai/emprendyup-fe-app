// ─────────────────────────────────────────────
//  emprendy.ai — Agent 6: VALIDATOR
//  Verificación post-fix y cierre de loop
// ─────────────────────────────────────────────
import { execSync } from 'child_process';
import * as fs from 'fs';
import Anthropic from '@anthropic-ai/sdk';
import { JiraIssue } from '../shared/types';
import { consume, notifySlack } from '../shared/bus';
import { transitionIssue, addComment } from '../shared/jira-mcp';

const client = new Anthropic();

// ─── Re-correr los tests del módulo afectado ──
async function reRunTests(issue: JiraIssue): Promise<{ passed: boolean; output: string }> {
  const moduleMap: Record<string, string> = {
    store: 'tests/e2e/store.spec.ts',
    restaurant: 'tests/e2e/restaurant.spec.ts',
    service: 'tests/e2e/service.spec.ts',
    dashboard: 'tests/e2e/dashboard.spec.ts',
    auth: 'tests/e2e/dashboard.spec.ts',
    api: 'tests/e2e/',
    db: 'tests/e2e/',
  };

  const testFile = moduleMap[issue.component] ?? 'tests/e2e/';

  try {
    const output = execSync(`npx playwright test ${testFile} --reporter=line --timeout=30000`, {
      encoding: 'utf-8',
      stdio: 'pipe',
    });
    return { passed: true, output };
  } catch (err: any) {
    return { passed: false, output: err.stdout ?? String(err) };
  }
}

// ─── Analizar resultado con Claude ────────────
async function analyzeResult(
  issue: JiraIssue,
  testOutput: string,
  passed: boolean
): Promise<string> {
  const response = await client.messages.create({
    model: 'claude-opus-4-5',
    max_tokens: 500,
    system: `Eres un QA lead analizando si un fix resolvió el issue de emprendy.ai.
Sé conciso. Responde en español. Máximo 3 oraciones.`,

    messages: [
      {
        role: 'user',
        content: `Issue: ${issue.key} — ${issue.summary}
Fix aplicado en: ${issue.affectedFile}
Tests: ${passed ? '✅ PASARON' : '❌ FALLARON'}

Output del test:
${testOutput.slice(0, 2000)}

¿El fix parece haber resuelto el problema?`,
      },
    ],
  });

  return response.content
    .filter((b) => b.type === 'text')
    .map((b) => (b as any).text)
    .join('')
    .trim();
}

// ─── Main ─────────────────────────────────────
async function main() {
  console.log('✅ [VALIDATOR] Starting post-fix validation...\n');

  // Leer issues que tienen un PR/fix aplicado
  const issuesFile = 'reports/fixed-issues.json';
  if (!fs.existsSync(issuesFile)) {
    console.log('[VALIDATOR] No fixed-issues.json found. Nothing to validate.');
    return;
  }

  const issues: JiraIssue[] = JSON.parse(fs.readFileSync(issuesFile, 'utf-8'));
  const toValidate = issues.filter((i) => i.status === 'In Review' && i.fixBranch);

  console.log(`[VALIDATOR] ${toValidate.length} issues to validate`);

  const summary = { closed: 0, reopened: 0, errors: 0 };

  for (const issue of toValidate) {
    console.log(`\n[VALIDATOR] Validating ${issue.key}: ${issue.summary}`);

    try {
      const { passed, output } = await reRunTests(issue);
      const analysis = await analyzeResult(issue, output, passed);

      if (passed) {
        // ✅ Cerrar issue en Jira
        await transitionIssue(issue.key, 'Done');
        await addComment(
          issue.key,
          `✅ *Validator Agent* verificó el fix.\n\nTodos los tests del módulo *${issue.component}* pasan correctamente.\n\n*Análisis:* ${analysis}\n\nIssue cerrado automáticamente.`
        );
        console.log(`[VALIDATOR] ✅ ${issue.key} — CLOSED`);
        summary.closed++;
      } else {
        // ❌ Reabrir issue
        await transitionIssue(issue.key, 'Open');
        await addComment(
          issue.key,
          `❌ *Validator Agent* detectó que el fix NO resolvió el problema.\n\nTests fallando en módulo *${issue.component}*.\n\n*Análisis:* ${analysis}\n\nIssue reabierto. El fix automático fue insuficiente — requiere revisión manual.\n\nOutput:\n{code}\n${output.slice(0, 1000)}\n{code}`
        );
        console.log(`[VALIDATOR] ❌ ${issue.key} — REOPENED`);
        summary.reopened++;
      }
    } catch (err) {
      console.error(`[VALIDATOR] Error validating ${issue.key}:`, err);
      await addComment(
        issue.key,
        `⚠️ *Validator Agent* falló al ejecutar validación.\nError: ${err}`
      ).catch(() => {});
      summary.errors++;
    }
  }

  // Resumen final
  const msg = `Validator completó: *${summary.closed} cerrados* ✅ | *${summary.reopened} reabiertos* ❌ | *${summary.errors} errores* ⚠️`;
  console.log(`\n📊 ${msg}`);

  if (summary.closed > 0 || summary.reopened > 0) {
    await notifySlack(msg, summary.reopened > 0 ? 'high' : 'success');
  }

  console.log('\n✅ [VALIDATOR] Done.');
}

main().catch((err) => {
  console.error('[VALIDATOR] Fatal:', err);
  process.exit(1);
});
