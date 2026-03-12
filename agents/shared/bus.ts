// ─────────────────────────────────────────────
//  emprendy.ai — Agent Message Bus
// ─────────────────────────────────────────────
import { AgentMessage } from './types';
import * as fs from 'fs';
import * as path from 'path';

const BUS_FILE = path.resolve(process.cwd(), '.agent-bus.json');

function read(): AgentMessage[] {
  if (!fs.existsSync(BUS_FILE)) return [];
  return JSON.parse(fs.readFileSync(BUS_FILE, 'utf-8'));
}

function write(messages: AgentMessage[]): void {
  fs.writeFileSync(BUS_FILE, JSON.stringify(messages, null, 2));
}

/** Publish an event to the bus */
export function publish(from: string, to: string, event: string, payload: unknown): void {
  const messages = read();
  messages.push({ from, to, event, payload, timestamp: new Date().toISOString() });
  write(messages);
  console.log(`[BUS] ${from} → ${to} :: ${event}`);
}

/** Consume messages for a specific agent & event (removes them from bus) */
export function consume(to: string, event?: string): AgentMessage[] {
  const all = read();
  const matched = all.filter((m) => m.to === to && (!event || m.event === event));
  const remaining = all.filter((m) => !(m.to === to && (!event || m.event === event)));
  write(remaining);
  return matched;
}

/** Peek without consuming */
export function peek(to: string, event?: string): AgentMessage[] {
  return read().filter((m) => m.to === to && (!event || m.event === event));
}

/** Send Slack notification */
export async function notifySlack(message: string, severity = 'info'): Promise<void> {
  const webhookUrl = process.env.SLACK_WEBHOOK_URL;
  if (!webhookUrl) return;

  const emoji = { critical: '🚨', high: '⚠️', info: 'ℹ️', success: '✅' }[severity] ?? 'ℹ️';

  await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text: `${emoji} *emprendy.ai agents* — ${message}` }),
  });
}
