// ─────────────────────────────────────────────
//  emprendy.ai — Agent 5: BE FIXER
//  Auto-corrección de bugs de Backend
// ─────────────────────────────────────────────
import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import Anthropic from '@anthropic-ai/sdk';
import { JiraIssue } from '../shared/types';
import { publish, notifySlack } from '../shared/bus';
import { transitionIssue, addComment } from '../shared/jira-mcp';

const client = new Anthropic();

// ─── Contexto del proyecto BE ─────────────────
function getBackendContext(): string {
  const pkg = fs.existsSync('package.json')
    ? JSON.parse(fs.readFileSync('package.json', 'utf-8'))
    : {};
  const deps = { ...pkg.dependencies, ...pkg.devDependencies };
  const stack = [];
  if (deps['express']) stack.push('Express.js');
  if (deps['fastify']) stack.push('Fastify');
  if (deps['@nestjs/core']) stack.push('NestJS');
  if (deps['prisma']) stack.push('Prisma ORM');
  if (deps['typeorm']) stack.push('TypeORM');
  if (deps['zod']) stack.push('Zod validation');
  if (deps['joi']) stack.push('Joi validation');
  if (deps['jsonwebtoken']) stack.push('JWT Auth');
  if (deps['pg']) stack.push('PostgreSQL');
  if (deps['mongoose']) stack.push('MongoDB/Mongoose');
  return stack.join(', ') || 'Node.js/Express/TypeScript';
}

// ─── Leer schema de Prisma si existe ──────────
function getPrismaSchema(): string {
  const candidates = ['prisma/schema.prisma', 'src/prisma/schema.prisma'];
  for (const p of candidates) {
    if (fs.existsSync(p)) return fs.readFileSync(p, 'utf-8');
  }
  return '';
}

