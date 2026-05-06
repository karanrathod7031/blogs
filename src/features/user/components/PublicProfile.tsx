import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Mail, Calendar, Sparkles, MapPin, Link as LinkIcon, BookOpen, Heart, MessageSquare, ArrowLeft } from 'lucide-react';
import { BlogPost, UserProfile } from '../../../types';
import { authService } from '../../../services/authService';
import { getPublishedPostsForUser } from '../../../services/blogService';
import OptimizedImage from '../../../components/ui/OptimizedImage';
import { Skeleton } from '../../../components/ui/Skeleton';



interface PublicProfileProps {
  userId: string;
  onBack: () => void;
  onViewPost: (slug: string) => void;
}

function ProfileSkeleton() {
  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-12 animate-pulse">
      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-24" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
        <div className="lg:col-span-4 space-y-6">
          <div className="p-8 flex flex-col items-center space-y-6">
            <Skeleton className="w-32 h-32 md:w-40 md:h-40 rounded-full" />
            <div className="space-y-2 w-full flex flex-col items-center">
              <Skeleton className="h-8 w-48" />
              <Skeleton className="h-4 w-64" />
            </div>
            <Skeleton className="h-20 w-full rounded-2xl" />
            <div className="grid grid-cols-2 w-full gap-3">
              <Skeleton className="h-20 rounded-3xl" />
              <Skeleton className="h-20 rounded-3xl" />
            </div>
          </div>
        </div>
        <div className="lg:col-span-8 space-y-8">
          <Skeleton className="h-10 w-48" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[1, 2, 3, 4].map(i => (
              <Skeleton key={i} className="h-64 rounded-[2.5rem]" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function PublicProfile({ userId, onBack, onViewPost }: PublicProfileProps) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadProfile() {
      setLoading(true);
      try {
        const [userProfile, userPosts] = await Promise.all([
          authService.getUserProfile(userId),
          getPublishedPostsForUser(userId)
        ]);
        setProfile(userProfile);
        setPosts(userPosts);
      } catch (error) {
        console.error('Failed to load public profile:', error);
      } finally {
        setLoading(false);
      }
    }
    loadProfile();
    window.scrollTo(0, 0);
  }, [userId]);

  return (
    <AnimatePresence mode="wait">
      {loading ? (
        <motion.div
           key="skeleton"
           initial={{ opacity: 0 }}
           animate={{ opacity: 1 }}
           exit={{ opacity: 0 }}
           transition={{ duration: 0.3 }}
        >
          <ProfileSkeleton />
        </motion.div>
      ) : !profile ? (
        <motion.div
           key="empty"
           initial={{ opacity: 0 }}
           animate={{ opacity: 1 }}
           className="text-center py-20 card card-bordered border-rose-500/20 bg-rose-500/5"
        >
          <h2 className="text-2xl font-black text-ink mb-2">Subject Not Found</h2>
          <p className="text-ink-muted mb-6">The requested identity does not exist in our registry.</p>
          <button onClick={onBack} className="btn btn-secondary">Return to Registry</button>
        </motion.div>
      ) : (
        <motion.div
          key={profile.uid}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="max-w-7xl mx-auto space-y-8 pb-12"
        >
          {/* Navigation */}
      <div className="flex items-center justify-between">
        <button 
          onClick={onBack}
          className="flex items-center gap-2 text-ink-muted hover:text-accent font-black uppercase tracking-widest text-[10px] transition-colors group"
        >
          <ArrowLeft className="w-3 h-3 group-hover:-translate-x-1 transition-transform" />
          Back to Hub
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
        {/* Profile Sidebar (Desktop) / Top Card (Tablet/Mobile) */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="lg:col-span-4 space-y-6 lg:sticky lg:top-28 w-full max-w-2xl mx-auto lg:max-w-none"
        >
          <div className="bg-transparent p-8 md:p-10 relative overflow-hidden group">
            <div className="relative z-10 flex flex-col items-center text-center space-y-6">
              {/* Profile Photo */}
              <div className="relative">
                <div className="absolute -inset-2 bg-gradient-to-br from-accent via-purple-500 to-indigo-600 rounded-full blur-md opacity-20 group-hover:opacity-40 transition-opacity duration-500"></div>
                <div className="relative w-32 h-32 md:w-40 md:h-40 rounded-full border-4 border-border shadow-2xl overflow-hidden bg-bg-soft shrink-0">
                  <img 
                    src={profile.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile.uid}`} 
                    alt={profile.displayName}
                    className="w-full h-full object-cover transform transition-transform duration-700 group-hover:scale-110"
                    referrerPolicy="no-referrer"
                    loading="lazy"
                  />
                </div>
                {profile.role === 'admin' && (
                  <div className="absolute -bottom-1 -right-1 bg-accent text-slate-950 p-2.5 rounded-2xl shadow-xl border-2 border-border ring-4 ring-accent/10">
                    <Sparkles className="w-4 h-4" />
                  </div>
                )}
              </div>

              {/* Identity Info */}
              <div className="space-y-2">
                <h1 className="text-3xl md:text-2xl lg:text-3xl font-black text-ink tracking-tight bg-clip-text text-transparent bg-gradient-to-br from-ink to-ink-muted">
                  {profile.displayName}
                </h1>
                <div className="flex flex-col items-center gap-1.5 text-ink-muted font-medium text-sm">
                  <span className="flex items-center gap-2 px-3 py-1 bg-bg-soft rounded-full border border-border max-w-full overflow-hidden text-ellipsis text-ink">
                    <Mail className="w-3.5 h-3.5 text-accent/60 shrink-0" /> {profile.email}
                  </span>
                  {profile.createdAt && (
                    <span className="flex items-center gap-2 text-[10px] uppercase font-black tracking-widest text-ink-muted pt-2">
                      <Calendar className="w-3 h-3" /> Since {profile.createdAt.toDate().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                    </span>
                  )}
                </div>
              </div>

              {/* Bio Section */}
              <div className="w-full pt-4 border-t border-border">
                {profile.bio ? (
                  <div className="relative">
                    <Sparkles className="absolute -top-1 -left-1 w-3 h-3 text-accent/20" />
                    <p className="text-ink text-sm lg:text-base leading-relaxed italic whitespace-pre-wrap">
                      "{profile.bio}"
                    </p>
                  </div>
                ) : (
                  <p className="text-ink-muted text-[10px] uppercase font-black tracking-widest italic">Identity Unwritten</p>
                )}
              </div>

              {/* Core Stats */}
              <div className="grid grid-cols-2 w-full gap-3">
                <div className="p-3 lg:p-4 bg-bg-soft rounded-3xl border border-border flex flex-col items-center justify-center gap-1 hover:bg-card hover:shadow-sm transition-all">
                  <BookOpen className="w-4 h-4 text-accent" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-accent">{posts.length}</span>
                  <span className="text-[8px] font-black uppercase tracking-widest text-ink-muted">Records</span>
                </div>
                <div className="p-3 lg:p-4 bg-bg-soft rounded-3xl border border-border flex flex-col items-center justify-center gap-1 hover:bg-card hover:shadow-sm transition-all">
                  <Heart className="w-4 h-4 text-rose-500" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-rose-500">
                    {posts.reduce((acc, p) => acc + (p.likeCount || 0), 0)}
                  </span>
                  <span className="text-[8px] font-black uppercase tracking-widest text-ink-muted">Acclaim</span>
                </div>
              </div>

              <a 
                href={`mailto:${profile.email}`}
                className="w-full btn btn-secondary flex items-center justify-center gap-2 group/btn"
              >
                Inquire
                <Mail className="w-4 h-4 group-hover/btn:translate-x-0.5 transition-transform" />
              </a>
            </div>
          </div>
        </motion.div>

        {/* Content Area - Publication History */}
        <div className="lg:col-span-8 space-y-8">
          <header className="flex items-center justify-between pb-4 border-b border-border">
            <div className="space-y-1">
              <h2 className="text-2xl font-black text-ink flex items-center gap-3">
                <BookOpen className="w-6 h-6 text-accent" />
                Publication History
              </h2>
              <p className="text-ink-muted text-sm font-medium">Curated intelligence and professional broadcasts</p>
            </div>
          </header>

          {posts.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {posts.map((post, index) => (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 + index * 0.05 }}
                  key={post.id}
                  onClick={() => onViewPost(post.slug)}
                  className="card card-hover p-6 cursor-pointer group flex flex-col gap-4 border-border"
                >
                  {post.coverImage && (
                    <div className="h-44 -mx-6 -mt-6 mb-2 overflow-hidden rounded-t-[2.5rem]">
                      <OptimizedImage 
                        src={post.coverImage} 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" 
                        alt={post.title} 
                        aspectRatio="h-full"
                      />
                    </div>
                  )}
                  
                  <div className="flex justify-between items-center gap-2">
                    <span className="badge badge-primary bg-accent/10 text-accent border-accent/10 py-1 px-3">
                      {post.category || 'Uncategorized'}
                    </span>
                    <time className="text-[9px] font-black text-ink-muted uppercase tracking-widest bg-bg-soft px-2 py-1 rounded-md">
                      {post.createdAt.toDate().toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </time>
                  </div>

                  <h3 className="text-xl font-black text-ink group-hover:text-accent transition-colors line-clamp-2 leading-tight">
                    {post.title}
                  </h3>
                  
                  <p className="text-ink-muted text-sm line-clamp-3 mb-2 leading-relaxed">
                    {post.excerpt}
                  </p>
                  
                  <div className="mt-auto pt-6 border-t border-border flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-1.5 px-2 py-1 bg-rose-500/5 rounded-lg border border-rose-500/10">
                        <Heart className="w-3 h-3 text-rose-500" /> 
                        <span className="text-[10px] font-black text-rose-600">{post.likeCount || 0}</span>
                      </div>
                      <div className="flex items-center gap-1.5 px-2 py-1 bg-accent/5 rounded-lg border border-accent/10">
                        <MessageSquare className="w-3 h-3 text-accent" /> 
                        <span className="text-[10px] font-black text-accent">Analysis</span>
                      </div>
                    </div>
                    <span className="text-[10px] font-black uppercase text-accent group-hover:translate-x-1 transition-transform tracking-widest flex items-center gap-1">
                      Explore Record <ArrowLeft className="w-3 h-3 rotate-180" />
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="card p-16 text-center border-dashed border-2 border-border bg-bg-soft/50"
            >
              <div className="w-20 h-20 bg-bg-soft rounded-full flex items-center justify-center mx-auto mb-6 text-border">
                <BookOpen className="w-10 h-10" />
              </div>
              <h3 className="text-xl font-bold text-ink-muted mb-2">Registry Silent</h3>
              <p className="text-ink-muted/60 font-medium italic max-w-xs mx-auto">
                No intelligence broadcasts have been logged for this identity at this time.
              </p>
            </motion.div>
          )}
        </div>
      </div>
    </motion.div>
  )}
</AnimatePresence>
  );
}
