import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AlertTriangle, X } from 'lucide-react';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  isDestructive?: boolean;
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = 'Confirm',
  isDestructive = true
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-ink/60 backdrop-blur-sm"
          />
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            className="relative w-full max-w-sm bg-card rounded-3xl shadow-2xl border border-border overflow-hidden"
          >
            <div className={`p-6 flex flex-col items-center text-center space-y-4`}>
              <div className={`w-12 h-12 rounded-full flex items-center justify-center ${isDestructive ? 'bg-rose-500/10 text-rose-500' : 'bg-accent/10 text-accent'}`}>
                <AlertTriangle className="w-6 h-6" />
              </div>
              
              <div className="space-y-2">
                <h3 className="text-lg font-black text-ink">{title}</h3>
                <p className="text-sm text-ink-muted font-medium leading-relaxed">
                  {message}
                </p>
              </div>

              <div className="flex flex-col w-full gap-2 pt-2">
                <button
                  onClick={() => {
                    onConfirm();
                    onClose();
                  }}
                  className={`w-full py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all active:scale-95 ${
                    isDestructive 
                      ? 'bg-rose-500 text-slate-900 hover:bg-rose-600 shadow-lg shadow-rose-500/20' 
                      : 'bg-accent text-slate-900 hover:bg-accent/90 shadow-lg shadow-accent/20'
                  }`}
                >
                  {confirmLabel}
                </button>
                <button
                  onClick={onClose}
                  className="w-full py-3 rounded-xl text-xs font-black uppercase tracking-widest text-ink-muted hover:text-ink transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
            
            <button 
              onClick={onClose}
              className="absolute top-4 right-4 p-1 text-ink-muted hover:text-ink transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
