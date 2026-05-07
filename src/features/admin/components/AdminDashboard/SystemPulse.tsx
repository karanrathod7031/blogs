import React from 'react';
import { BarChart3 } from 'lucide-react';
import { AppStats } from '../../../../types';

interface SystemPulseProps {
  stats: Partial<Record<keyof AppStats, number | null>> | null;
}

const buildTelemetryData = (stats: Partial<Record<keyof AppStats, number | null>> | null) => {
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
  ].filter((entry): entry is { label: string; value: number; color: string } => typeof entry.value === 'number');
};

const formatMetric = (value: number) => {
  if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
  if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
  return `${value}`;
};

export const SystemPulse: React.FC<SystemPulseProps> = ({ stats }) => {
  const telemetryData = buildTelemetryData(stats);
  const maxValue = telemetryData.reduce((max, item) => Math.max(max, item.value), 0) || 1;

  return (
    <div className="premium-card p-8 bg-card border border-border shadow-xl min-w-0">
      <div className="flex items-center justify-between mb-8">
        <h3 className="text-lg font-black text-ink flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-accent" /> System Pulse
        </h3>
        <span className="text-[10px] font-black uppercase text-ink-muted tracking-widest">Real-time Telemetry</span>
      </div>
      <div className="min-w-0">
        {telemetryData.length > 0 ? (
          <div className="space-y-5">
            <div className="grid h-[208px] grid-cols-8 gap-3 items-end border-t border-border/60 pt-6">
              {telemetryData.map((entry) => (
                <div key={entry.label} className="flex h-full min-w-0 flex-col justify-end gap-3">
                  <div className="flex-1 flex items-end justify-center">
                    <div
                      className="w-full max-w-[52px] min-h-[10px] rounded-t-[18px] transition-all duration-300"
                      style={{
                        height: `${Math.max((entry.value / maxValue) * 100, 8)}%`,
                        backgroundColor: entry.color,
                        opacity: 0.9
                      }}
                      title={`${entry.label}: ${formatMetric(entry.value)}`}
                    />
                  </div>
                  <div className="text-center">
                    <p className="text-[10px] font-black uppercase tracking-widest text-ink-muted">{entry.label}</p>
                    <p className="text-xs font-bold text-ink">{formatMetric(entry.value)}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 border-t border-border/60 pt-4">
              {telemetryData.slice(0, 4).map((entry) => (
                <div key={`${entry.label}-summary`} className="rounded-2xl border border-border bg-bg-soft px-4 py-3">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: entry.color }}
                    />
                    <p className="text-[10px] font-black uppercase tracking-widest text-ink-muted">{entry.label}</p>
                  </div>
                  <p className="mt-2 text-lg font-black text-ink">{formatMetric(entry.value)}</p>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="h-[208px] flex items-center justify-center text-center text-ink-muted border-t border-border/60 pt-6">
            <div>
              <p className="text-xs font-black uppercase tracking-widest">Telemetry unavailable</p>
              <p className="mt-2 text-sm font-medium">Live metrics will appear as soon as at least one data source responds.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
