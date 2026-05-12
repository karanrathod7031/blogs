import React from 'react';

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: number | null;
  trend: string;
  color: string;
  status?: 'ready' | 'error';
}

export const StatCard: React.FC<StatCardProps> = ({ icon, label, value, trend, color, status = 'ready' }) => (
  <div className="premium-card p-6 bg-card border border-border space-y-4 shadow-xl">
    <div className="flex justify-between items-start">
      <div className={`p-2.5 rounded-xl ${color}`}>
        {icon}
      </div>
      <span className={`text-[10px] font-black px-2 py-1 rounded-full border ${status === 'error' ? 'text-amber-600 bg-amber-400/10 border-amber-400/20' : 'text-emerald-500 bg-emerald-500/10 border-emerald-500/10'}`}>
        {status === 'error' ? 'Unavailable' : trend}
      </span>
    </div>
    <div>
      <p className="text-[10px] font-black uppercase text-ink-muted tracking-widest mb-1">{label}</p>
      <p className="text-2xl font-black text-ink">{value === null ? '—' : value.toLocaleString()}</p>
    </div>
  </div>
);
