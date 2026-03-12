// ─────────────────────────────────────────────
//  emprendy.ai — Agent 1: INSPECTOR
//  Análisis estático del repositorio en cada PR
// ─────────────────────────────────────────────
import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import Anthropic from '@anthropic-ai/sdk';
import { Finding, Severity, Layer, Module } from '../shared/types';
import { publish, notifySlack } from '../shared/bus';
import { createIssueFromFinding, findDuplicateIssue } from '../shared/jira-mcp';

const client = new Anthropic();
const DRY_RUN = process.argv.includes('--dry-run');
const REPORT_DIR = path.resolve(process.cwd(), 'reports');

// ─── 1. Recopilar hallazgos de herramientas ───
function runESLint(): Finding[] {
  try {
    execSync('npx eslint . --format json -o reports/eslint.json --max-warnings 0', {
      stdio: 'pipe',
    });
  } catch (_) {
    /* command can exit with code 1 when warnings are present */
  }

  if (!fs.existsSync('reports/eslint.json')) return [];
  const raw: any[] = JSON.parse(fs.readFileSync('reports/eslint.json', 'utf-8'));
  const findings: Finding[] = [];

  for (const fileResult of raw) {
    for (const msg of fileResult.messages) {
      findings.push({
        id: `eslint-${fileResult.filePath}-${msg.line}`,
        type: 'lint',
        severity: msg.severity === 2 ? 'high' : 'medium',
        layer: detectLayer(fileResult.filePath),
        module: detectModule(fileResult.filePath),
        file: fileResult.filePath,
        line: msg.line ?? 0,
        description: msg.message,
        codeSnippet: msg.source ?? '',
        rule: msg.ruleId ?? undefined,
        fix: msg.fix?.text ?? undefined,
        timestamp: new Date().toISOString(),
      });
    }
  }
  return findings;
}

function runTypeCheck(): Finding[] {
  try {
    execSync('npx tsc --noEmit --pretty false 2> reports/tsc.txt', { stdio: 'pipe' });
    return [];
  } catch (_) {}

  if (!fs.existsSync('reports/tsc.txt')) return [];
  const lines = fs.readFileSync('reports/tsc.txt', 'utf-8').split('\n');
  const findings: Finding[] = [];
  const regex = /^(.+)\((\d+),\d+\): error (TS\d+): (.+)$/;

  for (const line of lines) {
    const match = line.match(regex);
    if (!match) continue;
    const [, file, lineNum, code, msg] = match;
    findings.push({
      id: `tsc-${file}-${lineNum}`,
      type: 'type-error',
      severity: 'high',
      layer: detectLayer(file),
      module: detectModule(file),
      file,
      line: parseInt(lineNum),
      description: `${code}: ${msg}`,
      codeSnippet: '',
      timestamp: new Date().toISOString(),
    });
  }
  return findings;
}

function runDependencyAudit(): Finding[] {
  try {
    execSync('npm audit --json > reports/audit.json 2>/dev/null', { stdio: 'pipe' });
  } catch (_) {}

  if (!fs.existsSync('reports/audit.json')) return [];
  const raw = JSON.parse(fs.readFileSync('reports/audit.json', 'utf-8'));
  const findings: Finding[] = [];

  for (const [name, vuln] of Object.entries<any>(raw.vulnerabilities ?? {})) {
    if (!['critical', 'high'].includes(vuln.severity)) continue;
    findings.push({
      id: `audit-${name}`,
      type: 'vulnerability',
      severity: vuln.severity as Severity,
      layer: 'infra',
      module: 'api',
      file: 'package.json',
      line: 0,
      description: `Vulnerabilidad en dependencia "${name}": ${vuln.via?.[0]?.title ?? vuln.severity}`,
      codeSnippet: `"${name}": "${vuln.range}"`,
      timestamp: new Date().toISOString(),
    });
  }
  return findings;
}

