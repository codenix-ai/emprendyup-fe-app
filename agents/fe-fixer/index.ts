// ─────────────────────────────────────────────
//  emprendy.ai — Agent 4: FE FIXER
//  Auto-corrección de bugs de Frontend
// ─────────────────────────────────────────────
import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import Anthropic from '@anthropic-ai/sdk';
import { JiraIssue } from '../shared/types';
import { consume, publish, notifySlack } from '../shared/bus';
import { transitionIssue, addComment } from '../shared/jira-mcp';

const client = new Anthropic();

// ─── Leer el archivo afectado ─────────────────
function readAffectedFile(filePath: string): string {
  try {
    return fs.existsSync(filePath) ? fs.readFileSync(filePath, 'utf-8') : '';
  } catch {
    return '';
  }
}

// ─── Detectar contexto del proyecto FE ────────
function detectProjectContext(): string {
  const pkg = fs.existsSync('package.json')
    ? JSON.parse(fs.readFileSync('package.json', 'utf-8'))
    : {};

  const deps = { ...pkg.dependencies, ...pkg.devDependencies };
  const stack = [];
  if (deps['next']) stack.push('Next.js ' + (deps['next'] || ''));
  if (deps['react']) stack.push('React ' + (deps['react'] || ''));
  if (deps['typescript']) stack.push('TypeScript');
  if (deps['tailwindcss']) stack.push('Tailwind CSS');
  if (deps['@tanstack/react-query']) stack.push('TanStack Query');
  if (deps['zustand']) stack.push('Zustand');
  if (deps['zod']) stack.push('Zod');

  return stack.join(', ') || 'React/TypeScript';
}

