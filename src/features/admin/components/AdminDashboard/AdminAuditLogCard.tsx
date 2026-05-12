import React from 'react';
import { formatDistanceToNow } from 'date-fns';
import { Clock3, User2 } from 'lucide-react';

interface ActiveUserRecord {
  uid: string;
  displayName: string;
  email: string;
  role: 'user' | 'admin';
  lastSeenAt: number;
}

interface ActiveUserRecordsCardProps {
  records: ActiveUserRecord[];
}

export const ActiveUserRecordsCard: React.FC<ActiveUserRecordsCardProps> = ({ records }) => (
  <div className="premium-card p-6 bg-card border border-border shadow-xl">
    <div className="flex items-center justify-between mb-4">
      <h4 className="text-xs font-black uppercase text-ink-muted tracking-widest">Active User Records</h4>
      <span className="px-2 py-1 rounded text-[10px] font-black border bg-emerald-500/10 text-emerald-500 border-emerald-500/20">
        {records.length} tracked
      </span>
    </div>
    {records.length === 0 ? (
      <p className="text-sm font-medium text-ink-muted">No signed-in activity recorded yet.</p>
    ) : (
      <div className="space-y-3">
        {records.map((record) => (
          <div key={record.uid} className="rounded-2xl border border-border bg-bg-soft px-4 py-3">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <User2 className="w-4 h-4 text-accent" />
                  <p className="text-sm font-black text-ink truncate">{record.displayName}</p>
                </div>
                <p className="text-[10px] font-bold text-ink-muted truncate">{record.email}</p>
              </div>
              <span className={`px-2 py-1 rounded text-[10px] font-black uppercase border ${record.role === 'admin' ? 'bg-accent/10 text-accent border-accent/20' : 'bg-card text-ink-muted border-border'}`}>
                {record.role}
              </span>
            </div>
            <div className="mt-2 flex items-center gap-2 text-[10px] font-bold text-ink-muted">
              <Clock3 className="w-3 h-3" />
              Active {formatDistanceToNow(record.lastSeenAt, { addSuffix: true })}
            </div>
          </div>
        ))}
      </div>
    )}
  </div>
);
