import { ReactNode, useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { LogIn, LogOut, FileText, Menu, X, Eye, Plus } from 'lucide-react';
import { signInWithGoogle, signOut } from '../lib/firebase';
import { useAuthState } from '../hooks/useAuthState';

interface LayoutProps {
  children: ReactNode;
  activeView: string;
  onViewChange: (view: any) => void;
  onNew?: () => void;
}

export default function Layout({ children, activeView, onViewChange, onNew }: LayoutProps) {
  const { user, loading } = useAuthState();
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
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
      await signInWithGoogle();
    } catch (error: any) {
      if (
        error.code !== 'auth/popup-closed-by-user' && 
        error.code !== 'auth/cancelled-popup-request'
      ) {
        console.error('Authentication Error:', error);
      }
    } finally {
      setSigningIn(false);
    }
  };

  const navLinks = [
    { name: 'Feed', view: 'list' },
  ];

  return (
    <div className="min-h-screen flex flex-col selection:bg-purple-100 selection:text-accent">
      <div className="cursor-glow" ref={cursorRef} />
      <div className="floating-blob blob-one" />
      <div className="floating-blob blob-two" />

      <header className={`fixed top-0 left-0 z-50 w-full transition-all duration-300 ${scrolled ? 'bg-white/80 shadow-clean backdrop-blur-xl border-b border-slate-200 py-4' : 'bg-transparent py-6'}`}>
        <div className="max-w-7xl mx-auto px-6 md:px-10 flex items-center justify-between">
          <button 
            onClick={() => onViewChange('list')}
            className="text-xl md:text-2xl font-black tracking-tight text-ink hover:opacity-80 transition-opacity"
          >
            Blogs<span className="text-accent underline decoration-accent/20 underline-offset-4 pointer-events-none">.</span>
          </button>

          <nav className="hidden md:flex items-center gap-9">
            {navLinks.map((link) => (
              <button 
                key={link.name}
                onClick={() => onViewChange(link.view)}
                className={`nav-link text-base tracking-tight ${activeView === link.view ? 'text-accent' : ''}`}
              >
                {link.name}
              </button>
            ))}
            {user && (
              <button 
                onClick={() => onViewChange('admin')}
                className={`nav-link text-base tracking-tight ${activeView === 'admin' ? 'text-accent' : ''}`}
              >
                Studio
              </button>
            )}
            
            <div className="h-4 w-px bg-slate-200" />
            
            {!loading && (
              user ? (
                <div className="flex items-center gap-4">
                  <button 
                    onClick={signOut}
                    className="p-2 text-slate-400 hover:text-rose-500 transition-colors"
                  >
                    <LogOut className="w-5 h-5" />
                  </button>
                </div>
              ) : (
                <button 
                  onClick={handleSignIn}
                  disabled={signingIn}
                  className="flex items-center gap-2 px-5 py-2.5 bg-accent text-white text-sm font-bold rounded-xl hover:bg-accent-hover transition-all active:scale-95 shadow-lg shadow-accent/20 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <LogIn className="w-4 h-4" />
                  <span>{signingIn ? 'Authenticating...' : 'Editor Access'}</span>
                </button>
              )
            )}
          </nav>

          <button 
            className="md:hidden p-2 bg-white/40 border border-slate-300 rounded-full"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </header>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed inset-x-6 top-24 z-50 bg-white/90 backdrop-blur-xl border border-white/30 rounded-2xl p-6 shadow-clean md:hidden"
          >
            <div className="flex flex-col gap-4">
              {navLinks.map((link) => (
                <button 
                  key={link.name}
                  onClick={() => {
                    onViewChange(link.view);
                    setMobileMenuOpen(false);
                  }}
                  className={`text-lg font-black text-left py-2 border-b border-slate-50 ${activeView === link.view ? 'text-accent' : 'text-ink'}`}
                >
                  {link.name}
                </button>
              ))}
              {user && (
                <button 
                  onClick={() => {
                    onViewChange('admin');
                    setMobileMenuOpen(false);
                  }}
                  className={`text-lg font-black text-left py-2 border-b border-slate-50 ${activeView === 'admin' ? 'text-accent' : 'text-ink'}`}
                >
                  Studio
                </button>
              )}
              {user ? (
                <button 
                  onClick={() => {
                    signOut();
                    setMobileMenuOpen(false);
                  }}
                  className="mt-4 flex items-center justify-center gap-2 rounded-xl bg-slate-50 px-4 py-4 font-black text-xs uppercase tracking-widest text-ink hover:bg-slate-100 transition-colors"
                >
                  <LogOut className="h-4 w-4" />
                  Sign Out
                </button>
              ) : (
                <button 
                  onClick={() => {
                    handleSignIn();
                    setMobileMenuOpen(false);
                  }}
                  disabled={signingIn}
                  className="mt-4 flex items-center justify-center gap-2 rounded-xl bg-accent px-4 py-4 font-black text-xs uppercase tracking-widest text-white shadow-lg shadow-accent/20 disabled:opacity-50 transition-all active:scale-95"
                >
                  <LogIn className="h-4 w-4" />
                  {signingIn ? 'Authenticating...' : 'Editor Access'}
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <main className="flex-grow pt-24 md:pt-32 pb-16 md:pb-24">
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
      </main>

      <footer className="bg-white border-t border-slate-200 py-10 md:py-16">
        <div className="max-w-7xl mx-auto px-4 md:px-10">
          <div className="grid md:grid-cols-4 gap-12">
            <div className="md:col-span-2 space-y-6">
              <h3 className="text-2xl font-black tracking-tight">Blogs<span className="text-accent underline decoration-accent/20 underline-offset-4 pointer-events-none">.</span></h3>
              <p className="text-ink-muted text-sm max-w-xs leading-relaxed font-medium">
                A technical writing playground exploring the future of web architectures and engineering principles.
              </p>
            </div>
            
            <div className="space-y-4">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Navigation</h4>
              <nav className="flex flex-col gap-3 text-sm font-semibold">
                <button onClick={() => onViewChange('list')} className="w-fit hover:text-accent transition-colors">Feed</button>
                {user && <button onClick={() => onViewChange('admin')} className="w-fit hover:text-accent transition-colors">Studio</button>}
              </nav>
            </div>

            <div className="space-y-4">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Connect</h4>
              <nav className="flex flex-col gap-3 text-sm font-semibold">
                <a href="#" className="w-fit hover:text-accent transition-colors">Twitter / X</a>
                <a href="#" className="w-fit hover:text-accent transition-colors">LinkedIn</a>
              </nav>
            </div>
          </div>
          
          <div className="mt-16 pt-8 border-t border-slate-100 flex flex-col md:flex-row justify-between items-center gap-4 text-xs font-bold text-slate-400 uppercase tracking-wider">
            <p>© 2026 Blogs Platform. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
