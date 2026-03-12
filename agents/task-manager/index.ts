// ─────────────────────────────────────────────
//  emprendy.ai — Task Manager
//  Converts Inspector findings into local tasks
// ─────────────────────────────────────────────
import * as fs from 'fs';
import * as path from 'path';
import { Finding, Task } from '../shared/types';
import { notifySlack } from '../shared/bus';

const TASKS_DIR = path.resolve(process.cwd(), 'tasks');
const REPORT = path.resolve(process.cwd(), 'reports/inspector-report.json');

function loadExistingTasks(): Map<string, Task> {
  const map = new Map<string, Task>();
  if (!fs.existsSync(TASKS_DIR)) return map;
  for (const file of fs.readdirSync(TASKS_DIR)) {
    if (!file.endsWith('.json')) continue;
    try {
      const task: Task = JSON.parse(fs.readFileSync(path.join(TASKS_DIR, file), 'utf-8'));
      map.set(task.finding.id, task);
    } catch {}
  }
  return map;
}

function taskFilePath(id: string): string {
  return path.join(TASKS_DIR, `${id}.json`);
}

function writeTask(task: Task): void {
  fs.writeFileSync(taskFilePath(task.id), JSON.stringify(task, null, 2));
}

async function main() {
  console.log('📋 [TASK MANAGER] Processing inspector findings...\n');

  if (!fs.existsSync(REPORT)) {
    console.error('[TASK MANAGER] reports/inspector-report.json not found. Run inspector first.');
    process.exit(1);
  }

  fs.mkdirSync(TASKS_DIR, { recursive: true });

  // MAX_TASKS: cap to avoid creating thousands of tasks at once
  const MAX_TASKS = parseInt(process.env.MAX_TASKS ?? '30', 10);

  const findings: Finding[] = JSON.parse(fs.readFileSync(REPORT, 'utf-8'));

  const severityOrder: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 };

  const actionable = findings
    .filter(
      (f) =>
        ['critical', 'high', 'medium'].includes(f.severity) &&
        !f.description.startsWith('FALSE_POSITIVE') &&
        f.file &&
        !f.file.endsWith('package.json') && // skip audit-only findings
        f.file.match(/\.(ts|tsx|js|jsx)$/) // only fixable source files
    )
    .sort((a, b) => (severityOrder[a.severity] ?? 9) - (severityOrder[b.severity] ?? 9))
    .slice(0, MAX_TASKS);

  const existing = loadExistingTasks();
  let created = 0;
  let skipped = 0;

  for (let i = 0; i < actionable.length; i++) {
    const finding = actionable[i];

    // Skip if task already exists and is not failed (avoid re-creating solved tasks)
    const existing_task = existing.get(finding.id);
    if (existing_task && existing_task.status !== 'failed') {
      skipped++;
      continue;
    }

    const id = `TASK-${String(i + 1).padStart(4, '0')}`;
    const task: Task = {
      id,
      status: 'pending',
      finding,
      attempts: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    writeTask(task);
    console.log(
      `  ✅ ${id} [${finding.severity}] ${finding.layer} — ${path.basename(finding.file)}:${finding.line}`
    );
    created++;
  }

  const pending = actionable.length - skipped;
  console.log(`\n📊 Tasks: ${created} created | ${skipped} already exist | ${pending} pending`);
  console.log(`📁 Tasks saved to: ${TASKS_DIR}`);

  if (created > 0) {
    await notifySlack(
      `📋 *Task Manager* — ${created} new tasks created from Inspector findings.\nRun \`fe-fixer\` or \`be-fixer\` to apply fixes.`,
      'info'
    );
  }
}

main().catch((err) => {
  console.error('[TASK MANAGER] Fatal:', err);
  process.exit(1);
});
