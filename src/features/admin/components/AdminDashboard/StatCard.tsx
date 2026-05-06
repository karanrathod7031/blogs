import React from 'react';

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  trend: string;
  color: string;
}

export const StatCard: React.FC<StatCardProps> = ({ icon, label, value, trend, color }) => (
  <div className="premium-card p-6 bg-card border border-border space-y-4 shadow-xl">
    <div className="flex justify-between items-start">
      <div className={`p-2.5 rounded-xl ${color}`}>
        {icon}
      </div>
      <span className="text-[10px] font-black text-emerald-500 bg-emerald-500/10 px-2 py-1 rounded-full border border-emerald-500/10">{trend}</span>
    </div>
    <div>
      <p className="text-[10px] font-black uppercase text-ink-muted tracking-widest mb-1">{label}</p>
      <p className="text-2xl font-black text-ink">{value.toLocaleString()}</p>
    </div>
  </div>
);
