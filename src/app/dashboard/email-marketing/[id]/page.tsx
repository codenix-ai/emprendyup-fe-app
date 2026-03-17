'use client';

import React, { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import { useRouter, useParams } from 'next/navigation';
import {
  ArrowLeft,
  Mail,
  Send,
  Eye,
  MousePointer,
  XCircle,
  RefreshCw,
  Play,
  Pause,
  RotateCcw,
  Zap,
  AlertTriangle,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { getCurrentUser } from '@/lib/utils/rbac';
import {
  GET_EMAIL_CAMPAIGN,
  GET_CAMPAIGN_METRICS,
  GET_CAMPAIGN_LOGS,
  ACTIVATE_EMAIL_CAMPAIGN,
  PAUSE_EMAIL_CAMPAIGN,
  RESUME_EMAIL_CAMPAIGN,
  RUN_EMAIL_CAMPAIGN,
  SEGMENT_LABELS,
  type EmailCampaign,
  type CampaignMetrics,
  type EmailCampaignLog,
  type CampaignStatus,
  type EmailLogStatus,
} from '@/lib/graphql/emailMarketing';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const STATUS_STYLES: Record<CampaignStatus, string> = {
  DRAFT: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
  ACTIVE: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
  PAUSED: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300',
  COMPLETED: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
};

const LOG_STATUS_STYLES: Record<EmailLogStatus, string> = {
  PENDING: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300',
  SENT: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
  FAILED: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
  OPENED: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
  CLICKED: 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300',
  BOUNCED: 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300',
  UNSUBSCRIBED: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400',
};

function StatusBadge({ status }: { status: CampaignStatus }) {
  return (
    <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${STATUS_STYLES[status]}`}>
      {status}
    </span>
  );
}

function LogStatusBadge({ status }: { status: EmailLogStatus }) {
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${LOG_STATUS_STYLES[status]}`}>
      {status}
    </span>
  );
}

function formatDate(iso?: string | null) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('es-CO', { dateStyle: 'short', timeStyle: 'short' });
}

function formatPct(rate?: number | null) {
  if (rate == null) return '0%';
  return `${(rate * 100).toFixed(1)}%`;
}

// ─── Metric Card ──────────────────────────────────────────────────────────────

