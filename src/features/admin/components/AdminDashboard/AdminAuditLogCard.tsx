import React, { useMemo, useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { Download, FileText, RefreshCcw, ShieldAlert, ShieldCheck, Trash2 } from 'lucide-react';
import { AdminAuditAction, AdminAuditLog } from '../../../../types';

interface AdminAuditLogCardProps {
  logs: AdminAuditLog[];
  status: 'ready' | 'error' | 'loading';
}

const ACTION_FILTERS: Array<{ value: 'all' | AdminAuditAction; label: string }> = [
  { value: 'all', label: 'All' },
  { value: 'suspend_user', label: 'Suspended' },
  { value: 'restore_user', label: 'Restored' },
  { value: 'delete_user', label: 'Users Deleted' },
  { value: 'delete_post', label: 'Posts Deleted' },
  { value: 'refresh_stats', label: 'Stats Refreshed' }
];

function getActionCopy(action: AdminAuditLog['action']) {
  switch (action) {
    case 'suspend_user':
      return {
        label: 'User Suspended',
        icon: ShieldAlert,
        color: 'text-amber-600'
      };
    case 'restore_user':
      return {
        label: 'User Restored',
        icon: ShieldCheck,
        color: 'text-emerald-600'
      };
    case 'delete_user':
      return {
        label: 'User Deleted',
        icon: Trash2,
        color: 'text-rose-600'
      };
    case 'delete_post':
      return {
        label: 'Post Deleted',
        icon: FileText,
        color: 'text-rose-600'
      };
    case 'refresh_stats':
      return {
        label: 'Stats Refreshed',
        icon: RefreshCcw,
        color: 'text-cyan-600'
      };
  }
}

function downloadAuditCsv(rows: AdminAuditLog[]) {
  const header = ['action', 'targetType', 'targetId', 'targetLabel', 'actorEmail', 'actorRole', 'createdAt'];
  const escapeCsv = (value: string) => `"${value.replace(/"/g, '""')}"`;
  const csv = [
    header.join(','),
    ...rows.map((row) => [
      row.action,
      row.targetType,
      row.targetId,
      row.targetLabel,
      row.actorEmail,
      row.actorRole,
      row.createdAt ? row.createdAt.toDate().toISOString() : ''
    ].map((value) => escapeCsv(String(value))).join(','))
  ].join('\n');

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `admin-audit-log-${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

export const AdminAuditLogCard: React.FC<AdminAuditLogCardProps> = ({ logs, status }) => {
  const [actionFilter, setActionFilter] = useState<'all' | AdminAuditAction>('all');

  const filteredLogs = useMemo(
    () => actionFilter === 'all' ? logs : logs.filter((log) => log.action === actionFilter),
    [actionFilter, logs]
  );

  return (
    <div className="premium-card p-6 bg-card border border-border shadow-xl">
      <div className="flex items-center justify-between gap-3 mb-4">
        <h4 className="text-xs font-black uppercase text-ink-muted tracking-widest">Admin Audit Log</h4>
        <span className={`px-2 py-1 rounded text-[10px] font-black border ${
          status === 'error'
            ? 'bg-amber-400/10 text-amber-600 border-amber-400/20'
            : 'bg-cyan-500/10 text-cyan-600 border-cyan-500/20'
        }`}>
          {status === 'error' ? 'Degraded' : `${filteredLogs.length} visible`}
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-2 mb-4">
        {ACTION_FILTERS.map((filter) => (
          <button
            key={filter.value}
            onClick={() => setActionFilter(filter.value)}
            className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border transition-all cursor-pointer ${
              actionFilter === filter.value
                ? 'bg-accent/10 text-accent border-accent/20'
                : 'bg-bg-soft text-ink-muted border-border hover:text-ink'
            }`}
          >
            {filter.label}
          </button>
        ))}
        <button
          onClick={() => downloadAuditCsv(filteredLogs)}
          disabled={filteredLogs.length === 0}
          className="ml-auto inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border bg-bg-soft text-ink-muted border-border hover:text-ink disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
        >
          <Download className="w-3 h-3" />
          Export CSV
        </button>
      </div>

      {filteredLogs.length === 0 ? (
        <p className="text-sm font-medium text-ink-muted">
          {logs.length === 0 ? 'No administrative actions recorded yet.' : 'No audit entries match the current filter.'}
        </p>
      ) : (
        <div className="space-y-3">
          {filteredLogs.map((log) => {
            const action = getActionCopy(log.action);
            const ActionIcon = action.icon;

            return (
              <div key={log.id} className="rounded-2xl border border-border bg-bg-soft px-4 py-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className={`flex items-center gap-2 ${action.color}`}>
                      <ActionIcon className="w-4 h-4" />
                      <p className="text-sm font-black text-ink truncate">{action.label}</p>
                    </div>
                    <p className="mt-1 text-xs font-bold text-ink truncate">{log.targetLabel}</p>
                    <p className="text-[10px] font-bold text-ink-muted truncate">
                      by {log.actorEmail}
                    </p>
                  </div>
                  <span className="px-2 py-1 rounded text-[10px] font-black uppercase border bg-card text-ink-muted border-border">
                    {log.targetType}
                  </span>
                </div>
                <div className="mt-2 text-[10px] font-bold text-ink-muted">
                  {log.createdAt
                    ? formatDistanceToNow(log.createdAt.toDate(), { addSuffix: true })
                    : 'just now'}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
