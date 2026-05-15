import { ReactNode, useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { LogIn, LogOut, Plus, Home, LayoutDashboard, Shield, Search, SquarePen, CircleUserRound } from 'lucide-react';
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

  const isAdmin = profile?.role === 'admin' || user?.email === 'rk.upk2345678@gmail.com';

  const handleMobileSearch = () => {
    if (activeView !== 'list') {
      onViewChange('list');
    }

    window.setTimeout(() => {
      const searchInput = document.getElementById('feed-search') as HTMLInputElement | null;
      if (searchInput) {
        searchInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
        searchInput.focus();
      }
    }, activeView === 'list' ? 80 : 320);
  };

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
            {!loading && (
              user ? (
                <button
                  onClick={handleSignOut}
                  className="rounded-full border border-border bg-bg-soft p-2.5 text-ink-muted transition-colors hover:text-rose-500"
                  title="Terminate Session"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              ) : (
                <button 
                  onClick={handleSignIn}
                  disabled={signingIn}
                  className="flex items-center gap-2 rounded-full bg-accent px-4 py-2.5 text-xs font-black text-slate-900 shadow-lg shadow-accent/20 disabled:opacity-50"
                >
                  <LogIn className="h-4 w-4" />
                  <span>{signingIn ? '...' : 'Editor'}</span>
                </button>
              )
            )}
          </div>
        </div>
      </header>

      <main className="flex-grow pt-20 pb-[calc(8.5rem+env(safe-area-inset-bottom,0px))] md:pt-32 md:pb-24">
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
              className="md:hidden fixed right-5 z-40 flex h-16 w-16 items-center justify-center rounded-full bg-accent text-white shadow-2xl ring-4 ring-white transition-transform active:scale-90"
              style={{ bottom: 'calc(env(safe-area-inset-bottom, 0px) + 6.5rem)' }}
            >
              <Plus className="w-8 h-8" />
            </motion.button>
          )}
        </AnimatePresence>

        <div
          className="pointer-events-none fixed inset-x-0 z-50 md:hidden"
          style={{ bottom: 'calc(env(safe-area-inset-bottom, 0px))' }}
        >
          <div className="pointer-events-auto mx-auto flex w-full max-w-lg items-center justify-between border-t border-white/10 bg-slate-950/92 px-4 pb-[calc(env(safe-area-inset-bottom,0px)+0.7rem)] pt-3 shadow-[0_-14px_36px_rgba(2,6,23,0.45)] backdrop-blur-xl">
            <button
              onClick={() => onViewChange('list')}
              className={`flex h-12 w-12 items-center justify-center rounded-full transition-all ${
                activeView === 'list'
                  ? 'bg-accent/12 text-accent shadow-[0_0_20px_rgba(var(--accent-rgb),0.18)]'
                  : 'text-slate-400 hover:bg-white/5 hover:text-white'
              }`}
              aria-label="Home"
              title="Home"
            >
              <Home className="h-7 w-7" strokeWidth={2.4} />
            </button>

            <button
              onClick={() => {
                if (user) {
                  onViewChange('admin');
                } else {
                  void handleSignIn();
                }
              }}
              className={`flex h-12 w-12 items-center justify-center rounded-full transition-all ${
                activeView === 'admin'
                  ? 'bg-accent/12 text-accent shadow-[0_0_20px_rgba(var(--accent-rgb),0.18)]'
                  : 'text-slate-400 hover:bg-white/5 hover:text-white'
              }`}
              aria-label="Studio"
              title="Studio"
            >
              <SquarePen className="h-7 w-7" strokeWidth={2.2} />
            </button>

            <button
              onClick={() => {
                if (user && onNew) {
                  onNew();
                } else {
                  void handleSignIn();
                }
              }}
              className="relative flex h-12 w-12 items-center justify-center rounded-full bg-white/[0.04] text-white transition-all hover:bg-white/[0.08]"
              aria-label="Create post"
              title="Create post"
            >
              <Plus className="h-7 w-7" strokeWidth={2.5} />
              {user && <span className="absolute right-1.5 top-1.5 h-2.5 w-2.5 rounded-full bg-rose-500" />}
            </button>

            <button
              onClick={handleMobileSearch}
              className="flex h-12 w-12 items-center justify-center rounded-full text-slate-400 transition-all hover:bg-white/5 hover:text-white"
              aria-label="Search"
              title="Search"
            >
              <Search className="h-7 w-7" strokeWidth={2.2} />
            </button>

            <button
              onClick={() => {
                if (!user) {
                  void handleSignIn();
                  return;
                }

                onViewChange(isAdmin ? 'admin-panel' : 'admin');
              }}
              className={`relative flex h-12 w-12 items-center justify-center overflow-hidden rounded-full transition-all ${
                activeView === 'admin-panel' || activeView === 'admin' ? 'ring-2 ring-accent/45 ring-offset-2 ring-offset-slate-950' : ''
              }`}
              aria-label={isAdmin ? 'Admin panel' : 'Profile'}
              title={isAdmin ? 'Admin panel' : 'Profile'}
            >
              {user?.photoURL ? (
                <img
                  src={user.photoURL}
                  alt={user.displayName || 'Profile'}
                  className="h-11 w-11 rounded-full object-cover"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-slate-800 text-white">
                  {isAdmin ? <Shield className="h-6 w-6" strokeWidth={2.2} /> : <CircleUserRound className="h-6 w-6" strokeWidth={2.2} />}
                </div>
              )}
              <span className="absolute bottom-1 right-1 h-3 w-3 rounded-full border-2 border-slate-950 bg-rose-500" />
            </button>
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