// ─── Generar el fix con Claude ────────────────
async function generateFix(
  issue: JiraIssue,
  fileContent: string
): Promise<{
  fixedCode: string;
  testCode: string;
  explanation: string;
}> {
  const context = detectProjectContext();

  const response = await client.messages.create({
    model: 'claude-opus-4-5',
    max_tokens: 6000,
    system: `Eres un senior frontend developer especializado en ${context}.
Trabajas en emprendy.ai, una plataforma para crear tiendas, restaurantes y servicios.

Al corregir un bug de frontend:
1. Respeta estrictamente el estilo de código existente
2. No introduzcas nuevas dependencias sin justificación
3. El fix debe ser mínimo y quirúrgico — cambia solo lo necesario
4. Incluye un test unitario que valide el fix
5. Asegúrate de que el TypeScript compile sin errores
6. Si hay implicaciones de accesibilidad, corrígelas también

Responde ÚNICAMENTE con JSON en este formato exacto:
{
  "fixedCode": "// código completo del archivo corregido",
  "testCode": "// código del test unitario",
  "explanation": "// qué cambió y por qué (max 3 oraciones)"
}`,

    messages: [
      {
        role: 'user',
        content: `Issue Jira: ${issue.key}
Resumen: ${issue.summary}
Descripción: ${issue.description}
Archivo afectado: ${issue.affectedFile}

Código actual del archivo:
\`\`\`typescript
${fileContent}
\`\`\``,
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

// ─── Aplicar fix al sistema de archivos ──────
async function applyFix(
  issue: JiraIssue,
  fix: { fixedCode: string; testCode: string; explanation: string }
): Promise<void> {
  const branch = `fix/fe-${issue.key}-${Date.now()}`;

  try {
    // Crear rama
    execSync(`git checkout -b ${branch}`, { stdio: 'inherit' });

    // Escribir el código corregido
    const dir = path.dirname(issue.affectedFile);
    if (dir && dir !== '.') fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(issue.affectedFile, fix.fixedCode);

    // Escribir test
    const testPath = issue.affectedFile.replace(/\.(ts|tsx)$/, '.test.$1');
    fs.writeFileSync(testPath, fix.testCode);

    // Ejecutar lint y type-check en los archivos modificados
    try {
      execSync(`npx eslint ${issue.affectedFile} --fix`, { stdio: 'pipe' });
    } catch {
      /* lint issues will be in the PR for review */
    }

    try {
      execSync('npx tsc --noEmit', { stdio: 'pipe' });
    } catch (e) {
      console.warn('[FE FIXER] TypeScript errors remain — PR will flag them');
    }

    // Commit
    execSync(`git add ${issue.affectedFile} ${testPath}`, { stdio: 'inherit' });
    execSync(
      `git commit -m "fix(${issue.key}): ${issue.summary}

${fix.explanation}

Auto-fixed by FE Fixer Agent
Jira: ${issue.key}"`,
      { stdio: 'inherit' }
    );

    // Push
    execSync(`git push origin ${branch}`, { stdio: 'inherit' });

    // Crear PR vía GitHub CLI (si disponible)
    try {
      execSync(
        `gh pr create \
        --title "fix(${issue.key}): ${issue.summary}" \
        --body "## Auto-fix por FE Fixer Agent\n\n**Issue Jira:** ${issue.key}\n\n**Cambios:**\n${fix.explanation}\n\n**Módulo:** ${issue.component}\n\n⚠️ *Revisar antes de mergear*" \
        --label "auto-fix,frontend" \
        --base main`,
        { stdio: 'inherit' }
      );

      console.log(`[FE FIXER] PR creado para ${issue.key}`);
    } catch {
      console.warn('[FE FIXER] gh CLI not available — push branch manually');
    }

    // Actualizar issue en Jira
    await transitionIssue(issue.key, 'In Review');
    await addComment(
      issue.key,
      `🤖 *FE Fixer Agent* aplicó un fix automático.\n\n*Cambios:* ${fix.explanation}\n\n*Rama:* ${branch}\n\nPR abierto para revisión.`
    );
  } catch (err) {
    // Volver a main en caso de error
    try {
      execSync('git checkout main', { stdio: 'pipe' });
    } catch {}
    throw err;
  }
}

// ─── Main ─────────────────────────────────────
async function main() {
  console.log('⚛️  [FE FIXER] Checking for frontend issues...\n');

  // Leer issues de Jira asignados a FE
  // En producción, esto vendría del MCP de Jira; aquí simulamos desde un archivo
  const issuesFile = 'reports/fe-issues.json';
  if (!fs.existsSync(issuesFile)) {
    console.log('[FE FIXER] No frontend issues file found. Waiting for Jira Scribe...');
    return;
  }

  const issues: JiraIssue[] = JSON.parse(fs.readFileSync(issuesFile, 'utf-8'));
  const feIssues = issues.filter(
    (i) => i.layer === 'frontend' && ['Open', 'In Progress'].includes(i.status) && !i.fixBranch
  );

  console.log(`[FE FIXER] ${feIssues.length} frontend issues to fix`);

  let fixed = 0;
  for (const issue of feIssues.slice(0, 3)) {
    // máximo 3 fixes por run
    console.log(`\n[FE FIXER] Processing ${issue.key}: ${issue.summary}`);

    const fileContent = readAffectedFile(issue.affectedFile);
    if (!fileContent) {
      console.warn(`[FE FIXER] File not found: ${issue.affectedFile} — skipping`);
      continue;
    }

    try {
      const fix = await generateFix(issue, fileContent);
      await applyFix(issue, fix);
      fixed++;
      console.log(`[FE FIXER] ✅ Fixed ${issue.key}`);
    } catch (err) {
      console.error(`[FE FIXER] ❌ Failed to fix ${issue.key}:`, err);
      await addComment(
        issue.key,
        `🤖 *FE Fixer Agent* intentó aplicar un fix automático pero falló.\n\nError: ${err}\n\nRequiere intervención manual.`
      ).catch(() => {});
    }
  }

  if (fixed > 0) {
    await notifySlack(
      `FE Fixer aplicó *${fixed} fixes automáticos* de frontend. PRs listos para revisión.`,
      'success'
    );
  }

  publish('fe-fixer', 'validator', 'FIXES_APPLIED', { layer: 'frontend', count: fixed });
  console.log(`\n✅ [FE FIXER] Done. ${fixed} fixes applied.`);
}

main().catch((err) => {
  console.error('[FE FIXER] Fatal:', err);
  process.exit(1);
});