// ─── 2. Enriquecer con Claude ─────────────────
async function enrichWithClaude(findings: Finding[]): Promise<Finding[]> {
  if (findings.length === 0) return [];

  const response = await client.messages.create({
    model: 'claude-opus-4-5',
    max_tokens: 4000,
    system: `Eres un senior developer revisando hallazgos de análisis estático para emprendy.ai.
Para cada hallazgo:
1. Ajusta la severidad si crees que está mal asignada
2. Añade contexto de impacto en el negocio
3. Sugiere el approach de fix más adecuado
4. Detecta si es un falso positivo (marca como severity: "low" y description: "FALSE_POSITIVE: ...")
Responde en JSON con el array de findings enriquecidos, misma estructura.`,

    messages: [
      {
        role: 'user',
        content: JSON.stringify(findings.slice(0, 20)), // max 20 para no exceder tokens
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
    console.warn('[INSPECTOR] Claude enrichment parse failed, using raw findings');
    return findings;
  }
}

// ─── 3. Helpers ───────────────────────────────
function detectLayer(filePath: string): Layer {
  if (
    filePath.includes('/components/') ||
    filePath.includes('/pages/') ||
    filePath.includes('/app/') ||
    filePath.endsWith('.tsx') ||
    filePath.endsWith('.jsx')
  )
    return 'frontend';
  if (
    filePath.includes('/api/') ||
    filePath.includes('/routes/') ||
    filePath.includes('/controllers/') ||
    filePath.includes('/services/')
  )
    return 'backend';
  if (filePath.includes('docker') || filePath.includes('nginx') || filePath.includes('.yml'))
    return 'infra';
  return 'unknown';
}

function detectModule(filePath: string): Module {
  if (filePath.includes('store') || filePath.includes('tienda')) return 'store';
  if (filePath.includes('restaurant') || filePath.includes('menu')) return 'restaurant';
  if (filePath.includes('service') || filePath.includes('servicio')) return 'service';
  if (filePath.includes('dashboard') || filePath.includes('admin')) return 'dashboard';
  if (filePath.includes('auth') || filePath.includes('login')) return 'auth';
  if (filePath.includes('api') || filePath.includes('routes')) return 'api';
  if (filePath.includes('db') || filePath.includes('prisma') || filePath.includes('migration'))
    return 'db';
  return 'api';
}

// ─── 4. Main ─────────────────────────────────
async function main() {
  console.log('🔍 [INSPECTOR] Starting static analysis...\n');
  fs.mkdirSync(REPORT_DIR, { recursive: true });

  // Recopilar hallazgos
  const eslintFindings = runESLint();
  const tscFindings = runTypeCheck();
  const auditFindings = runDependencyAudit();
  const allRaw = [...eslintFindings, ...tscFindings, ...auditFindings];

  console.log(
    `Found: ${eslintFindings.length} lint | ${tscFindings.length} type | ${auditFindings.length} vuln`
  );

  if (allRaw.length === 0) {
    console.log('✅ No findings. Repository is clean.');
    return;
  }

  // Enriquecer con Claude
  const findings = await enrichWithClaude(allRaw);
  const critical = findings.filter((f) => f.severity === 'critical');
  const high = findings.filter((f) => f.severity === 'high');

  // Guardar reporte
  fs.writeFileSync('reports/inspector-report.json', JSON.stringify(findings, null, 2));
  console.log(
    `\n📊 Report: ${findings.length} findings (${critical.length} critical, ${high.length} high)`
  );

  if (DRY_RUN) {
    console.log('\n[DRY RUN] Skipping Jira issue creation.');
    console.log(JSON.stringify(findings.slice(0, 3), null, 2));
    return;
  }

  // Crear issues en Jira (solo critical y high, con deduplicación)
  let created = 0;
  for (const finding of [...critical, ...high]) {
    if (finding.description.startsWith('FALSE_POSITIVE')) continue;

    const existing = await findDuplicateIssue(finding.description, finding.file);
    if (existing) {
      console.log(`[INSPECTOR] Duplicate found: ${existing} — skipping`);
      continue;
    }

    const key = await createIssueFromFinding(finding);
    console.log(`[INSPECTOR] Created Jira issue: ${key} for ${finding.file}:${finding.line}`);
    created++;
  }

  // Notificar
  if (critical.length > 0) {
    await notifySlack(
      `Inspector encontró *${critical.length} issues críticos* en el último análisis. ${created} issues creados en Jira.`,
      'critical'
    );
  }

  // Publicar al bus para que QA Runner pueda reaccionar
  publish('inspector', 'qa-runner', 'INSPECTION_COMPLETE', {
    total: findings.length,
    critical: critical.length,
    high: high.length,
    report: 'reports/inspector-report.json',
  });

  console.log('\n✅ [INSPECTOR] Done.');
}

main().catch((err) => {
  console.error('[INSPECTOR] Fatal error:', err);
  process.exit(1);
});
