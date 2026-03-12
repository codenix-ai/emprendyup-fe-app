// ─────────────────────────────────────────────
//  emprendy.ai — Agent 2: QA RUNNER
//  Regresión E2E completa con Playwright
// ─────────────────────────────────────────────
import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import Anthropic from '@anthropic-ai/sdk';
import { TestResult } from '../shared/types';
import { publish, consume, notifySlack } from '../shared/bus';
import { createIssueFromTestFailure, findDuplicateIssue } from '../shared/jira-mcp';

const client = new Anthropic();
const REPORT_DIR = path.resolve(process.cwd(), 'reports');
const BASE_URL = process.env.BASE_URL ?? 'http://localhost:3000';

// ─── 1. Ejecutar tests Playwright ────────────
function runPlaywright(): TestResult[] {
  try {
    execSync(`npx playwright test tests/e2e/ --reporter=json --output=reports/playwright.json`, {
      stdio: 'inherit',
    });
  } catch (_) {
    /* playwright exits 1 on test failures */
  }

  if (!fs.existsSync('reports/playwright.json')) return [];
  const raw = JSON.parse(fs.readFileSync('reports/playwright.json', 'utf-8'));

  const results: TestResult[] = [];
  for (const suite of raw.suites ?? []) {
    for (const spec of suite.specs ?? []) {
      for (const test of spec.tests ?? []) {
        const failed = test.results?.some((r: any) => r.status === 'failed');
        results.push({
          id: spec.id,
          module: detectModule(suite.file),
          scenario: spec.title,
          status: failed ? 'failed' : 'passed',
          duration: test.results?.[0]?.duration ?? 0,
          error: test.results?.[0]?.error?.message,
          screenshot: test.results?.[0]?.attachments?.find(
            (a: any) => a.contentType === 'image/png'
          )?.path,
          steps: (test.results?.[0]?.steps ?? []).map((s: any) => ({
            action: s.title,
            status: s.error ? 'failed' : 'passed',
            error: s.error?.message,
          })),
          timestamp: new Date().toISOString(),
        });
      }
    }
  }
  return results;
}

// ─── 2. Analizar fallas con Claude ───────────
async function analyzeFailures(failed: TestResult[]): Promise<TestResult[]> {
  if (failed.length === 0) return [];

  const response = await client.messages.create({
    model: 'claude-opus-4-5',
    max_tokens: 4000,
    system: `Eres un QA engineer senior analizando fallas de tests E2E en emprendy.ai.
Para cada test fallido:
1. Clasifica si es un bug real, dato de prueba incorrecto o problema de ambiente
2. Estima la severidad: critical (bloquea flujo de negocio), high, medium, low
3. Detecta si es flaky test (por timing/red)
4. Sugiere el área de código más probable del bug (frontend/backend)
Responde en JSON: array con los mismos TestResult enriquecidos con campos extra:
- analysisType: "real-bug" | "test-data" | "environment" | "flaky"
- estimatedSeverity: Severity
- suggestedLayer: Layer
- rootCauseHint: string`,

    messages: [
      {
        role: 'user',
        content: JSON.stringify(failed.slice(0, 15)),
      },
    ],
  });

  try {
    const text = response.content
      .filter((b) => b.type === 'text')
      .map((b) => (b as any).text)
      .join('');
    const clean = text.replace(/```json|```/g, '').trim();
    return JSON.parse(clean);
  } catch {
    return failed;
  }
}

// ─── 3. Helpers ──────────────────────────────
function detectModule(filePath: string): any {
  if (filePath.includes('store')) return 'store';
  if (filePath.includes('restaurant')) return 'restaurant';
  if (filePath.includes('service')) return 'service';
  if (filePath.includes('dashboard')) return 'dashboard';
  if (filePath.includes('auth')) return 'auth';
  return 'api';
}

// ─── 4. Main ─────────────────────────────────
async function main() {
  console.log('🧪 [QA RUNNER] Starting full regression suite...\n');
  fs.mkdirSync(REPORT_DIR, { recursive: true });

  // Verificar si Inspector ya corrió y hay mensajes pendientes
  const inspectorMsgs = consume('qa-runner', 'INSPECTION_COMPLETE');
  if (inspectorMsgs.length > 0) {
    console.log(`[QA RUNNER] Triggered by Inspector: ${JSON.stringify(inspectorMsgs[0].payload)}`);
  }

  // Correr la suite completa
  const results = runPlaywright();
  const failed = results.filter((r) => r.status === 'failed');
  const passed = results.filter((r) => r.status === 'passed');

  console.log(`\n📊 Results: ${passed.length} passed | ${failed.length} failed`);

  // Guardar reporte
  fs.writeFileSync('reports/qa-runner-report.json', JSON.stringify(results, null, 2));

  if (failed.length === 0) {
    console.log('✅ All tests passed! No Jira issues needed.');
    await notifySlack(
      `Regresión completa: *${passed.length} tests pasando* ✅ — 0 fallas`,
      'success'
    );
    return;
  }

  // Analizar fallas con Claude
  const analyzed = await analyzeFailures(failed);
  const realBugs = analyzed.filter((r: any) => r.analysisType === 'real-bug' || !r.analysisType);

  console.log(
    `\n🐛 Real bugs: ${realBugs.length} | Flaky/env: ${analyzed.length - realBugs.length}`
  );

  // Crear issues en Jira para bugs reales
  let created = 0;
  for (const result of realBugs) {
    const existing = await findDuplicateIssue(result.error ?? result.scenario, result.module);
    if (existing) {
      console.log(`[QA RUNNER] Duplicate: ${existing} — skipping`);
      continue;
    }

    const key = await createIssueFromTestFailure(result);
    console.log(`[QA RUNNER] Created Jira issue: ${key} for "${result.scenario}"`);
    created++;
  }

  // Notificar
  await notifySlack(
    `Regresión completa: *${failed.length} tests fallando* — ${created} issues creados en Jira.`,
    realBugs.some((r: any) => r.estimatedSeverity === 'critical') ? 'critical' : 'high'
  );

  // Publicar al bus
  publish('qa-runner', 'jira-scribe', 'REGRESSION_COMPLETE', {
    total: results.length,
    failed: failed.length,
    created,
    report: 'reports/qa-runner-report.json',
  });

  console.log('\n✅ [QA RUNNER] Done.');
}

main().catch((err) => {
  console.error('[QA RUNNER] Fatal error:', err);
  process.exit(1);
});
