import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import { motion, AnimatePresence, useMotionValue, useTransform } from 'motion/react';
import { 
  ArrowLeft, 
  Share2, 
  Calendar, 
  Clock, 
  ArrowRight, 
  MessageSquare,
  MessageCircle,
  Heart,
  User as UserIcon,
  Twitter,
  Facebook,
  Link as LinkIcon
} from 'lucide-react';
import { BlogPost, UserProfile, Comment } from '../../../types';
import { format } from 'date-fns';
import { calculateReadingTime } from '../../../lib/blog-utils';
import { useState, useEffect, useMemo } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import { useAuthState } from '../../../hooks/useAuthState';
import { toggleLike, isPostLiked, addComment, getComments } from '../../../services/blogService';
import OptimizedImage from '../../../components/ui/OptimizedImage';

import { Skeleton } from '../../../components/ui/Skeleton';

interface BlogPostProps {
  post: BlogPost | null;
  onBack: () => void;
  onSelectPost?: (slug: string) => void;
  allPosts?: BlogPost[];
  onNotify: (msg: string, type: 'success' | 'error') => void;
  onViewProfile?: (userId: string) => void;
  slug?: string;
  loading?: boolean;
}

function PostSkeleton() {
  return (
    <div className="grid lg:grid-cols-[1fr_320px] gap-6 md:gap-12 lg:gap-16 opacity-60">
      <div className="space-y-8">
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <Skeleton className="h-6 w-24 rounded-lg" />
            <div className="h-4 w-px bg-border/50" />
            <div className="flex items-center gap-2">
              <Skeleton className="h-3 w-3 rounded-full" />
              <Skeleton className="h-3 w-32 rounded-sm" />
            </div>
          </div>
          <div className="space-y-4">
            <Skeleton className="h-14 w-full rounded-2xl" />
            <Skeleton className="h-14 w-3/4 rounded-2xl" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-5 w-full rounded-md" />
            <Skeleton className="h-5 w-2/3 rounded-md" />
          </div>
          <div className="flex items-center gap-4 pt-4">
            <Skeleton className="w-12 h-12 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-32 rounded-sm" />
              <Skeleton className="h-3 w-24 rounded-sm" />
            </div>
          </div>
        </div>
        
        <div className="relative">
          <Skeleton className="aspect-video w-full rounded-[3rem]" />
          <div className="absolute inset-x-8 -bottom-6 flex gap-3">
            <Skeleton className="h-12 w-24 rounded-2xl" />
            <Skeleton className="h-12 w-24 rounded-2xl" />
          </div>
        </div>
        
        <div className="space-y-6 pt-12">
          <div className="space-y-3">
            <Skeleton className="h-5 w-full rounded-md" />
            <Skeleton className="h-5 w-full rounded-md" />
            <Skeleton className="h-5 w-5/6 rounded-md" />
          </div>
          <div className="aspect-[21/9] w-full bg-bg-soft/30 rounded-[2rem] border border-border/20 flex flex-col items-center justify-center gap-4">
            <Skeleton className="h-4 w-1/3 rounded-sm" />
            <Skeleton className="h-10 w-1/2 rounded-xl" />
          </div>
          <div className="space-y-3">
            <Skeleton className="h-5 w-full rounded-md" />
            <Skeleton className="h-5 w-11/12 rounded-md" />
            <Skeleton className="h-5 w-full rounded-md" />
            <Skeleton className="h-5 w-4/6 rounded-md" />
          </div>
        </div>
      </div>

      <aside className="hidden lg:block space-y-12">
        <div className="space-y-6">
          <Skeleton className="h-4 w-32 rounded-sm opacity-40" />
          <div className="space-y-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="h-1 w-1 rounded-full" />
                <Skeleton className={`h-4 rounded-sm ${i === 1 ? 'w-full' : i === 2 ? 'w-5/6' : 'w-4/6'}`} />
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          <Skeleton className="h-4 w-32 rounded-sm opacity-40" />
          <div className="flex gap-3">
            <Skeleton className="h-12 w-12 rounded-2xl" />
            <Skeleton className="h-12 w-12 rounded-2xl" />
            <Skeleton className="h-12 w-12 rounded-2xl" />
          </div>
        </div>

        <div className="p-10 bg-card rounded-[3rem] border border-border/50 space-y-5 shadow-clean-sm">
          <Skeleton className="h-4 w-28 rounded-sm text-accent" />
          <div className="space-y-3">
            <Skeleton className="h-3 w-full rounded-sm" />
            <Skeleton className="h-3 w-full rounded-sm" />
            <Skeleton className="h-3 w-4/5 rounded-sm" />
            <Skeleton className="h-3 w-full rounded-sm opacity-50" />
          </div>
        </div>
      </aside>
    </div>
  );
}

function RelatedPostSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-10">
      {[1, 2, 3].map((i) => (
        <div key={i} className="p-5 rounded-[2.5rem] bg-card/50 border-2 border-border/30 space-y-5">
          <Skeleton className="aspect-[16/10] w-full rounded-[1.5rem]" />
          <div className="space-y-3 px-1">
            <Skeleton className="h-5 w-20 rounded-lg" />
            <div className="space-y-2">
              <Skeleton className="h-7 w-full rounded-md" />
              <Skeleton className="h-7 w-2/3 rounded-md" />
              <div className="pt-2">
                <Skeleton className="h-3 w-full rounded-sm" />
                <Skeleton className="h-3 w-4/5 rounded-sm mt-1" />
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function BlogPostView({ post, onBack, onSelectPost, allPosts = [], onNotify, onViewProfile, loading: propLoading }: BlogPostProps) {
  const { user } = useAuthState();
  const [copied, setCopied] = useState(false);
  const [authorProfile, setAuthorProfile] = useState<UserProfile | null>(null);
  
  const [liked, setLiked] = useState(false);
  const [isLiking, setIsLiking] = useState(false);
  const [likeCount, setLikeCount] = useState(post?.likeCount || 0);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  
  const dragX = useMotionValue(0);
  const backOpacity = useTransform(dragX, [0, 100], [0, 1], { clamp: true });
  const backScale = useTransform(dragX, [0, 100], [0.5, 1.2], { clamp: true });
  const backIconX = useTransform(dragX, [0, 100], [-20, 20], { clamp: true });

  useEffect(() => {
    if (!post) return;
    
    const fetchAuthorProfile = async () => {
      try {
        const docRef = doc(db, 'users', post.authorId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setAuthorProfile(docSnap.data() as UserProfile);
        }
      } catch (err) {
        console.error('Error fetching author profile:', err);
      }
    };

    const fetchInteractions = async () => {
      try {
        if (user) {
          isPostLiked(post.id, user.uid).then(setLiked).catch(() => {});
        }
        getComments(post.id).then(setComments).catch(() => {});
      } catch {
        // Silently fail for non-critical interactions
      }
    };

    setLikeCount(post.likeCount || 0);
    fetchAuthorProfile();
    fetchInteractions();
    window.scrollTo(0, 0);
  }, [post?.authorId, post?.id, user]);

  const handleLike = async () => {
    if (!user) {
      onNotify('Please login to like posts', 'error');
      return;
    }
    
    const newLikedState = !liked;
    setLiked(newLikedState);
    setLikeCount(prev => newLikedState ? prev + 1 : prev - 1);
    setIsLiking(true);
    
    try {
      await toggleLike(post.id, user.uid, liked);
    } catch {
      setLiked(liked);
      setLikeCount(post.likeCount || 0);
      onNotify('Failed to update like', 'error');
    } finally {
      setIsLiking(false);
    }
  };

  const handleComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!newComment.trim()) return;

    setSubmittingComment(true);
    try {
      const comment = await addComment(post.id, user.uid, user.displayName || 'Anonymous', newComment, user.photoURL || undefined);
      setComments([comment, ...comments]);
      setNewComment('');
      onNotify('Comment added successfully', 'success');
    } catch {
      onNotify('Failed to add comment', 'error');
    } finally {
      setSubmittingComment(false);
    }
  };

  const relatedPosts = useMemo(() => {
    if (!post) return [];
    return allPosts
      .filter(p => p.id !== post.id && (p.category === post.category || p.tags.some(t => post.tags.includes(t))))
      .slice(0, 3);
  }, [post, allPosts]);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const toc = useMemo(() => {
    if (!post) return [];
    return post.content.match(/^#+\s+.+$/gm)?.map(h => ({
      text: h.replace(/^#+\s+/, ''),
      level: h.match(/^#+/)?.[0].length || 1
    })) || [];
  }, [post]);

  return (
    <div className="relative">
      <AnimatePresence mode="wait">
        {(!post || propLoading) ? (
          <motion.div
            key="skeleton"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="max-w-7xl mx-auto py-8 px-4 md:px-10"
          >
            <div className="mb-8">
              <button 
                onClick={onBack}
                className="group flex items-center gap-2 text-xs font-bold text-ink-muted hover:text-accent transition-colors"
              >
                <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                Back to networking
              </button>
            </div>
            <PostSkeleton />
            
            <section className="bg-bg-soft/20 border-t border-border/30 mt-16 md:mt-24 py-12 md:py-24 -mx-4 md:-mx-10 px-4 md:px-10">
              <div className="max-w-7xl mx-auto space-y-16">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 md:gap-6 opacity-40">
                  <div className="space-y-4">
                    <Skeleton className="h-10 w-64 rounded-xl" />
                    <Skeleton className="h-5 w-96 rounded-md" />
                  </div>
                </div>
                <RelatedPostSkeleton />
              </div>
            </section>
          </motion.div>
        ) : (
          <motion.div
            key={post.id}
            drag="x"
            dragConstraints={{ left: 0, right: 300 }}
            dragElastic={0.1}
            dragDirectionLock
            onDrag={(e, info) => {
              dragX.set(info.offset.x);
            }}
            onDragEnd={(e, info) => {
              if (info.offset.x > 120 || (info.offset.x > 50 && info.velocity.x > 400)) {
                onBack();
              }
              dragX.set(0);
            }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="max-w-7xl mx-auto py-8 px-4 md:px-10 touch-pan-y"
            style={{ x: dragX }}
          >
            {/* Swipe Back Indicator - iOS/Android style */}
            <motion.div 
              style={{ 
                opacity: backOpacity,
                scale: backScale,
                x: backIconX,
                position: 'fixed',
                left: 0,
                top: '50%',
                marginTop: '-40px',
                zIndex: 100,
                pointerEvents: 'none'
              }}
              className="flex items-center justify-center w-16 h-20 bg-accent/90 backdrop-blur-md text-slate-900 rounded-r-[3rem] shadow-[10px_0_30px_rgba(0,0,0,0.3)] border-r-4 border-white/30"
            >
              <ArrowLeft className="w-8 h-8 stroke-[4] -p-1" />
            </motion.div>

            <div className="mb-8">
              <button 
                onClick={onBack}
                className="group flex items-center gap-2 text-xs font-bold text-ink-muted hover:text-accent transition-colors"
              >
                <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                Back to networking
              </button>
            </div>

            {/* Header section... */}

      <article id="post-content-view" className="grid lg:grid-cols-[1fr_320px] gap-6 md:gap-12 lg:gap-16">
        <div className="space-y-6 md:space-y-8">
          {/* Header */}
          <header className="space-y-3 md:space-y-4">
            <div className="flex items-center gap-3">
              <span className={`badge ${post.type === 'trade' ? 'bg-amber-400/10 text-amber-500 border border-amber-400/20' : 'badge-primary'} scale-90 md:scale-100 origin-left`}>
                {post.type === 'trade' ? 'Trade Hub' : (post.category || 'Opinion')}
              </span>
              <div className="h-4 w-px bg-border" />
              <div className="flex items-center gap-3 text-[10px] font-bold text-ink-muted uppercase tracking-widest">
                <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" /> {format(post.createdAt.toDate(), 'MMM d, yyyy')}</span>
                <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> {calculateReadingTime(post.content)}m read</span>
              </div>
            </div>
            
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-black leading-tight tracking-tight text-ink">
              {post.title}
            </h1>
            <p className="text-sm md:text-lg text-ink-muted leading-relaxed font-medium">
              {post.excerpt}
            </p>

            <div 
              className="flex items-center gap-3 pt-2 cursor-pointer group/author w-fit"
              onClick={() => onViewProfile?.(post.authorId)}
            >
              <div className="relative">
                {authorProfile?.photoURL ? (
                  <img 
                    src={authorProfile.photoURL} 
                    alt="" 
                    className="w-8 h-8 rounded-full border border-border group-hover/author:border-accent transition-colors" 
                    referrerPolicy="no-referrer"
                    loading="lazy" 
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-bg-soft border border-border flex items-center justify-center font-bold text-[10px] text-ink-muted group-hover/author:ring-2 ring-accent transition-all">
                    {post.authorName.charAt(0)}
                  </div>
                )}
              </div>
              <div>
                <p className="text-xs font-bold text-ink group-hover/author:text-accent transition-colors">{post.authorName}</p>
                <p className="text-[9px] uppercase font-bold text-ink-muted/60 tracking-wider">Verified Contributor</p>
              </div>
            </div>
          </header>


          {post.type === 'trade' && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              className="grid grid-cols-1 md:grid-cols-3 gap-4 p-5 md:p-6 bg-card text-ink rounded-3xl shadow-xl border border-border"
            >
              <div className="space-y-0.5">
                <p className="text-[9px] font-black uppercase text-ink-muted tracking-widest flex items-center gap-1.5">
                  <Briefcase className="w-3 h-3" /> Sector
                </p>
                <p className="text-base font-bold">{post.tradeCategory || 'Global Direct'}</p>
              </div>
              <div className="space-y-0.5">
                <p className="text-[9px] font-black uppercase text-ink-muted tracking-widest flex items-center gap-1.5">
                  <DollarSign className="w-3 h-3" /> Volume
                </p>
                <p className="text-base font-bold text-emerald-500">{post.tradeValue || 'Negotiable'}</p>
              </div>
              <div className="space-y-0.5">
                <p className="text-[9px] font-black uppercase text-ink-muted tracking-widest flex items-center gap-1.5">
                  <MapPin className="w-3 h-3" /> Hub
                </p>
                <p className="text-base font-bold">{post.location || 'Global'}</p>
              </div>
            </motion.div>
          )}

          <div className="max-h-[85vh] overflow-y-auto scrollbar-thin pr-4 -mr-4">
            {post.coverImage && (
              <OptimizedImage 
                src={post.coverImage} 
                alt={post.title} 
                className="rounded-3xl shadow-md border border-border/50 mb-8" 
                aspectRatio="aspect-video"
              />
            )}

            <div className="prose prose-sm md:prose-lg max-w-none prose-headings:text-ink prose-headings:font-black prose-p:text-ink-muted prose-p:leading-relaxed prose-strong:text-ink prose-strong:font-black prose-a:text-accent prose-blockquote:border-l-accent prose-blockquote:bg-bg-soft prose-blockquote:rounded-r-xl prose-img:rounded-3xl prose-table:border prose-table:border-border prose-th:bg-bg-soft prose-th:px-4 prose-th:py-2 prose-td:border prose-td:border-border prose-td:px-4 prose-td:py-2">
              <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]}>{post.content}</ReactMarkdown>
            </div>
          </div>

          {/* YouTube Style Interaction Bar */}
          <div className="flex flex-wrap items-center justify-between gap-4 py-6 border-y border-border">
            <div className="flex items-center gap-2">
              <button 
                onClick={handleLike}
                disabled={isLiking}
                className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-black transition-all ${liked ? 'bg-rose-500/10 text-rose-500' : 'bg-bg-soft text-ink-muted hover:bg-card border border-border'} ${isLiking ? 'opacity-70' : ''}`}
              >
                {isLiking ? (
                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Heart className={`w-4 h-4 ${liked ? 'fill-current' : ''}`} />
                )}
                {likeCount}
              </button>
              
              <div className="flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-black bg-bg-soft text-ink-muted border border-border">
                <MessageCircle className="w-4 h-4" />
                {comments.length}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button 
                onClick={handleCopyLink}
                className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-black transition-all ${copied ? 'bg-emerald-500/10 text-emerald-500' : 'bg-bg-soft text-ink-muted hover:bg-card border border-border'}`}
              >
                <Share2 className="w-4 h-4" />
                {copied ? 'Copied' : 'Share'}
              </button>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {post.tags.map(tag => (
              <span key={tag} className="px-3 py-1 bg-bg-soft text-ink-muted rounded-lg text-[10px] font-bold border border-border">
                #{tag}
              </span>
            ))}
          </div>

          {/* Interactions */}
          <section className="pt-10 space-y-8">
            <div className="flex items-center gap-4">
              <h3 className="text-xs font-black text-ink uppercase tracking-widest whitespace-nowrap">{comments.length} Comments</h3>
              <div className="h-px bg-border flex-grow" />
            </div>

            {user ? (
              <form onSubmit={handleComment} className="flex gap-4">
                <div className="flex-shrink-0">
                  {user.photoURL ? (
                    <img 
                      src={user.photoURL} 
                      alt="" 
                      className="w-10 h-10 rounded-full object-cover" 
                      referrerPolicy="no-referrer" 
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-10 h-10 bg-slate-800 rounded-full flex items-center justify-center text-slate-500">
                      <UserIcon className="w-5 h-5" />
                    </div>
                  )}
                </div>
                <div className="relative flex-grow">
                  <textarea 
                    value={newComment}
                    onChange={e => setNewComment(e.target.value)}
                    placeholder="Add a comment..."
                    rows={1}
                    className="w-full py-2 bg-transparent border-b border-border focus:border-accent outline-none text-sm transition-all resize-none text-ink pb-3"
                    onInput={(e) => {
                      const target = e.target as HTMLTextAreaElement;
                      target.style.height = 'auto';
                      target.style.height = target.scrollHeight + 'px';
                    }}
                  />
                  <div className="flex justify-end gap-2 mt-2">
                    <button 
                      type="button"
                      onClick={() => setNewComment('')}
                      className="px-4 py-2 text-xs font-bold text-ink-muted hover:bg-bg-soft rounded-full transition-all"
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit"
                      disabled={submittingComment || !newComment.trim()}
                      className="px-4 py-2 text-xs font-bold bg-accent text-slate-900 rounded-full shadow-sm hover:opacity-90 disabled:opacity-50 transition-all font-black"
                    >
                      Comment
                    </button>
                  </div>
                </div>
              </form>
            ) : (
              <div className="p-6 bg-bg-soft rounded-2xl text-center border border-dashed border-border">
                <p className="text-xs font-bold text-ink-muted italic">Sign in to participate in the discourse.</p>
              </div>
            )}

            <div className="space-y-6 pt-4">
              {comments.map((comment) => (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  key={comment.id} 
                  className="flex gap-4"
                >
                  <div className="flex-shrink-0">
                    {comment.authorPhoto ? (
                      <img 
                        src={comment.authorPhoto} 
                        alt="" 
                        className="w-10 h-10 rounded-full object-cover shadow-sm border border-border" 
                        referrerPolicy="no-referrer" 
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-10 h-10 bg-bg-soft border border-border rounded-full flex items-center justify-center text-ink-muted">
                        <UserIcon className="w-5 h-5" />
                      </div>
                    )}
                  </div>
                  <div className="space-y-1 content-center">
                    <div className="flex items-center gap-2">
                      <p className="text-xs font-black text-ink">{comment.authorName}</p>
                      <p className="text-[10px] font-bold text-ink-muted">{format(comment.createdAt.toDate(), 'MMM d')}</p>
                    </div>
                    <p className="text-sm font-medium text-ink-muted leading-relaxed whitespace-pre-wrap">{comment.content}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </section>
        </div>

        {/* Sidebar */}
        <aside className="hidden lg:block space-y-12 sticky top-32 h-fit">
          {toc.length > 0 && (
            <div className="space-y-4">
              <h4 className="text-[10px] font-black text-ink-muted uppercase tracking-[0.3em]">Mapping the Inquiry</h4>
              <nav className="flex flex-col gap-3">
                {toc.map((item, i) => (
                  <a 
                    key={i} 
                    href="#" 
                    onClick={(e) => e.preventDefault()}
                    className={`text-sm font-bold transition-all hover:text-accent hover:translate-x-1 ${item.level > 1 ? 'pl-4 text-ink-muted text-xs' : 'text-ink-muted/80'}`}
                  >
                    {item.text}
                  </a>
                ))}
              </nav>
            </div>
          )}

          <div className="space-y-4">
            <h4 className="text-[10px] font-black text-ink-muted uppercase tracking-[0.3em]">Network Distribution</h4>
            <div className="flex gap-2">
              <button className="p-3 rounded-2xl bg-bg-soft border border-border text-ink-muted shadow-sm hover:border-accent hover:text-accent hover:-translate-y-1 transition-all"><Twitter className="w-4 h-4" /></button>
              <button className="p-3 rounded-2xl bg-bg-soft border border-border text-ink-muted shadow-sm hover:border-accent hover:text-accent hover:-translate-y-1 transition-all"><Facebook className="w-4 h-4" /></button>
              <button 
                onClick={handleCopyLink} 
                className={`p-3 rounded-2xl border shadow-sm transition-all hover:-translate-y-1 ${copied ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' : 'bg-bg-soft border-border text-ink-muted hover:border-accent hover:text-accent'}`}
              >
                <LinkIcon className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="p-8 bg-card rounded-[2rem] border border-border space-y-5 shadow-clean">
            <h4 className="text-[10px] font-black text-accent uppercase tracking-[0.3em]">Architect profile</h4>
            <p className="text-xs leading-relaxed text-ink-muted font-medium italic">
              {authorProfile?.bio || "Contributor to the global knowledge network, focused on cross-industry architecture and digital narratives."}
            </p>
          </div>

          {post.type === 'trade' && (
            <div className="p-8 bg-accent text-slate-900 rounded-[2rem] shadow-2xl space-y-5">
              <h4 className="text-[10px] font-bold uppercase tracking-[0.3em] opacity-80">Initialization Hub</h4>
              <p className="text-xs font-bold leading-relaxed">
                Connect securely to discuss procurement terms, logistical requirements, or obtain validated documentation.
              </p>
              <button className="w-full bg-slate-900 text-accent py-4 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] flex items-center justify-center gap-2 hover:bg-slate-800 transition-all active:scale-95 shadow-lg">
                <MessageSquare className="w-4 h-4" /> Finalize Connection
              </button>
            </div>
          )}
        </aside>
      </article>

      <AnimatePresence mode="wait">
        {relatedPosts.length > 0 && (
          <motion.section 
            key={post.id + '-related'}
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
            className="bg-bg-soft/50 border-t border-border mt-16 md:mt-24 py-12 md:py-24 -mx-4 md:-mx-10 px-4 md:px-10"
          >
            <div className="max-w-7xl mx-auto space-y-16">
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 md:gap-6">
                <div className="space-y-4">
                  <h2 className="text-2xl md:text-4xl font-black tracking-tight text-ink">Network Proximities</h2>
                  <p className="text-ink-muted font-medium text-sm md:text-lg leading-relaxed max-w-xl">Further dispatches related to the current inquiry within the architecture.</p>
                </div>
                <button 
                  onClick={onBack} 
                  className="flex items-center gap-3 px-8 py-4 bg-card border border-border rounded-2xl text-xs font-black uppercase tracking-[0.1em] text-accent hover:shadow-lg transition-all shadow-clean-sm"
                >
                  Expand feed <ArrowRight className="w-4 h-4" />
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-10">
                {relatedPosts.map((p, i) => (
                  <motion.article 
                    key={p.id} 
                    initial={{ opacity: 0, scale: 0.95 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: i * 0.1 }}
                    className="group cursor-pointer p-5 rounded-[2.5rem] bg-card border-2 border-border shadow-sm transition-all hover:shadow-2xl hover:-translate-y-3 hover:border-accent/30" 
                    onClick={() => { 
                      if (onSelectPost) {
                        onSelectPost(p.slug);
                      } else {
                        onBack();
                      }
                    }}
                  >
                    <div className="rounded-[1.5rem] overflow-hidden mb-5 aspect-[16/10] relative">
                      <div className="absolute inset-0 bg-accent/10 opacity-0 group-hover:opacity-100 transition-opacity z-10" />
                      <OptimizedImage 
                        src={p.coverImage || `https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&q=80&w=800`} 
                        alt={p.title} 
                        className="w-full h-full transition-transform duration-700 group-hover:scale-110" 
                        aspectRatio="aspect-[16/10]"
                      />
                    </div>
                    <div className="space-y-3 px-1">
                      <span className={`inline-block px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${p.type === 'trade' ? 'bg-amber-400/10 text-amber-500' : 'badge-primary'}`}>
                        {p.type === 'trade' ? 'Trade' : (p.category || 'Opinion')}
                      </span>
                      <div className="space-y-2">
                        <h3 className="font-black text-xl leading-tight group-hover:text-accent transition-colors line-clamp-2 text-ink">{p.title}</h3>
                        <p className="text-xs text-ink-muted leading-relaxed line-clamp-2 min-h-[2.5rem] italic opacity-70">
                          {p.excerpt || (p.content.replace(/[#*`]/g, '').slice(0, 80) + '...')}
                        </p>
                      </div>
                    </div>
                  </motion.article>
                ))}
              </div>
            </div>
          </motion.section>
        )}
      </AnimatePresence>
    </motion.div>
  )}
</AnimatePresence>
    </div>
  );
}
