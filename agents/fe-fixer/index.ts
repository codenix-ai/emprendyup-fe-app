// ─────────────────────────────────────────────
//  emprendy.ai — Agent 4: FE FIXER
//  Auto-corrección local de bugs de Frontend
// ─────────────────────────────────────────────
import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';
import Anthropic from '@anthropic-ai/sdk';
import { Task } from '../shared/types';
import { getPendingTasks, updateTask, printTaskSummary } from '../shared/task-queue';
import { notifySlack } from '../shared/bus';
import { transitionIssue, addComment } from '../shared/jira-mcp';

const client = new Anthropic();
const MAX_FIXES = parseInt(process.env.MAX_FIXES ?? '5', 10);

function readFile(filePath: string): string {
  try {
    return fs.existsSync(filePath) ? fs.readFileSync(filePath, 'utf-8') : '';
  } catch {
    return '';
  }
}

function detectProjectContext(): string {
  const pkg = fs.existsSync('package.json')
    ? JSON.parse(fs.readFileSync('package.json', 'utf-8'))
    : {};
  const deps = { ...pkg.dependencies, ...pkg.devDependencies };
  const stack: string[] = [];
  if (deps['next']) stack.push('Next.js');
  if (deps['react']) stack.push('React');
  if (deps['typescript']) stack.push('TypeScript');
  if (deps['tailwindcss']) stack.push('Tailwind CSS');
  if (deps['@tanstack/react-query']) stack.push('TanStack Query');
  if (deps['zod']) stack.push('Zod');
  return stack.join(', ') || 'React/TypeScript';
}

async function generateFix(
  task: Task,
  fileContent: string
): Promise<{ fixedCode: string; explanation: string }> {
  const context = detectProjectContext();

  const response = await client.messages.create({
    model: 'claude-opus-4-5',
    max_tokens: 6000,
    system: `Eres un senior frontend developer especializado en ${context}.
Trabajas en emprendy.ai, una plataforma para crear tiendas, restaurantes y servicios.

Al corregir un bug de frontend:
1. Respeta estrictamente el estilo de código existente
2. No introduzcas nuevas dependencias
3. El fix debe ser mínimo y quirúrgico — cambia solo lo necesario
4. Asegúrate de que el TypeScript compile sin errores
5. Si hay implicaciones de accesibilidad, corrígelas también

Responde ÚNICAMENTE con JSON en este formato exacto:
{
  "fixedCode": "// código completo del archivo corregido",
  "explanation": "// qué cambió y por qué (max 3 oraciones)"
}`,
    messages: [
      {
        role: 'user',
        content: `Corrige este hallazgo de código:

Tipo:      ${task.finding.type}
Severidad: ${task.finding.severity}
Archivo:   ${task.finding.file}:${task.finding.line}
Error:     ${task.finding.description}
Regla:     ${task.finding.rule ?? 'N/A'}
${task.finding.fix ? `Fix sugerido por linter: ${task.finding.fix}` : ''}

Código actual del archivo:
\`\`\`typescript
${fileContent.slice(0, 8000)}
\`\`\``,
      },
    ],
  });

  const text = response.content
    .filter((b) => b.type === 'text')
    .map((b) => (b as any).text)
    .join('');

  const clean = text.replace(/```json|```/g, '').trim();
  return JSON.parse(clean);
}

async function applyFix(
  task: Task,
  fix: { fixedCode: string; explanation: string }
): Promise<void> {
  const filePath = task.finding.file;

  // Write the fixed code
  const dir = path.dirname(filePath);
  if (dir && dir !== '.') fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(filePath, fix.fixedCode);

  // Run eslint --fix on the file
  try {
    execSync(`npx eslint ${filePath} --fix --quiet`, { stdio: 'pipe' });
  } catch {}

  console.log(`  ✏️  Applied fix to ${filePath}`);
  console.log(`  💬 ${fix.explanation}`);
}

async function main() {
  console.log('⚛️  [FE FIXER] Looking for pending frontend tasks...\n');

  const tasks = getPendingTasks('frontend');
  if (tasks.length === 0) {
    console.log('[FE FIXER] No pending frontend tasks. Run inspector + task-manager first.');
    printTaskSummary();
    return;
  }

  console.log(`[FE FIXER] ${tasks.length} pending tasks (processing up to ${MAX_FIXES})\n`);

  let fixed = 0;
  let failed = 0;

  for (const task of tasks.slice(0, MAX_FIXES)) {
    console.log(
      `\n[FE FIXER] ${task.id} [${task.finding.severity}] ${task.finding.file}:${task.finding.line}`
    );
    console.log(`  📌 ${task.finding.description.slice(0, 100)}`);

    const fileContent = readFile(task.finding.file);
    if (!fileContent) {
      console.warn(`  ⚠️  File not found — skipping`);
      task.status = 'skipped';
      task.error = 'File not found';
      updateTask(task);
      continue;
    }

    // Mark in-progress
    task.status = 'in-progress';
    task.attempts++;
    updateTask(task);

    try {
      const fix = await generateFix(task, fileContent);
      await applyFix(task, fix);

      task.status = 'done';
      task.fix = { explanation: fix.explanation, appliedTo: task.finding.file };
      updateTask(task);

      // Update Jira if configured (best-effort)
      await transitionIssue(task.id, 'In Review').catch(() => {});
      await addComment(task.id, `🤖 FE Fixer applied local fix: ${fix.explanation}`).catch(
        () => {}
      );

      fixed++;
      console.log(`  ✅ Done`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      task.status = 'failed';
      task.error = msg;
      updateTask(task);
      failed++;
      console.error(`  ❌ Failed: ${msg.slice(0, 120)}`);
    }
  }

  printTaskSummary();

  if (fixed > 0) {
    await notifySlack(
      `⚛️ *FE Fixer* — ${fixed} frontend fix(es) applied locally.\n${failed > 0 ? `⚠️ ${failed} failed — check tasks/ for details.` : ''}`,
      fixed > 0 ? 'success' : 'high'
    );
  }

  console.log(`\n✅ [FE FIXER] Done. ${fixed} fixed, ${failed} failed.`);
}

main().catch((err) => {
  console.error('[FE FIXER] Fatal:', err);
  process.exit(1);
});