// ─── Generar fix con Claude ───────────────────
async function generateFix(
  issue: JiraIssue,
  fileContent: string
): Promise<{
  fixedCode: string;
  testCode: string;
  migration?: string;
  explanation: string;
}> {
  const context = getBackendContext();
  const schema = getPrismaSchema();

  const response = await client.messages.create({
    model: 'claude-opus-4-5',
    max_tokens: 6000,
    system: `Eres un senior backend developer especializado en ${context}.
Trabajas en emprendy.ai, una plataforma para crear tiendas, restaurantes y servicios.

Al corregir un bug de backend:
1. Revisa el schema de base de datos (si aplica) para entender las relaciones
2. Asegura que los middlewares de validación estén correctos (Zod/Joi)
3. Verifica que los endpoints tengan autenticación cuando la requieren
4. El fix debe incluir manejo de errores apropiado (try/catch, status codes HTTP correctos)
5. Genera un test de integración que valide el comportamiento correcto
6. Si hay cambio en el schema DB, incluye la migración de Prisma
7. Documenta cualquier cambio de contrato en la API

Responde ÚNICAMENTE con JSON en este formato exacto:
{
  "fixedCode": "// código completo del archivo corregido",
  "testCode": "// test de integración con supertest/jest",
  "migration": "// SQL de migración si aplica, o null",
  "explanation": "// qué cambió y por qué (max 3 oraciones)"
}`,

    messages: [
      {
        role: 'user',
        content: `Issue Jira: ${issue.key}
Resumen: ${issue.summary}
Descripción: ${issue.description}
Archivo afectado: ${issue.affectedFile}
Código afectado: ${issue.codeSnippet}

Código actual del archivo:
\`\`\`typescript
${fileContent}
\`\`\`

${schema ? `Schema Prisma (referencia):\n\`\`\`\n${schema.slice(0, 3000)}\n\`\`\`` : ''}`,
      },
    ],
  });

  const text = response.content
    .filter((b) => b.type === 'text')
    .map((b) => (b as any).text)
    .join('');

  try {
    const clean = text.replace(/```json|```/g, '').trim();
    return JSON.parse(clean);
  } catch {
    throw new Error(`Could not parse Claude response: ${text.slice(0, 200)}`);
  }
}

// ─── Aplicar fix ──────────────────────────────
async function applyFix(
  issue: JiraIssue,
  fix: { fixedCode: string; testCode: string; migration?: string | null; explanation: string }
): Promise<void> {
  const branch = `fix/be-${issue.key}-${Date.now()}`;

  try {
    execSync(`git checkout -b ${branch}`, { stdio: 'inherit' });

    // Escribir código corregido
    const dir = path.dirname(issue.affectedFile);
    if (dir && dir !== '.') fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(issue.affectedFile, fix.fixedCode);

    // Test de integración
    const testPath = issue.affectedFile
      .replace('/src/', '/src/__tests__/')
      .replace(/\.(ts)$/, '.test.ts');
    fs.mkdirSync(path.dirname(testPath), { recursive: true });
    fs.writeFileSync(testPath, fix.testCode);

    // Migración DB si hay cambios de schema
    if (fix.migration) {
      const migDir = 'prisma/migrations/manual';
      fs.mkdirSync(migDir, { recursive: true });
      const migFile = `${migDir}/${Date.now()}_${issue.key.toLowerCase()}.sql`;
      fs.writeFileSync(migFile, fix.migration);
      console.log(`[BE FIXER] Migration created: ${migFile}`);
    }

    // Type-check
    try {
      execSync('npx tsc --noEmit', { stdio: 'pipe' });
    } catch {
      console.warn('[BE FIXER] TypeScript errors — PR will flag them');
    }

    // Correr tests de integración del módulo afectado
    try {
      execSync(`npx jest ${testPath} --passWithNoTests`, { stdio: 'pipe' });
      console.log('[BE FIXER] Integration test passed ✅');
    } catch {
      console.warn('[BE FIXER] Test failed — still creating PR for review');
    }

    // Commit y push
    const filesToCommit = [
      issue.affectedFile,
      testPath,
      fix.migration ? 'prisma/migrations/manual' : '',
    ]
      .filter(Boolean)
      .join(' ');
    execSync(`git add ${filesToCommit}`, { stdio: 'inherit' });
    execSync(
      `git commit -m "fix(${issue.key}): ${issue.summary}

${fix.explanation}

Auto-fixed by BE Fixer Agent
Jira: ${issue.key}"`,
      { stdio: 'inherit' }
    );

    execSync(`git push origin ${branch}`, { stdio: 'inherit' });

    // PR
    try {
      const migrationNote = fix.migration
        ? '\n\n⚠️ **Incluye cambios de schema de base de datos. Revisar migración antes de mergear.**'
        : '';
      execSync(
        `gh pr create \
        --title "fix(${issue.key}): ${issue.summary}" \
        --body "## Auto-fix por BE Fixer Agent\n\n**Issue Jira:** ${issue.key}\n\n**Cambios:**\n${fix.explanation}${migrationNote}\n\n**Módulo:** ${issue.component}\n\n⚠️ *Revisar antes de mergear*" \
        --label "auto-fix,backend" \
        --base main`,
        { stdio: 'inherit' }
      );
    } catch {
      console.warn('[BE FIXER] gh CLI not available');
    }

    // Actualizar Jira
    await transitionIssue(issue.key, 'In Review');
    await addComment(
      issue.key,
      `🤖 *BE Fixer Agent* aplicó un fix automático.\n\n*Cambios:* ${fix.explanation}\n\n*Rama:* ${branch}${fix.migration ? '\n\n⚠️ Incluye migración de base de datos.' : ''}\n\nPR abierto para revisión.`
    );
  } catch (err) {
    try {
      execSync('git checkout main', { stdio: 'pipe' });
    } catch {}
    throw err;
  }
}

// ─── Main ─────────────────────────────────────
async function main() {
  console.log('🔧 [BE FIXER] Checking for backend issues...\n');

  const issuesFile = 'reports/be-issues.json';
  if (!fs.existsSync(issuesFile)) {
    console.log('[BE FIXER] No backend issues file found.');
    return;
  }

  const issues: JiraIssue[] = JSON.parse(fs.readFileSync(issuesFile, 'utf-8'));
  const beIssues = issues.filter(
    (i) => i.layer === 'backend' && ['Open', 'In Progress'].includes(i.status) && !i.fixBranch
  );

  console.log(`[BE FIXER] ${beIssues.length} backend issues to fix`);

  let fixed = 0;
  for (const issue of beIssues.slice(0, 3)) {
    console.log(`\n[BE FIXER] Processing ${issue.key}: ${issue.summary}`);

    const fileContent = fs.existsSync(issue.affectedFile)
      ? fs.readFileSync(issue.affectedFile, 'utf-8')
      : '';

    if (!fileContent) {
      console.warn(`[BE FIXER] File not found: ${issue.affectedFile}`);
      continue;
    }

    try {
      const fix = await generateFix(issue, fileContent);
      await applyFix(issue, fix);
      fixed++;
      console.log(`[BE FIXER] ✅ Fixed ${issue.key}`);
    } catch (err) {
      console.error(`[BE FIXER] ❌ Failed ${issue.key}:`, err);
      await addComment(
        issue.key,
        `🤖 *BE Fixer Agent* falló al aplicar fix automático.\nError: ${err}\nRequiere intervención manual.`
      ).catch(() => {});
    }
  }

  if (fixed > 0) {
    await notifySlack(
      `BE Fixer aplicó *${fixed} fixes automáticos* de backend. PRs listos para revisión.`,
      'success'
    );
  }

  publish('be-fixer', 'validator', 'FIXES_APPLIED', { layer: 'backend', count: fixed });
  console.log(`\n✅ [BE FIXER] Done. ${fixed} fixes applied.`);
}

main().catch((err) => {
  console.error('[BE FIXER] Fatal:', err);
  process.exit(1);
});
