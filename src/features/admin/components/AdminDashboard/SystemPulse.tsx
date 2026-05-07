import React from 'react';
import { BarChart3 } from 'lucide-react';
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { AppStats } from '../../../../types';

interface SystemPulseProps {
  stats: AppStats | null;
}

const buildTelemetryData = (stats: AppStats | null) => {
  if (!stats) {
    return [];
  }

  return [
    { label: 'Users', value: stats.totalUsers, color: '#2563eb' },
    { label: 'Posts', value: stats.totalPosts, color: '#059669' },
    { label: 'Views', value: stats.totalViews, color: '#d97706' },
    { label: 'Likes', value: stats.totalLikes, color: '#e11d48' },
    { label: 'Comments', value: stats.totalComments, color: '#7c3aed' },
    { label: 'Clicks', value: stats.totalInteractions, color: '#0891b2' },
    { label: 'Today', value: stats.todayActiveUsers, color: '#9333ea' },
    { label: 'Live', value: stats.currentActiveUsers, color: '#65a30d' },
  ];
};

const formatMetric = (value: number) => {
  if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
  if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
  return `${value}`;
};

export const SystemPulse: React.FC<SystemPulseProps> = ({ stats }) => {
  const telemetryData = buildTelemetryData(stats);

  return (
    <div className="premium-card p-8 bg-card border border-border shadow-xl">
      <div className="flex items-center justify-between mb-8">
        <h3 className="text-lg font-black text-ink flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-accent" /> System Pulse
        </h3>
        <span className="text-[10px] font-black uppercase text-ink-muted tracking-widest">Real-time Telemetry</span>
      </div>
      <div className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={telemetryData} margin={{ top: 12, right: 8, left: -18, bottom: 0 }}>
            <CartesianGrid vertical={false} stroke="rgba(148, 163, 184, 0.14)" />
            <XAxis
              dataKey="label"
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#64748b', fontSize: 11, fontWeight: 800 }}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              width={50}
              tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 700 }}
              tickFormatter={(value: number) => formatMetric(value)}
            />
            <Tooltip
              cursor={{ fill: 'rgba(34, 211, 238, 0.08)' }}
              contentStyle={{
                borderRadius: '16px',
                border: '1px solid rgba(148, 163, 184, 0.2)',
                backgroundColor: 'rgba(255,255,255,0.96)',
                boxShadow: '0 16px 40px rgba(15, 23, 42, 0.12)',
              }}
              formatter={(value: number) => [formatMetric(value), 'Signals']}
            />
            <Bar dataKey="value" radius={[16, 16, 0, 0]} maxBarSize={56}>
              {telemetryData.map((entry) => (
                <Cell key={entry.label} fill={entry.color} fillOpacity={0.86} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
