import React from 'react';
import { formatDistanceToNow } from 'date-fns';
import { Activity, Clock3 } from 'lucide-react';

interface ActivityRecord {
  uid: string;
  displayName: string;
  email: string;
  role: 'user' | 'admin';
  lastSeenAt: number;
}

interface UserActivityLogChartProps {
  records: ActivityRecord[];
}

function getActivityStrength(lastSeenAt: number) {
  const minutesAgo = Math.max(0, (Date.now() - lastSeenAt) / 60000);
  const score = Math.max(12, Math.round(100 - minutesAgo * 12));
  return Math.min(100, score);
}

export const UserActivityLogChart: React.FC<UserActivityLogChartProps> = ({ records }) => {
  const chartRecords = records.slice(0, 6);

  return (
    <div className="premium-card p-6 bg-card border border-border shadow-xl">
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-xs font-black uppercase text-ink-muted tracking-widest">User Activity Log</h4>
        <span className="px-2 py-1 rounded text-[10px] font-black border bg-cyan-500/10 text-cyan-600 border-cyan-500/20">
          {chartRecords.length} live logs
        </span>
      </div>
      {chartRecords.length === 0 ? (
        <div className="rounded-2xl border border-border bg-bg-soft px-4 py-8 text-center text-ink-muted">
          <p className="text-xs font-black uppercase tracking-widest">No activity logs yet</p>
          <p className="mt-2 text-sm font-medium">Signed-in activity will appear here after user heartbeats sync.</p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-6 gap-3 items-end h-[140px] border-t border-border/60 pt-5">
            {chartRecords.map((record) => {
              const strength = getActivityStrength(record.lastSeenAt);
              return (
                <div key={record.uid} className="flex h-full flex-col justify-end gap-2">
                  <div className="flex-1 flex items-end justify-center">
                    <div
                      className="w-full max-w-[48px] min-h-[14px] rounded-t-[16px] bg-gradient-to-t from-cyan-600 to-emerald-400"
                      style={{ height: `${strength}%` }}
                      title={`${record.displayName}: active ${formatDistanceToNow(record.lastSeenAt, { addSuffix: true })}`}
                    />
                  </div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-ink-muted text-center truncate">
                    {record.displayName.split(' ')[0] || 'User'}
                  </p>
                </div>
              );
            })}
          </div>
          <div className="space-y-2">
            {chartRecords.map((record) => (
              <div key={`${record.uid}-log`} className="flex items-center justify-between gap-3 rounded-2xl border border-border bg-bg-soft px-3 py-2.5">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <Activity className="w-3.5 h-3.5 text-accent shrink-0" />
                    <p className="text-xs font-black text-ink truncate">{record.displayName}</p>
                  </div>
                  <p className="text-[10px] font-bold text-ink-muted truncate">{record.email}</p>
                </div>
                <div className="shrink-0 flex items-center gap-1.5 text-[10px] font-bold text-ink-muted">
                  <Clock3 className="w-3 h-3" />
                  {formatDistanceToNow(record.lastSeenAt, { addSuffix: true })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
