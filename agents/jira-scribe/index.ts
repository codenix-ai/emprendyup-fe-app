// ─────────────────────────────────────────────
//  emprendy.ai — Agent 3: JIRA SCRIBE
//  Consume reportes y crea issues en Jira
// ─────────────────────────────────────────────
import * as fs from 'fs';
import { Finding, TestResult } from '../shared/types';
import { consume, publish } from '../shared/bus';
import {
  createIssueFromFinding,
  createIssueFromTestFailure,
  findDuplicateIssue,
} from '../shared/jira-mcp';

async function main() {
  console.log('📋 [JIRA SCRIBE] Processing reports...\n');

  let totalCreated = 0;

  // ── Procesar hallazgos del Inspector ──────
  if (fs.existsSync('reports/inspector-report.json')) {
    const findings: Finding[] = JSON.parse(
      fs.readFileSync('reports/inspector-report.json', 'utf-8')
    );
    const actionable = findings.filter(
      (f) =>
        ['critical', 'high'].includes(f.severity) && !f.description.startsWith('FALSE_POSITIVE')
    );

    console.log(`[JIRA SCRIBE] Inspector findings: ${actionable.length} actionable`);

    for (const f of actionable) {
      const dup = await findDuplicateIssue(f.description, f.file);
      if (dup) {
        console.log(`  ↳ Dup ${dup} — skip`);
        continue;
      }

      const key = await createIssueFromFinding(f);
      console.log(`  ↳ Created ${key} [${f.severity}] ${f.file}:${f.line}`);
      totalCreated++;
    }
  }

  // ── Procesar fallas del QA Runner ─────────
  if (fs.existsSync('reports/qa-runner-report.json')) {
    const results: TestResult[] = JSON.parse(
      fs.readFileSync('reports/qa-runner-report.json', 'utf-8')
    );
    const failed = results.filter((r) => r.status === 'failed');

    console.log(`\n[JIRA SCRIBE] QA failures: ${failed.length}`);

    for (const r of failed) {
      const dup = await findDuplicateIssue(r.error ?? r.scenario, r.module);
      if (dup) {
        console.log(`  ↳ Dup ${dup} — skip`);
        continue;
      }

      const key = await createIssueFromTestFailure(r);
      console.log(`  ↳ Created ${key} [${r.module}] "${r.scenario}"`);
      totalCreated++;
    }
  }

  console.log(`\n✅ [JIRA SCRIBE] Done. ${totalCreated} issues created.`);

  // Publicar al bus
  publish('jira-scribe', 'fe-fixer', 'ISSUES_READY', { count: totalCreated });
  publish('jira-scribe', 'be-fixer', 'ISSUES_READY', { count: totalCreated });
}

main().catch((err) => {
  console.error('[JIRA SCRIBE] Error:', err);
  process.exit(1);
});
