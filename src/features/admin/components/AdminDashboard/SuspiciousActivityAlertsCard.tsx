import React from 'react';
import { AlertTriangle, Radar, ShieldAlert } from 'lucide-react';

export interface SuspiciousActivityAlert {
  id: string;
  severity: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  source: string;
}

interface SuspiciousActivityAlertsCardProps {
  alerts: SuspiciousActivityAlert[];
}

function getSeverityStyle(severity: SuspiciousActivityAlert['severity']) {
  switch (severity) {
    case 'high':
      return 'bg-rose-500/10 text-rose-600 border-rose-500/20';
    case 'medium':
      return 'bg-amber-400/10 text-amber-600 border-amber-400/20';
    case 'low':
      return 'bg-cyan-500/10 text-cyan-600 border-cyan-500/20';
  }
}

export const SuspiciousActivityAlertsCard: React.FC<SuspiciousActivityAlertsCardProps> = ({ alerts }) => (
  <div className="premium-card p-6 bg-card border border-border shadow-xl">
    <div className="flex items-center justify-between mb-4">
      <h4 className="text-xs font-black uppercase text-ink-muted tracking-widest">Suspicious Activity</h4>
      <span className={`px-2 py-1 rounded text-[10px] font-black border ${
        alerts.length === 0
          ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
          : 'bg-amber-400/10 text-amber-600 border-amber-400/20'
      }`}>
        {alerts.length === 0 ? 'Stable' : `${alerts.length} alerts`}
      </span>
    </div>

    {alerts.length === 0 ? (
      <div className="rounded-2xl border border-border bg-bg-soft px-4 py-5 text-center">
        <ShieldAlert className="w-8 h-8 mx-auto mb-3 text-emerald-500" />
        <p className="text-sm font-black text-ink">No suspicious patterns detected</p>
        <p className="mt-1 text-xs font-medium text-ink-muted">
          Recent admin activity and visitor telemetry are within expected range.
        </p>
      </div>
    ) : (
      <div className="space-y-3">
        {alerts.map((alert) => (
          <div key={alert.id} className="rounded-2xl border border-border bg-bg-soft px-4 py-3">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-500" />
                  <p className="text-sm font-black text-ink">{alert.title}</p>
                </div>
                <p className="mt-1 text-xs font-medium text-ink-muted">{alert.description}</p>
                <div className="mt-2 inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-ink-muted">
                  <Radar className="w-3 h-3" />
                  {alert.source}
                </div>
              </div>
              <span className={`px-2 py-1 rounded text-[10px] font-black uppercase border ${getSeverityStyle(alert.severity)}`}>
                {alert.severity}
              </span>
            </div>
          </div>
        ))}
      </div>
    )}
  </div>
);
