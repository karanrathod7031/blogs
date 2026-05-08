import React, { useMemo, useState } from 'react';
import { format } from 'date-fns';
import { Download, FileText, RefreshCcw, Search, ShieldAlert, ShieldCheck, Trash2 } from 'lucide-react';
import { AdminAuditAction, AdminAuditLog } from '../../../../types';

interface AuditHistoryTableProps {
  logs: AdminAuditLog[];
}

const ACTION_FILTERS: Array<{ value: 'all' | AdminAuditAction; label: string }> = [
  { value: 'all', label: 'All Actions' },
  { value: 'suspend_user', label: 'Suspended' },
  { value: 'restore_user', label: 'Restored' },
  { value: 'delete_user', label: 'Users Deleted' },
  { value: 'delete_post', label: 'Posts Deleted' },
  { value: 'refresh_stats', label: 'Stats Refreshed' }
];

function getActionCopy(action: AdminAuditLog['action']) {
  switch (action) {
    case 'suspend_user':
      return { label: 'User Suspended', icon: ShieldAlert, color: 'text-amber-600' };
    case 'restore_user':
      return { label: 'User Restored', icon: ShieldCheck, color: 'text-emerald-600' };
    case 'delete_user':
      return { label: 'User Deleted', icon: Trash2, color: 'text-rose-600' };
    case 'delete_post':
      return { label: 'Post Deleted', icon: FileText, color: 'text-rose-600' };
    case 'refresh_stats':
      return { label: 'Stats Refreshed', icon: RefreshCcw, color: 'text-cyan-600' };
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
  link.download = `admin-audit-history-${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

export const AuditHistoryTable: React.FC<AuditHistoryTableProps> = ({ logs }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [actionFilter, setActionFilter] = useState<'all' | AdminAuditAction>('all');

  const filteredLogs = useMemo(() => logs.filter((log) => {
    const matchesAction = actionFilter === 'all' || log.action === actionFilter;
    const haystack = `${log.targetLabel} ${log.targetId} ${log.actorEmail} ${log.targetType}`.toLowerCase();
    const matchesSearch = haystack.includes(searchTerm.toLowerCase());
    return matchesAction && matchesSearch;
  }), [actionFilter, logs, searchTerm]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col xl:flex-row gap-4 xl:items-center xl:justify-between">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-ink-muted" />
          <input
            type="text"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Search actions, actors, or targets..."
            className="w-full pl-12 pr-6 py-4 bg-bg-soft border border-border rounded-2xl outline-none focus:border-accent transition-all font-medium text-sm text-ink placeholder:text-ink-muted/50"
          />
        </div>

        <button
          onClick={() => downloadAuditCsv(filteredLogs)}
          disabled={filteredLogs.length === 0}
          className="inline-flex items-center justify-center gap-2 px-5 py-3 bg-bg-soft border border-border rounded-2xl text-xs font-black uppercase tracking-widest hover:border-accent transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer text-ink-muted"
        >
          <Download className="w-4 h-4" />
          Export Visible
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        {ACTION_FILTERS.map((filter) => (
          <button
            key={filter.value}
            onClick={() => setActionFilter(filter.value)}
            className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all cursor-pointer ${
              actionFilter === filter.value
                ? 'bg-accent/10 text-accent border-accent/20'
                : 'bg-bg-soft text-ink-muted border-border hover:text-ink'
            }`}
          >
            {filter.label}
          </button>
        ))}
      </div>

      <div className="bg-card border border-border rounded-[2rem] overflow-hidden shadow-xl">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-bg-soft border-b border-border">
              <th className="px-8 py-5 text-[10px] font-black uppercase text-ink-muted tracking-widest">Action</th>
              <th className="px-8 py-5 text-[10px] font-black uppercase text-ink-muted tracking-widest">Target</th>
              <th className="px-8 py-5 text-[10px] font-black uppercase text-ink-muted tracking-widest">Actor</th>
              <th className="px-8 py-5 text-[10px] font-black uppercase text-ink-muted tracking-widest">Timestamp</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filteredLogs.map((log) => {
              const action = getActionCopy(log.action);
              const ActionIcon = action.icon;

              return (
                <tr key={log.id} className="hover:bg-bg-soft transition-colors align-top">
                  <td className="px-8 py-4">
                    <div className={`flex items-center gap-2 ${action.color}`}>
                      <ActionIcon className="w-4 h-4" />
                      <div>
                        <p className="text-sm font-black text-ink">{action.label}</p>
                        <p className="text-[10px] font-bold text-ink-muted uppercase">{log.targetType}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-4">
                    <p className="text-sm font-black text-ink">{log.targetLabel}</p>
                    <p className="text-[10px] font-bold text-ink-muted">{log.targetId}</p>
                  </td>
                  <td className="px-8 py-4">
                    <p className="text-sm font-black text-ink">{log.actorEmail}</p>
                    <p className="text-[10px] font-bold text-ink-muted uppercase">{log.actorRole}</p>
                  </td>
                  <td className="px-8 py-4 text-xs font-bold text-ink-muted">
                    {log.createdAt ? format(log.createdAt.toDate(), 'MMM d, yyyy h:mm a') : 'Just now'}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {filteredLogs.length === 0 && (
        <div className="p-20 text-center opacity-40 bg-bg-soft border border-border rounded-[2rem]">
          <Search className="w-12 h-12 mx-auto mb-4 text-ink-muted" />
          <p className="text-xs font-black uppercase tracking-widest text-ink-muted">No audit records match the current filters</p>
        </div>
      )}
    </div>
  );
};
