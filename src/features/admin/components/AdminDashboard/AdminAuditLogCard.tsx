import React from 'react';
import { formatDistanceToNow } from 'date-fns';
import { FileText, RefreshCcw, ShieldAlert, ShieldCheck, Trash2 } from 'lucide-react';
import { AdminAuditLog } from '../../../../types';

interface AdminAuditLogCardProps {
  logs: AdminAuditLog[];
  status: 'ready' | 'error' | 'loading';
}

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

export const AdminAuditLogCard: React.FC<AdminAuditLogCardProps> = ({ logs, status }) => (
  <div className="premium-card p-6 bg-card border border-border shadow-xl">
    <div className="flex items-center justify-between mb-4">
      <h4 className="text-xs font-black uppercase text-ink-muted tracking-widest">Admin Audit Log</h4>
      <span className={`px-2 py-1 rounded text-[10px] font-black border ${
        status === 'error'
          ? 'bg-amber-400/10 text-amber-600 border-amber-400/20'
          : 'bg-cyan-500/10 text-cyan-600 border-cyan-500/20'
      }`}>
        {status === 'error' ? 'Degraded' : `${logs.length} recent`}
      </span>
    </div>

    {logs.length === 0 ? (
      <p className="text-sm font-medium text-ink-muted">No administrative actions recorded yet.</p>
    ) : (
      <div className="space-y-3">
        {logs.map((log) => {
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
