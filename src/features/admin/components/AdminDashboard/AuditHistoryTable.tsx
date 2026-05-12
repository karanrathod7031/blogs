import React, { useMemo, useState } from 'react';
import { format, startOfDay, subDays } from 'date-fns';
import { ChevronLeft, ChevronRight, Download, FileText, RefreshCcw, Search, ShieldAlert, ShieldCheck, Trash2 } from 'lucide-react';
import { AdminAuditAction, AdminAuditLog } from '../../../../types';

interface AuditHistoryTableProps {
  logs: AdminAuditLog[];
}

const PAGE_SIZE = 20;

const ACTION_FILTERS: Array<{ value: 'all' | AdminAuditAction; label: string }> = [
  { value: 'all', label: 'All Actions' },
  { value: 'suspend_user', label: 'Suspended' },
  { value: 'restore_user', label: 'Restored' },
  { value: 'delete_user', label: 'Users Deleted' },
  { value: 'delete_post', label: 'Posts Deleted' },
  { value: 'refresh_stats', label: 'Stats Refreshed' }
];

const DATE_FILTERS = [
  { value: 'all', label: 'All Time' },
  { value: 'today', label: 'Today' },
  { value: '7d', label: 'Last 7 Days' },
  { value: '30d', label: 'Last 30 Days' }
] as const;

type DateFilter = typeof DATE_FILTERS[number]['value'];

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
  const [dateFilter, setDateFilter] = useState<DateFilter>('7d');
  const [page, setPage] = useState(1);

  const dateThreshold = useMemo(() => {
    switch (dateFilter) {
      case 'today':
        return startOfDay(new Date()).getTime();
      case '7d':
        return subDays(new Date(), 7).getTime();
      case '30d':
        return subDays(new Date(), 30).getTime();
      default:
        return null;
    }
  }, [dateFilter]);

  const filteredLogs = useMemo(() => logs.filter((log) => {
    const matchesAction = actionFilter === 'all' || log.action === actionFilter;
    const haystack = `${log.targetLabel} ${log.targetId} ${log.actorEmail} ${log.targetType}`.toLowerCase();
    const matchesSearch = haystack.includes(searchTerm.toLowerCase());
    const createdAtMs = log.createdAt?.toDate().getTime() ?? Date.now();
    const matchesDate = dateThreshold === null || createdAtMs >= dateThreshold;
    return matchesAction && matchesSearch && matchesDate;
  }), [actionFilter, dateThreshold, logs, searchTerm]);

  const pageCount = Math.max(1, Math.ceil(filteredLogs.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const paginatedLogs = useMemo(
    () => filteredLogs.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE),
    [currentPage, filteredLogs]
  );

  const pageStart = filteredLogs.length === 0 ? 0 : ((currentPage - 1) * PAGE_SIZE) + 1;
  const pageEnd = Math.min(currentPage * PAGE_SIZE, filteredLogs.length);

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
            onClick={() => {
              setActionFilter(filter.value);
              setPage(1);
            }}
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

      <div className="flex flex-wrap gap-2">
        {DATE_FILTERS.map((filter) => (
          <button
            key={filter.value}
            onClick={() => {
              setDateFilter(filter.value);
              setPage(1);
            }}
            className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all cursor-pointer ${
              dateFilter === filter.value
                ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
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
            {paginatedLogs.map((log) => {
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

      {filteredLogs.length > 0 && (
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <p className="text-xs font-bold text-ink-muted">
            Showing {pageStart}-{pageEnd} of {filteredLogs.length} audit records
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((value) => Math.max(1, value - 1))}
              disabled={currentPage === 1}
              className="inline-flex items-center gap-1 px-3 py-2 rounded-xl border border-border bg-bg-soft text-xs font-black uppercase tracking-widest text-ink-muted hover:text-ink disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
              Prev
            </button>
            <span className="px-3 py-2 rounded-xl border border-border bg-card text-xs font-black text-ink-muted">
              Page {currentPage} / {pageCount}
            </span>
            <button
              onClick={() => setPage((value) => Math.min(pageCount, value + 1))}
              disabled={currentPage === pageCount}
              className="inline-flex items-center gap-1 px-3 py-2 rounded-xl border border-border bg-bg-soft text-xs font-black uppercase tracking-widest text-ink-muted hover:text-ink disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              Next
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {filteredLogs.length === 0 && (
        <div className="p-20 text-center opacity-40 bg-bg-soft border border-border rounded-[2rem]">
          <Search className="w-12 h-12 mx-auto mb-4 text-ink-muted" />
          <p className="text-xs font-black uppercase tracking-widest text-ink-muted">No audit records match the current filters</p>
        </div>
      )}
    </div>
  );
};