function MetricCard({
  icon,
  label,
  value,
  sub,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  sub?: string;
  color: string;
}) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 flex items-center gap-4">
      <div className={`p-3 rounded-xl ${color}`}>{icon}</div>
      <div>
        <p className="text-xs text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wide">
          {label}
        </p>
        <p className="text-2xl font-bold text-gray-900 dark:text-white leading-tight">{value}</p>
        {sub && <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

// ─── Run Confirmation Dialog ──────────────────────────────────────────────────

function RunDialog({
  name,
  onConfirm,
  onCancel,
  loading,
}: {
  name: string;
  onConfirm: () => void;
  onCancel: () => void;
  loading: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl p-6 max-w-sm w-full mx-4">
        <div className="flex items-center gap-3 mb-4">
          <Zap className="text-yellow-500" size={24} />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Run Campaign Now</h3>
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
          Trigger a manual send for <strong>&quot;{name}&quot;</strong> right now?
        </p>
        <div className="flex gap-3 justify-end">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
            data-testid="run-cancel"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="px-4 py-2 text-sm rounded-lg bg-yellow-500 text-white hover:bg-yellow-600 disabled:opacity-60"
            data-testid="run-confirm"
          >
            {loading ? 'Running…' : 'Run Now'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

const LOG_STATUS_FILTERS: { value: EmailLogStatus | 'ALL'; label: string }[] = [
  { value: 'ALL', label: 'All' },
  { value: 'PENDING', label: 'Pending' },
  { value: 'SENT', label: 'Sent' },
  { value: 'OPENED', label: 'Opened' },
  { value: 'CLICKED', label: 'Clicked' },
  { value: 'FAILED', label: 'Failed' },
  { value: 'BOUNCED', label: 'Bounced' },
  { value: 'UNSUBSCRIBED', label: 'Unsubscribed' },
];

export default function CampaignDetailPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const id = params.id;

  const user = getCurrentUser();

  // Admin-only guard — useEffect to avoid conditional hook calls
  useEffect(() => {
    if (user && user.role !== 'ADMIN') {
      router.replace('/dashboard');
    }
  }, [user, router]);

  const {
    data: campaignData,
    loading: campaignLoading,
    error: campaignError,
    refetch: refetchCampaign,
  } = useQuery(GET_EMAIL_CAMPAIGN, { variables: { id }, fetchPolicy: 'cache-and-network' });

  const {
    data: metricsData,
    loading: metricsLoading,
    refetch: refetchMetrics,
  } = useQuery(GET_CAMPAIGN_METRICS, { variables: { id }, fetchPolicy: 'cache-and-network' });

  const {
    data: logsData,
    loading: logsLoading,
    refetch: refetchLogs,
  } = useQuery(GET_CAMPAIGN_LOGS, {
    variables: { id, limit: 100 },
    fetchPolicy: 'cache-and-network',
  });

  const [activateCampaign] = useMutation(ACTIVATE_EMAIL_CAMPAIGN);
  const [pauseCampaign] = useMutation(PAUSE_EMAIL_CAMPAIGN);
  const [resumeCampaign] = useMutation(RESUME_EMAIL_CAMPAIGN);
  const [runCampaign, { loading: runLoading }] = useMutation(RUN_EMAIL_CAMPAIGN);

  const [logStatusFilter, setLogStatusFilter] = useState<EmailLogStatus | 'ALL'>('ALL');
  const [showRunDialog, setShowRunDialog] = useState(false);

  const campaign: EmailCampaign | null = campaignData?.emailCampaign ?? null;
  const metrics: CampaignMetrics | null = metricsData?.emailCampaignMetrics ?? null;
  const logs: EmailCampaignLog[] = logsData?.emailCampaignLogs ?? [];

  const filteredLogs =
    logStatusFilter === 'ALL' ? logs : logs.filter((l) => l.status === logStatusFilter);

  const handleRefresh = () => {
    refetchCampaign();
    refetchMetrics();
    refetchLogs();
    toast.success('Refreshed');
  };

  const handleActivate = async () => {
    try {
      await activateCampaign({ variables: { id } });
      toast.success('Campaign activated');
      refetchCampaign();
    } catch (err: unknown) {
      toast.error((err as Error).message || 'Failed to activate');
    }
  };

  const handlePause = async () => {
    try {
      await pauseCampaign({ variables: { id } });
      toast.success('Campaign paused');
      refetchCampaign();
    } catch (err: unknown) {
      toast.error((err as Error).message || 'Failed to pause');
    }
  };

  const handleResume = async () => {
    try {
      await resumeCampaign({ variables: { id } });
      toast.success('Campaign resumed');
      refetchCampaign();
    } catch (err: unknown) {
      toast.error((err as Error).message || 'Failed to resume');
    }
  };

  const handleRun = async () => {
    try {
      const { data: runData } = await runCampaign({ variables: { id } });
      const { sent, skipped, failed } = runData.runEmailCampaign;
      toast.success(`Sent: ${sent}, Skipped: ${skipped}, Failed: ${failed}`);
      setShowRunDialog(false);
      handleRefresh();
    } catch (err: unknown) {
      toast.error((err as Error).message || 'Run failed');
      setShowRunDialog(false);
    }
  };

  // ── Guard: non-admin users ─────────────────────────────────────────────────
  if (user && user.role !== 'ADMIN') return null;

  // ── Loading skeleton ───────────────────────────────────────────────────────
  if (campaignLoading && !campaign) {
    return (
      <div className="p-6 space-y-4">
        <div className="h-8 w-48 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-24 bg-gray-200 dark:bg-gray-700 rounded-xl animate-pulse" />
          ))}
        </div>
        <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded-xl animate-pulse" />
      </div>
    );
  }

  // ── Error state ────────────────────────────────────────────────────────────
  if (campaignError || !campaign) {
    return (
      <div className="p-6 flex flex-col items-center justify-center py-20 text-center">
        <AlertTriangle size={48} className="text-red-400 mb-4" />
        <p className="text-red-500 dark:text-red-400 font-semibold mb-2">Failed to load campaign</p>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
          {campaignError?.message ?? 'Campaign not found'}
        </p>
        <div className="flex gap-3">
          <button
            onClick={() => router.back()}
            className="px-4 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300"
            data-testid="back-button"
          >
            ← Back
          </button>
          <button
            onClick={() => refetchCampaign()}
            className="px-4 py-2 text-sm rounded-lg bg-blue-600 text-white hover:bg-blue-700"
            data-testid="retry-campaign"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // ── Pretty-print dynamic variables ────────────────────────────────────────
  let dynamicVarsDisplay = '';
  try {
    const parsed = JSON.parse(campaign.dynamicTemplateData || '{}');
    dynamicVarsDisplay = JSON.stringify(parsed, null, 2);
  } catch {
    dynamicVarsDisplay = campaign.dynamicTemplateData || '{}';
  }

  return (
    <div className="p-6 max-w-full space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4 flex-wrap">
        <button
          onClick={() => router.push('/dashboard/email-marketing')}
          className="p-2 rounded-lg text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
          data-testid="back-link"
        >
          <ArrowLeft size={18} />
        </button>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white truncate">
              {campaign.name}
            </h1>
            <StatusBadge status={campaign.status} />
          </div>
          {campaign.description && (
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
              {campaign.description}
            </p>
          )}
        </div>

        <div className="flex items-center gap-2">
          {campaign.status === 'DRAFT' && (
            <button
              onClick={handleActivate}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg bg-green-600 text-white hover:bg-green-700"
              data-testid="detail-activate"
            >
              <Play size={14} /> Activate
            </button>
          )}
          {campaign.status === 'ACTIVE' && (
            <button
              onClick={handlePause}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg bg-yellow-500 text-white hover:bg-yellow-600"
              data-testid="detail-pause"
            >
              <Pause size={14} /> Pause
            </button>
          )}
          {campaign.status === 'PAUSED' && (
            <button
              onClick={handleResume}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg bg-blue-600 text-white hover:bg-blue-700"
              data-testid="detail-resume"
            >
              <RotateCcw size={14} /> Resume
            </button>
          )}
          <button
            onClick={() => setShowRunDialog(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg bg-purple-600 text-white hover:bg-purple-700"
            data-testid="detail-run"
          >
            <Zap size={14} /> Run Now
          </button>
          <button
            onClick={handleRefresh}
            className="p-2 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700"
            title="Refresh"
            data-testid="detail-refresh"
          >
            <RefreshCw size={16} />
          </button>
        </div>
      </div>

      {/* Metrics cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          icon={<Send size={20} className="text-white" />}
          label="Total Sent"
          value={(metrics?.totalSent ?? campaign.totalSent).toLocaleString()}
          color="bg-blue-500"
        />
        <MetricCard
          icon={<Eye size={20} className="text-white" />}
          label="Opens"
          value={(metrics?.totalOpened ?? campaign.totalOpened).toLocaleString()}
          sub={metricsLoading ? '…' : formatPct(metrics?.openRate)}
          color="bg-green-500"
        />
        <MetricCard
          icon={<MousePointer size={20} className="text-white" />}
          label="Clicks"
          value={(metrics?.totalClicked ?? campaign.totalClicked).toLocaleString()}
          sub={metricsLoading ? '…' : formatPct(metrics?.clickRate)}
          color="bg-purple-500"
        />
        <MetricCard
          icon={<XCircle size={20} className="text-white" />}
          label="Failed"
          value={(metrics?.failedCount ?? 0).toLocaleString()}
          color="bg-red-500"
        />
      </div>

      {/* Campaign Info */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
        <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-4">
          Campaign Info
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-x-8 gap-y-4 text-sm">
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
              Template ID
            </p>
            <p className="font-mono text-gray-800 dark:text-gray-200 break-all">
              {campaign.templateId}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
              Segment
            </p>
            <p className="text-gray-800 dark:text-gray-200">
              {SEGMENT_LABELS[campaign.segmentType]}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
              Send Interval
            </p>
            <p className="text-gray-800 dark:text-gray-200">
              Every {campaign.intervalDays} day{campaign.intervalDays !== 1 ? 's' : ''}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
              Last Run
            </p>
            <p className="text-gray-800 dark:text-gray-200">{formatDate(campaign.lastRunAt)}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
              Next Run
            </p>
            <p className="text-gray-800 dark:text-gray-200">{formatDate(campaign.nextRunAt)}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
              Created
            </p>
            <p className="text-gray-800 dark:text-gray-200">{formatDate(campaign.createdAt)}</p>
          </div>
        </div>

        {dynamicVarsDisplay && dynamicVarsDisplay !== '{}' && (
          <div className="mt-5">
            <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
              Dynamic Variables
            </p>
            <pre className="bg-gray-50 dark:bg-gray-900 rounded-lg p-3 text-xs font-mono text-gray-800 dark:text-gray-200 overflow-x-auto whitespace-pre-wrap">
              {dynamicVarsDisplay}
            </pre>
          </div>
        )}
      </div>

      {/* Logs Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
          <h2 className="text-base font-semibold text-gray-900 dark:text-white">
            Send Logs
            <span className="ml-2 text-sm font-normal text-gray-500 dark:text-gray-400">
              ({filteredLogs.length}
              {logStatusFilter !== 'ALL' ? ` ${logStatusFilter}` : ''} of {logs.length})
            </span>
          </h2>

          {/* Status filter */}
          <div className="flex items-center gap-1 flex-wrap">
            {LOG_STATUS_FILTERS.map(({ value, label }) => (
              <button
                key={value}
                onClick={() => setLogStatusFilter(value)}
                className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                  logStatusFilter === value
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
                data-testid={`filter-${value}`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {logsLoading && !logsData && (
          <div className="space-y-2">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-10 bg-gray-100 dark:bg-gray-700 rounded animate-pulse" />
            ))}
          </div>
        )}

        {!logsLoading && filteredLogs.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Mail size={36} className="text-gray-300 dark:text-gray-600 mb-3" />
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {logStatusFilter === 'ALL'
                ? 'No send logs yet.'
                : `No logs with status "${logStatusFilter}".`}
            </p>
          </div>
        )}

        {filteredLogs.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-xs text-gray-500 dark:text-gray-400 uppercase border-b border-gray-100 dark:border-gray-700">
                <tr>
                  <th className="pb-2 text-left font-semibold">Email</th>
                  <th className="pb-2 text-left font-semibold">Type</th>
                  <th className="pb-2 text-left font-semibold">Status</th>
                  <th className="pb-2 text-left font-semibold">Sent At</th>
                  <th className="pb-2 text-left font-semibold">Opened At</th>
                  <th className="pb-2 text-left font-semibold">Clicked At</th>
                  <th className="pb-2 text-left font-semibold">Failure Reason</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-gray-700/50">
                {filteredLogs.map((log) => (
                  <tr
                    key={log.id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors"
                  >
                    <td className="py-2.5 pr-4 text-gray-800 dark:text-gray-200 font-mono text-xs max-w-[200px] truncate">
                      {log.email}
                    </td>
                    <td className="py-2.5 pr-4 text-gray-500 dark:text-gray-400 text-xs">
                      {log.recipientType}
                    </td>
                    <td className="py-2.5 pr-4">
                      <LogStatusBadge status={log.status} />
                    </td>
                    <td className="py-2.5 pr-4 text-gray-500 dark:text-gray-400 text-xs whitespace-nowrap">
                      {formatDate(log.sentAt)}
                    </td>
                    <td className="py-2.5 pr-4 text-gray-500 dark:text-gray-400 text-xs whitespace-nowrap">
                      {formatDate(log.openedAt)}
                    </td>
                    <td className="py-2.5 pr-4 text-gray-500 dark:text-gray-400 text-xs whitespace-nowrap">
                      {formatDate(log.clickedAt)}
                    </td>
                    <td className="py-2.5 text-red-500 dark:text-red-400 text-xs max-w-[180px] truncate">
                      {log.failureReason || '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Run dialog */}
      {showRunDialog && (
        <RunDialog
          name={campaign.name}
          onConfirm={handleRun}
          onCancel={() => setShowRunDialog(false)}
          loading={runLoading}
        />
      )}
    </div>
  );
}
