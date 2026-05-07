import React from 'react';
import { Ghost, Radio } from 'lucide-react';

interface AnonymousActivityCardProps {
  todayActive: number | null;
  currentActive: number | null;
  recentSessions: number;
  status: 'ready' | 'error' | 'loading';
}

export const AnonymousActivityCard: React.FC<AnonymousActivityCardProps> = ({
  todayActive,
  currentActive,
  recentSessions,
  status
}) => (
  <div className="premium-card p-6 bg-card border border-border shadow-xl">
    <div className="flex items-center justify-between mb-4">
      <h4 className="text-xs font-black uppercase text-ink-muted tracking-widest">Anonymous Visitors</h4>
      <span className={`px-2 py-1 rounded text-[10px] font-black border ${status === 'error' ? 'bg-amber-400/10 text-amber-600 border-amber-400/20' : 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'}`}>
        {status === 'error' ? 'Unavailable' : 'Public'}
      </span>
    </div>
    <div className="grid grid-cols-2 gap-4">
      <div className="rounded-2xl border border-border bg-bg-soft p-4">
        <div className="flex items-center gap-2 text-violet-600 mb-3">
          <Ghost className="w-4 h-4" />
          <span className="text-[10px] font-black uppercase tracking-widest">Today</span>
        </div>
        <p className="text-2xl font-black text-ink">{todayActive ?? '—'}</p>
      </div>
      <div className="rounded-2xl border border-border bg-bg-soft p-4">
        <div className="flex items-center gap-2 text-lime-600 mb-3">
          <Radio className="w-4 h-4" />
          <span className="text-[10px] font-black uppercase tracking-widest">Live</span>
        </div>
        <p className="text-2xl font-black text-ink">{currentActive ?? '—'}</p>
      </div>
    </div>
    <p className="mt-4 text-xs font-bold text-ink-muted">Tracked anonymous sessions: {recentSessions}</p>
  </div>
);
