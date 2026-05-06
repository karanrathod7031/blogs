import React from 'react';
import { motion } from 'motion/react';
import { BarChart3 } from 'lucide-react';

export const SystemPulse: React.FC = () => {
  const telemetryData = [45, 67, 89, 54, 76, 92, 54, 32, 65, 87];

  return (
    <div className="premium-card p-8 bg-card border border-border shadow-xl">
      <div className="flex items-center justify-between mb-8">
        <h3 className="text-lg font-black text-ink flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-accent" /> System Pulse
        </h3>
        <span className="text-[10px] font-black uppercase text-ink-muted tracking-widest">Real-time Telemetry</span>
      </div>
      <div className="h-[300px] flex items-end justify-between gap-2">
        {telemetryData.map((h, i) => (
          <motion.div 
            key={i}
            initial={{ height: 0 }}
            animate={{ height: `${h}%` }}
            className="w-full bg-bg-soft border-x border-t border-border rounded-t-lg relative group cursor-pointer hover:bg-accent transition-colors"
          >
            <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-accent text-slate-900 text-[10px] font-bold px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
              {h}%
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};
