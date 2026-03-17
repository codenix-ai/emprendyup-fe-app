'use client';

import React, { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import { useRouter } from 'next/navigation';
import {
  Plus,
  Eye,
  Edit2,
  Trash2,
  Play,
  Pause,
  RotateCcw,
  Zap,
  Mail,
  RefreshCw,
  X,
  AlertTriangle,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { getCurrentUser } from '@/lib/utils/rbac';
import {
  GET_EMAIL_CAMPAIGNS,
  CREATE_EMAIL_CAMPAIGN,
  UPDATE_EMAIL_CAMPAIGN,
  ACTIVATE_EMAIL_CAMPAIGN,
  PAUSE_EMAIL_CAMPAIGN,
  RESUME_EMAIL_CAMPAIGN,
  RUN_EMAIL_CAMPAIGN,
  DELETE_EMAIL_CAMPAIGN,
  SEGMENT_LABELS,
  type EmailCampaign,
  type CampaignStatus,
  type UserSegmentType,
} from '@/lib/graphql/emailMarketing';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const STATUS_STYLES: Record<CampaignStatus, string> = {
  DRAFT: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
  ACTIVE: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
  PAUSED: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300',
  COMPLETED: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
};

function StatusBadge({ status }: { status: CampaignStatus }) {
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${STATUS_STYLES[status]}`}>
      {status}
    </span>
  );
}

function formatDate(iso?: string) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('es-CO', {
    dateStyle: 'short',
    timeStyle: 'short',
  });
}

function pct(n: number, total: number) {
  if (!total) return '0%';
  return `${((n / total) * 100).toFixed(1)}%`;
}

// ─── Dynamic Variables Editor ─────────────────────────────────────────────────

interface KVPair {
  key: string;
  value: string;
}

function DynamicVariablesEditor({
  value,
  onChange,
}: {
  value: string;
  onChange: React.Dispatch<string>;
}) {
  const parseToKV = (json: string): KVPair[] => {
    try {
      const obj = JSON.parse(json || '{}');
      return Object.entries(obj).map(([key, val]) => ({ key, value: String(val) }));
    } catch {
      return [];
    }
  };

  const [pairs, setPairs] = useState<KVPair[]>(() => parseToKV(value));

  const syncUp = (newPairs: KVPair[]) => {
    setPairs(newPairs);
    const obj: Record<string, string> = {};
    newPairs.forEach(({ key, value: val }) => {
      if (key.trim()) obj[key.trim()] = val;
    });
    onChange(JSON.stringify(obj));
  };

  const add = () => syncUp([...pairs, { key: '', value: '' }]);
  const remove = (i: number) => syncUp(pairs.filter((_, idx) => idx !== i));
  const update = (i: number, field: 'key' | 'value', val: string) => {
    const next = pairs.map((p, idx) => (idx === i ? { ...p, [field]: val } : p));
    syncUp(next);
  };

  return (
    <div className="space-y-2">
      {pairs.map((pair, i) => (
        <div key={i} className="flex gap-2 items-center">
          <input
            className="flex-1 border border-gray-300 dark:border-gray-600 rounded px-2 py-1 text-sm bg-white dark:bg-gray-700 dark:text-white"
            placeholder="key (e.g. offer)"
            value={pair.key}
            onChange={(e) => update(i, 'key', e.target.value)}
            data-testid={`dv-key-${i}`}
          />
          <input
            className="flex-1 border border-gray-300 dark:border-gray-600 rounded px-2 py-1 text-sm bg-white dark:bg-gray-700 dark:text-white"
            placeholder="value"
            value={pair.value}
            onChange={(e) => update(i, 'value', e.target.value)}
            data-testid={`dv-value-${i}`}
          />
          <button
            type="button"
            onClick={() => remove(i)}
            className="text-red-500 hover:text-red-700"
            data-testid={`dv-remove-${i}`}
          >
            <X size={14} />
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={add}
        className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
        data-testid="dv-add"
      >
        + Add Variable
      </button>
      <p className="text-xs text-gray-500 dark:text-gray-400">
        Auto-injected by backend: firstName, fullName, email, campaignName, unsubscribeUrl
      </p>
    </div>
  );
}

// ─── Campaign Form Drawer ─────────────────────────────────────────────────────

interface CampaignFormValues {
  name: string;
  description: string;
  templateId: string;
  segmentType: UserSegmentType;
  intervalDays: number;
  dynamicTemplateData: string;
  status: CampaignStatus;
}

const BLANK_FORM: CampaignFormValues = {
  name: '',
  description: '',
  templateId: '',
  segmentType: 'ALL',
  intervalDays: 2,
  dynamicTemplateData: '{}',
  status: 'DRAFT',
};

interface CampaignDrawerProps {
  open: boolean;
  campaign: EmailCampaign | null;
  onClose: () => void;
  onSaved: () => void;
}

function CampaignDrawer({ open, campaign, onClose, onSaved }: CampaignDrawerProps) {
  const isEdit = !!campaign;
  const [form, setForm] = useState<CampaignFormValues>(() =>
    campaign
      ? {
          name: campaign.name,
          description: campaign.description || '',
          templateId: campaign.templateId,
          segmentType: campaign.segmentType,
          intervalDays: campaign.intervalDays,
          dynamicTemplateData: campaign.dynamicTemplateData || '{}',
          status: campaign.status,
        }
      : { ...BLANK_FORM }
  );

  React.useEffect(() => {
    setForm(
      campaign
        ? {
            name: campaign.name,
            description: campaign.description || '',
            templateId: campaign.templateId,
            segmentType: campaign.segmentType,
            intervalDays: campaign.intervalDays,
            dynamicTemplateData: campaign.dynamicTemplateData || '{}',
            status: campaign.status,
          }
        : { ...BLANK_FORM }
    );
  }, [campaign, open]);

  const [createCampaign, { loading: creating }] = useMutation(CREATE_EMAIL_CAMPAIGN);
  const [updateCampaign, { loading: updating }] = useMutation(UPDATE_EMAIL_CAMPAIGN);
  const saving = creating || updating;

  const set = (field: keyof CampaignFormValues, value: unknown) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      toast.error('Name is required');
      return;
    }
    if (!form.templateId.trim()) {
      toast.error('Template ID is required');
      return;
    }
    if (form.intervalDays < 1) {
      toast.error('Interval must be at least 1 day');
      return;
    }

    try {
      if (isEdit && campaign) {
        await updateCampaign({
          variables: { input: { id: campaign.id, ...form } },
        });
        toast.success('Campaign updated');
      } else {
        await createCampaign({ variables: { input: form } });
        toast.success('Campaign created');
      }
      onSaved();
    } catch (err: unknown) {
      toast.error((err as Error).message || 'Something went wrong');
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="flex-1 bg-black/50" onClick={onClose} />
      <div className="w-full max-w-lg bg-white dark:bg-gray-800 shadow-xl flex flex-col overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            {isEdit ? 'Edit Campaign' : 'New Campaign'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
            data-testid="drawer-close"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 px-6 py-5 space-y-4">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Name <span className="text-red-500">*</span>
            </label>
            <input
              className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={form.name}
              onChange={(e) => set('name', e.target.value)}
              placeholder="Summer Promo 2025"
              data-testid="campaign-name"
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Description
            </label>
            <textarea
              className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={2}
              value={form.description}
              onChange={(e) => set('description', e.target.value)}
              placeholder="Optional description..."
              data-testid="campaign-description"
            />
          </div>

          {/* Template ID */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              SendGrid Template ID <span className="text-red-500">*</span>
            </label>
            <input
              className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={form.templateId}
              onChange={(e) => set('templateId', e.target.value)}
              placeholder="d-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
              data-testid="campaign-template-id"
              required
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Starts with &quot;d-&quot;
            </p>
          </div>

          {/* Segment */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Target Segment <span className="text-red-500">*</span>
            </label>
            <select
              className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={form.segmentType}
              onChange={(e) => set('segmentType', e.target.value as UserSegmentType)}
              data-testid="campaign-segment"
            >
              {(Object.entries(SEGMENT_LABELS) as [UserSegmentType, string][]).map(([k, label]) => (
                <option key={k} value={k}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          {/* Interval */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Send Interval (days) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              min={1}
              className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={form.intervalDays}
              onChange={(e) => set('intervalDays', Math.max(1, Number(e.target.value)))}
              data-testid="campaign-interval"
            />
          </div>

          {/* Dynamic Variables */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Dynamic Variables
            </label>
            <DynamicVariablesEditor
              value={form.dynamicTemplateData}
              onChange={(v) => set('dynamicTemplateData', v)}
            />
          </div>

          <div className="pt-2 flex gap-3 justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
              data-testid="drawer-cancel"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 text-sm rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60"
              data-testid="drawer-save"
            >
              {saving ? 'Saving…' : isEdit ? 'Save Changes' : 'Create Campaign'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Delete Confirmation Dialog ───────────────────────────────────────────────

function DeleteDialog({
  campaign,
  onConfirm,
  onCancel,
  loading,
}: {
  campaign: EmailCampaign;
  onConfirm: () => void;
  onCancel: () => void;
  loading: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl p-6 max-w-sm w-full mx-4">
        <div className="flex items-center gap-3 mb-4">
          <AlertTriangle className="text-red-500" size={24} />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Delete Campaign</h3>
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
          Are you sure you want to delete <strong>&quot;{campaign.name}&quot;</strong>? This action
          cannot be undone.
        </p>
        <div className="flex gap-3 justify-end">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
            data-testid="delete-cancel"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="px-4 py-2 text-sm rounded-lg bg-red-600 text-white hover:bg-red-700 disabled:opacity-60"
            data-testid="delete-confirm"
          >
            {loading ? 'Deleting…' : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Run Confirmation Dialog ──────────────────────────────────────────────────

function RunDialog({
  campaign,
  onConfirm,
  onCancel,
  loading,
}: {
  campaign: EmailCampaign;
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
          Trigger a manual send for <strong>&quot;{campaign.name}&quot;</strong> right now?
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

export default function EmailMarketingPage() {
  const router = useRouter();
  const user = getCurrentUser();

  // Admin-only guard — must use useEffect to avoid calling hooks conditionally
  useEffect(() => {
    if (user && user.role !== 'ADMIN') {
      router.replace('/dashboard');
    }
  }, [user, router]);

  const { data, loading, error, refetch } = useQuery(GET_EMAIL_CAMPAIGNS, {
    fetchPolicy: 'cache-and-network',
  });

  const [activateCampaign] = useMutation(ACTIVATE_EMAIL_CAMPAIGN);
  const [pauseCampaign] = useMutation(PAUSE_EMAIL_CAMPAIGN);
  const [resumeCampaign] = useMutation(RESUME_EMAIL_CAMPAIGN);
  const [runCampaign, { loading: runningId }] = useMutation(RUN_EMAIL_CAMPAIGN);
  const [deleteCampaign, { loading: deletingId }] = useMutation(DELETE_EMAIL_CAMPAIGN);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState<EmailCampaign | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<EmailCampaign | null>(null);
  const [runTarget, setRunTarget] = useState<EmailCampaign | null>(null);

  const campaigns: EmailCampaign[] = data?.emailCampaigns || [];

  if (user && user.role !== 'ADMIN') return null;

  const openCreate = () => {
    setEditingCampaign(null);
    setDrawerOpen(true);
  };

  const openEdit = (c: EmailCampaign) => {
    setEditingCampaign(c);
    setDrawerOpen(true);
  };

  const handleActivate = async (id: string) => {
    try {
      await activateCampaign({ variables: { id } });
      toast.success('Campaign activated');
      refetch();
    } catch (err: unknown) {
      toast.error((err as Error).message || 'Failed to activate');
    }
  };

  const handlePause = async (id: string) => {
    try {
      await pauseCampaign({ variables: { id } });
      toast.success('Campaign paused');
      refetch();
    } catch (err: unknown) {
      toast.error((err as Error).message || 'Failed to pause');
    }
  };

  const handleResume = async (id: string) => {
    try {
      await resumeCampaign({ variables: { id } });
      toast.success('Campaign resumed');
      refetch();
    } catch (err: unknown) {
      toast.error((err as Error).message || 'Failed to resume');
    }
  };

  const handleRun = async () => {
    if (!runTarget) return;
    try {
      const { data: runData } = await runCampaign({ variables: { id: runTarget.id } });
      const { sent, skipped, failed } = runData.runEmailCampaign;
      toast.success(`Sent: ${sent}, Skipped: ${skipped}, Failed: ${failed}`);
      setRunTarget(null);
      refetch();
    } catch (err: unknown) {
      toast.error((err as Error).message || 'Run failed');
      setRunTarget(null);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteCampaign({ variables: { id: deleteTarget.id } });
      toast.success('Campaign deleted');
      setDeleteTarget(null);
      refetch();
    } catch (err: unknown) {
      toast.error((err as Error).message || 'Delete failed');
      setDeleteTarget(null);
    }
  };

  return (
    <div className="p-6 max-w-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Mail className="text-blue-600" size={28} />
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Email Marketing</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">Manage SendGrid campaigns</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => refetch()}
            className="p-2 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700"
            title="Refresh"
            data-testid="refresh-campaigns"
          >
            <RefreshCw size={16} />
          </button>
          <button
            onClick={openCreate}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
            data-testid="new-campaign"
          >
            <Plus size={16} />
            New Campaign
          </button>
        </div>
      </div>

      {/* Loading skeleton */}
      {loading && !data && (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-14 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse" />
          ))}
        </div>
      )}

      {/* Error state */}
      {error && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <p className="text-red-500 dark:text-red-400 mb-3">Failed to load campaigns</p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">{error.message}</p>
          <button
            onClick={() => refetch()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
            data-testid="retry-campaigns"
          >
            Retry
          </button>
        </div>
      )}

      {/* Empty state */}
      {!loading && !error && campaigns.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Mail size={48} className="text-gray-300 dark:text-gray-600 mb-4" />
          <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">
            No campaigns yet
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
            Create your first email campaign to start engaging your users.
          </p>
          <button
            onClick={openCreate}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
            data-testid="empty-new-campaign"
          >
            <Plus size={16} />
            New Campaign
          </button>
        </div>
      )}

      {/* Campaigns table */}
      {!error && campaigns.length > 0 && (
        <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-700">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-800/60 text-gray-600 dark:text-gray-400 uppercase text-xs">
              <tr>
                <th className="px-4 py-3 text-left font-semibold">Name</th>
                <th className="px-4 py-3 text-left font-semibold">Segment</th>
                <th className="px-4 py-3 text-left font-semibold">Status</th>
                <th className="px-4 py-3 text-left font-semibold">Interval</th>
                <th className="px-4 py-3 text-right font-semibold">Sent</th>
                <th className="px-4 py-3 text-right font-semibold">Open Rate</th>
                <th className="px-4 py-3 text-right font-semibold">Click Rate</th>
                <th className="px-4 py-3 text-left font-semibold">Next Run</th>
                <th className="px-4 py-3 text-center font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {campaigns.map((c) => (
                <tr
                  key={c.id}
                  className="bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                >
                  <td className="px-4 py-3 font-medium text-gray-900 dark:text-white max-w-[200px] truncate">
                    {c.name}
                  </td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-300">
                    {SEGMENT_LABELS[c.segmentType]}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={c.status} />
                  </td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-300">
                    Every {c.intervalDays}d
                  </td>
                  <td className="px-4 py-3 text-right text-gray-700 dark:text-gray-300">
                    {c.totalSent.toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-right text-gray-700 dark:text-gray-300">
                    {pct(c.totalOpened, c.totalSent)}
                  </td>
                  <td className="px-4 py-3 text-right text-gray-700 dark:text-gray-300">
                    {pct(c.totalClicked, c.totalSent)}
                  </td>
                  <td className="px-4 py-3 text-gray-500 dark:text-gray-400 text-xs whitespace-nowrap">
                    {formatDate(c.nextRunAt)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center gap-1">
                      {/* Lifecycle */}
                      {c.status === 'DRAFT' && (
                        <button
                          onClick={() => handleActivate(c.id)}
                          title="Activate"
                          className="p-1.5 rounded text-green-600 hover:bg-green-50 dark:hover:bg-green-900/30"
                          data-testid={`activate-${c.id}`}
                        >
                          <Play size={14} />
                        </button>
                      )}
                      {c.status === 'ACTIVE' && (
                        <button
                          onClick={() => handlePause(c.id)}
                          title="Pause"
                          className="p-1.5 rounded text-yellow-600 hover:bg-yellow-50 dark:hover:bg-yellow-900/30"
                          data-testid={`pause-${c.id}`}
                        >
                          <Pause size={14} />
                        </button>
                      )}
                      {c.status === 'PAUSED' && (
                        <button
                          onClick={() => handleResume(c.id)}
                          title="Resume"
                          className="p-1.5 rounded text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30"
                          data-testid={`resume-${c.id}`}
                        >
                          <RotateCcw size={14} />
                        </button>
                      )}
                      {/* Run Now */}
                      <button
                        onClick={() => setRunTarget(c)}
                        title="Run Now"
                        className="p-1.5 rounded text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/30"
                        data-testid={`run-${c.id}`}
                      >
                        <Zap size={14} />
                      </button>
                      {/* View */}
                      <button
                        onClick={() => router.push(`/dashboard/email-marketing/${c.id}`)}
                        title="View"
                        className="p-1.5 rounded text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                        data-testid={`view-${c.id}`}
                      >
                        <Eye size={14} />
                      </button>
                      {/* Edit */}
                      <button
                        onClick={() => openEdit(c)}
                        title="Edit"
                        className="p-1.5 rounded text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                        data-testid={`edit-${c.id}`}
                      >
                        <Edit2 size={14} />
                      </button>
                      {/* Delete */}
                      <button
                        onClick={() => setDeleteTarget(c)}
                        title="Delete"
                        className="p-1.5 rounded text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30"
                        data-testid={`delete-${c.id}`}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Drawer */}
      <CampaignDrawer
        open={drawerOpen}
        campaign={editingCampaign}
        onClose={() => setDrawerOpen(false)}
        onSaved={() => {
          setDrawerOpen(false);
          refetch();
        }}
      />

      {/* Delete dialog */}
      {deleteTarget && (
        <DeleteDialog
          campaign={deleteTarget}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
          loading={!!deletingId}
        />
      )}

      {/* Run dialog */}
      {runTarget && (
        <RunDialog
          campaign={runTarget}
          onConfirm={handleRun}
          onCancel={() => setRunTarget(null)}
          loading={!!runningId}
        />
      )}
    </div>
  );
}
