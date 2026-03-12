// ─────────────────────────────────────────────
//  emprendy.ai — Task Queue Utilities
// ─────────────────────────────────────────────
import * as fs from 'fs';
import * as path from 'path';
import { Task } from './types';

const TASKS_DIR = path.resolve(process.cwd(), 'tasks');

export function getAllTasks(): Task[] {
  if (!fs.existsSync(TASKS_DIR)) return [];
  return fs
    .readdirSync(TASKS_DIR)
    .filter((f) => f.endsWith('.json'))
    .map((f) => {
      try {
        return JSON.parse(fs.readFileSync(path.join(TASKS_DIR, f), 'utf-8')) as Task;
      } catch {
        return null;
      }
    })
    .filter((t): t is Task => t !== null)
    .sort((a, b) => a.id.localeCompare(b.id));
}

export function getPendingTasks(layer?: 'frontend' | 'backend'): Task[] {
  return getAllTasks().filter(
    (t) => t.status === 'pending' && (!layer || t.finding.layer === layer)
  );
}

export function updateTask(task: Task): void {
  const filePath = path.join(TASKS_DIR, `${task.id}.json`);
  task.updatedAt = new Date().toISOString();
  fs.writeFileSync(filePath, JSON.stringify(task, null, 2));
}

export function printTaskSummary(): void {
  const tasks = getAllTasks();
  const byStatus = tasks.reduce<Record<string, number>>((acc, t) => {
    acc[t.status] = (acc[t.status] ?? 0) + 1;
    return acc;
  }, {});
  console.log('\n📋 Task Queue Summary:');
  console.log(`  pending:     ${byStatus['pending'] ?? 0}`);
  console.log(`  in-progress: ${byStatus['in-progress'] ?? 0}`);
  console.log(`  done:        ${byStatus['done'] ?? 0}`);
  console.log(`  failed:      ${byStatus['failed'] ?? 0}`);
  console.log(`  skipped:     ${byStatus['skipped'] ?? 0}`);
  console.log(`  TOTAL:       ${tasks.length}`);
}
