// ─────────────────────────────────────────────
//  emprendy.ai — Shared Types for AI Agents
// ─────────────────────────────────────────────

export type Severity = 'critical' | 'high' | 'medium' | 'low';
export type Layer = 'frontend' | 'backend' | 'infra' | 'unknown';
export type Module = 'store' | 'restaurant' | 'service' | 'dashboard' | 'auth' | 'api' | 'db';

// ── Inspector ──────────────────────────────────
export interface Finding {
  id: string;
  type: 'lint' | 'type-error' | 'vulnerability' | 'test-failure' | 'regression';
  severity: Severity;
  layer: Layer;
  module: Module;
  file: string;
  line: number;
  description: string;
  codeSnippet: string;
  rule?: string;
  fix?: string; // suggested auto-fix from ESLint
  timestamp: string;
}

// ── QA Runner ─────────────────────────────────
export interface TestResult {
  id: string;
  module: Module;
  scenario: string;
  status: 'passed' | 'failed' | 'skipped';
  duration: number; // ms
  error?: string;
  screenshot?: string; // path
  videoPath?: string;
  steps: TestStep[];
  timestamp: string;
}

export interface TestStep {
  action: string;
  status: 'passed' | 'failed';
  error?: string;
}

// ── Jira ──────────────────────────────────────
export interface JiraIssue {
  key: string; // e.g. EMPR-42
  summary: string;
  description: string;
  issueType: 'Bug' | 'Story' | 'Task';
  priority: 'Blocker' | 'High' | 'Medium' | 'Low';
  labels: string[];
  component: string;
  storyPoints: number;
  affectedFile: string;
  codeSnippet: string;
  layer: Layer;
  status: 'Open' | 'In Progress' | 'In Review' | 'Done';
  fixBranch?: string;
  prUrl?: string;
}

// ── Message Bus ───────────────────────────────
export interface AgentMessage {
  from: string;
  to: string;
  event: string;
  payload: unknown;
  timestamp: string;
}

// ── Agent Config ──────────────────────────────
export interface AgentConfig {
  project: {
    name: string;
    jiraProjectKey: string;
    mainBranch: string;
    testBranch: string;
  };
  agents: {
    inspector: { enabled: boolean; triggers: string[]; severityThreshold: Severity };
    qaRunner: {
      enabled: boolean;
      schedule: string;
      modules: Module[];
      browsers: string[];
      viewports: Viewport[];
    };
    jiraScribe: {
      enabled: boolean;
      deduplication: boolean;
      autoAssign: boolean;
      sprintAssignment: string;
    };
    feFixer: { enabled: boolean; autoMerge: boolean; requiresReview: boolean; testCommand: string };
    beFixer: { enabled: boolean; autoMerge: boolean; requiresReview: boolean; testCommand: string };
    validator: { enabled: boolean; closeIssueOnSuccess: boolean; reopenOnFailure: boolean };
  };
  notifications: {
    slack: { enabled: boolean; channel: string; notifyOn: string[] };
  };
}

export interface Viewport {
  width: number;
  height: number;
  label: string;
}

// ── Local Task Queue ───────────────────────────
export interface Task {
  id: string; // e.g. TASK-0001
  status: 'pending' | 'in-progress' | 'done' | 'failed' | 'skipped';
  finding: Finding;
  attempts: number;
  fix?: {
    explanation: string;
    appliedTo: string; // file path that was modified
  };
  error?: string;
  createdAt: string;
  updatedAt: string;
}
