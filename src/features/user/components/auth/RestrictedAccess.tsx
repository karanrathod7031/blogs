import React from 'react';
import { Ban, LogOut, ShieldAlert } from 'lucide-react';
import { auth } from '../../../../lib/firebase';
import { motion } from 'motion/react';

interface RestrictedAccessProps {
  reason?: 'suspended' | 'deleted';
}

export const RestrictedAccess: React.FC<RestrictedAccessProps> = ({ reason = 'suspended' }) => {
  const handleLogout = () => {
    auth.signOut();
    window.location.href = '/';
  };

  return (
    <div className="fixed inset-0 bg-slate-950 flex items-center justify-center p-6 z-[9999]">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-[2.5rem] p-10 text-center shadow-2xl overflow-hidden relative"
      >
        {/* Background glow */}
        <div className="absolute -top-20 -right-20 w-40 h-40 bg-rose-500/10 blur-[80px] rounded-full" />
        <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-emerald-500/10 blur-[80px] rounded-full" />

        <div className="relative z-10">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-rose-500/10 rounded-3xl mb-8">
            <Ban className="w-10 h-10 text-rose-500" />
          </div>

          <h1 className="text-3xl font-serif italic text-white mb-4">
            {reason === 'suspended' ? 'Access Terminated' : 'Identity Not Found'}
          </h1>
          
          <p className="text-slate-400 mb-10 leading-relaxed font-light">
            {reason === 'suspended' 
              ? "This identity has been flagged for protocol violations and access to the Global Archive has been revoked by Root Authority."
              : "Your identity registry entry could not be located. This profile may have been purged from the active directory."}
          </p>

          <div className="space-y-4">
            <div className="p-4 bg-slate-800/50 rounded-2xl border border-slate-700/50 flex items-start gap-4 text-left">
              <ShieldAlert className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-slate-200">Protocol Enforcement</p>
                <p className="text-xs text-slate-500">Security lockdown active. Interaction capability: DISABLED.</p>
              </div>
            </div>

            <button
              onClick={handleLogout}
              className="w-full py-4 bg-accent text-slate-950 rounded-2xl font-medium flex items-center justify-center gap-2 hover:bg-accent/90 transition-colors cursor-pointer group"
            >
              <LogOut className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
              Disconnect Identity
            </button>
          </div>
          
          <p className="mt-8 text-xs text-slate-600 font-mono tracking-widest uppercase">
            System Hash: 0xRE7R1C73D
          </p>
        </div>
      </motion.div>
    </div>
  );
};
