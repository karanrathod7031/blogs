import { ReactNode, useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { LogIn, LogOut, Plus, Home, LayoutDashboard, Shield } from 'lucide-react';
import { authService } from '../../services/authService';
import { useAuthState } from '../../hooks/useAuthState';
import { useNotification } from '../ui/Toast';
import { ThemeToggle } from '../ui/ThemeToggle';
import { View } from '../../types';


interface LayoutProps {
  children: ReactNode;
  activeView: string;
  onViewChange: (view: View) => void;
  onNew?: () => void;
  isLoading?: boolean;
}

export default function Layout({ children, activeView, onViewChange, onNew, isLoading }: LayoutProps) {
  const { user, profile, loading } = useAuthState();
  const { notify } = useNotification();
  const [scrolled, setScrolled] = useState(false);
  const [signingIn, setSigningIn] = useState(false);
  const cursorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    const handleMouseMove = (e: MouseEvent) => {
      if (cursorRef.current) {
        cursorRef.current.style.left = e.clientX + 'px';
        cursorRef.current.style.top = e.clientY + 'px';
      }
    };

    window.addEventListener('scroll', handleScroll);
    window.addEventListener('mousemove', handleMouseMove);
    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  const handleSignIn = async () => {
    if (signingIn) return;
    setSigningIn(true);
    try {
      await authService.signInWithGoogle();
      notify('Authentication established', 'success');
    } catch (err: unknown) {
      const error = err as { code?: string };
      if (
        error.code !== 'auth/popup-closed-by-user' && 
        error.code !== 'auth/cancelled-popup-request'
      ) {
        console.error('Authentication Error:', error);
        notify('Failed to establish identity', 'error');
      }
    } finally {
      setSigningIn(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await authService.signOut();
      onViewChange('list');
      notify('Session terminated', 'info');
    } catch (err) {
      console.error('Sign-out error:', err);
      notify('Failed to terminate session', 'error');
    }
  };

  const navLinks: { name: string, view: View }[] = [
    { name: 'Network Hub', view: 'list' },
  ];

  return (
    <div className="min-h-screen flex flex-col selection:bg-accent/20 selection:text-accent">
      <div className="cursor-glow" ref={cursorRef} />
      
      {/* Instagram style top progress bar */}
      <AnimatePresence>
        {isLoading && (
          <motion.div
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: "70%", opacity: 1 }}
            exit={{ width: "100%", opacity: 0 }}
            transition={{ 
              width: { duration: 2, ease: "easeOut" },
              opacity: { duration: 0.3 }
            }}
            className="fixed top-0 left-0 h-1 bg-accent z-[100] shadow-[0_0_10px_rgba(var(--accent-rgb),0.5)]"
          />
        )}
      </AnimatePresence>

      <div className="floating-blob blob-one" />
      <div className="floating-blob blob-two" />

      <header id="main-header" className={`fixed top-0 left-0 z-50 w-full transition-all duration-300 ${scrolled ? 'bg-bg/60 shadow-clean backdrop-blur-xl border-b border-border py-4' : 'bg-transparent py-6'}`}>
        <div className="max-w-7xl mx-auto px-4 md:px-10 flex items-center justify-between">
          <button 
            id="logo-button"
            onClick={() => onViewChange('list')}
            className="text-xl md:text-2xl font-black tracking-tight text-ink hover:opacity-80 transition-opacity"
          >
            Hub<span className="text-accent underline decoration-accent/20 underline-offset-4 pointer-events-none">.</span>
          </button>

          <nav className="hidden md:flex items-center gap-9">
            {navLinks.map((link) => (
              <button 
                key={link.name}
                onClick={() => onViewChange(link.view)}
                className={`nav-link text-base tracking-tight ${activeView === link.view ? 'active' : ''}`}
              >
                {link.name}
              </button>
            ))}
            {user && (
              <button 
                onClick={() => onViewChange('admin')}
                className={`nav-link text-base tracking-tight ${activeView === 'admin' ? 'active' : ''}`}
              >
                Studio
              </button>
            )}
            {profile?.role === 'admin' || user?.email === 'rk.upk2345678@gmail.com' ? (
              <button 
                onClick={() => onViewChange('admin-panel')}
                className={`nav-link text-base tracking-tight ${activeView === 'admin-panel' ? 'active' : ''}`}
              >
                Admin Panel
              </button>
            ) : null}
            
            <div className="h-4 w-px bg-border" />
            
            <ThemeToggle />
            
            {!loading && (
              user ? (
                <div className="flex items-center gap-4">
                  <button 
                    onClick={handleSignOut}
                    className="p-2 text-ink-muted hover:text-rose-500 transition-colors cursor-pointer"
                    title="Terminate Session"
                  >
                    <LogOut className="w-5 h-5" />
                  </button>
                </div>
              ) : (
                <button 
                  onClick={handleSignIn}
                  disabled={signingIn}
                  className="flex items-center gap-2 px-5 py-2.5 bg-accent text-slate-900 text-sm font-bold rounded-xl hover:bg-accent-hover transition-all active:scale-95 shadow-lg shadow-accent/20 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <LogIn className="w-4 h-4" />
                  <span>{signingIn ? 'Authenticating...' : 'Editor Access'}</span>
                </button>
              )
            )}
          </nav>

          <div className="flex items-center gap-3 md:hidden">
            <ThemeToggle />
            {!loading && !user && (
              <button 
                onClick={handleSignIn}
                disabled={signingIn}
                className="flex items-center gap-2 rounded-full bg-accent px-4 py-2.5 text-xs font-black text-slate-900 shadow-lg shadow-accent/20 disabled:opacity-50"
              >
                <LogIn className="h-4 w-4" />
                <span>{signingIn ? '...' : 'Editor'}</span>
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="flex-grow pt-20 md:pt-32 pb-28 md:pb-24">
        <div className="max-w-7xl mx-auto px-4 md:px-10">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeView}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Mobile FAB */}
        <AnimatePresence>
          {user && activeView === 'list' && (
            <motion.button
              initial={{ scale: 0, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0, opacity: 0, y: 20 }}
              onClick={onNew}
              className="md:hidden fixed bottom-6 right-6 z-40 w-16 h-16 bg-accent text-white rounded-full shadow-2xl flex items-center justify-center active:scale-90 transition-transform ring-4 ring-white"
            >
              <Plus className="w-8 h-8" />
            </motion.button>
          )}
        </AnimatePresence>

        <div className="fixed inset-x-4 bottom-4 z-50 md:hidden">
          <div className="mx-auto flex max-w-md items-center justify-between gap-2 rounded-[1.75rem] border border-white/10 bg-slate-950/90 p-2 shadow-2xl backdrop-blur-xl">
            <button
              onClick={() => onViewChange('list')}
              className={`flex min-w-0 flex-1 items-center justify-center gap-2 rounded-2xl px-3 py-3 text-xs font-black transition-all ${
                activeView === 'list' ? 'bg-accent text-slate-900' : 'text-slate-300 hover:bg-white/5'
              }`}
            >
              <Home className="h-4 w-4 shrink-0" />
              <span className="truncate">Hub</span>
            </button>

            {user && (
              <button
                onClick={() => onViewChange('admin')}
                className={`flex min-w-0 flex-1 items-center justify-center gap-2 rounded-2xl px-3 py-3 text-xs font-black transition-all ${
                  activeView === 'admin' ? 'bg-accent text-slate-900' : 'text-slate-300 hover:bg-white/5'
                }`}
              >
                <LayoutDashboard className="h-4 w-4 shrink-0" />
                <span className="truncate">Studio</span>
              </button>
            )}

            {(profile?.role === 'admin' || user?.email === 'rk.upk2345678@gmail.com') && (
              <button
                onClick={() => onViewChange('admin-panel')}
                className={`flex min-w-0 flex-1 items-center justify-center gap-2 rounded-2xl px-3 py-3 text-xs font-black transition-all ${
                  activeView === 'admin-panel' ? 'bg-accent text-slate-900' : 'text-slate-300 hover:bg-white/5'
                }`}
              >
                <Shield className="h-4 w-4 shrink-0" />
                <span className="truncate">Admin</span>
              </button>
            )}

            {user && (
              <button
                onClick={handleSignOut}
                className="flex items-center justify-center rounded-2xl px-3 py-3 text-slate-300 transition-all hover:bg-white/5 hover:text-rose-400"
                title="Sign Out"
              >
                <LogOut className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      </main>

      <footer id="main-footer" className="bg-bg-soft border-t border-border py-10 md:py-16">
        <div className="max-w-7xl mx-auto px-4 md:px-10">
          <div className="grid md:grid-cols-4 gap-12">
            <div className="md:col-span-2 space-y-6">
              <h3 className="text-2xl font-black tracking-tight text-ink">Hub<span className="text-accent underline decoration-accent/20 underline-offset-4 pointer-events-none">.</span></h3>
              <p className="text-ink-muted text-sm max-w-xs leading-relaxed font-medium">
                A technical writing playground exploring the future of web architectures and engineering principles.
              </p>
            </div>
            
            <div className="space-y-4">
              <h4 className="text-xs font-bold text-ink-muted uppercase tracking-widest">Navigation</h4>
              <nav className="flex flex-col gap-3 text-sm font-semibold">
                <button onClick={() => onViewChange('list')} className="w-fit hover:text-accent transition-colors text-ink-muted">Feed</button>
                {user && <button onClick={() => onViewChange('admin')} className="w-fit hover:text-accent transition-colors text-ink-muted">Studio</button>}
              </nav>
            </div>

            <div className="space-y-4">
              <h4 className="text-xs font-bold text-ink-muted uppercase tracking-widest">Connect</h4>
              <nav className="flex flex-col gap-3 text-sm font-semibold text-ink-muted">
                <a href="#" className="w-fit hover:text-accent transition-colors">Twitter / X</a>
                <a href="#" className="w-fit hover:text-accent transition-colors">LinkedIn</a>
              </nav>
            </div>
          </div>
          
          <div className="mt-16 pt-8 border-t border-border flex flex-col md:flex-row justify-between items-center gap-4 text-xs font-bold text-ink-muted uppercase tracking-wider">
            <p>© 2026 Blogs Platform. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
