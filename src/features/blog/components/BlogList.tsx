import { useState, useMemo, memo, useEffect } from 'react';
import { motion } from 'motion/react';
import { Search, Clock, Calendar, ArrowRight, BookOpen, Globe, Briefcase, MapPin, DollarSign } from 'lucide-react';
import { BlogPost } from '../../../types';
import { format } from 'date-fns';
import { calculateReadingTime } from '../../../lib/blog-utils';
import OptimizedImage from '../../../components/ui/OptimizedImage';
import { BlogCardSkeleton, FeaturedBlogSkeleton } from '../../../components/ui/Skeleton';

interface BlogListProps {
  posts: BlogPost[];
  onSelectPost: (slug: string) => void;
  onViewProfile: (userId: string) => void;
  onLoadMore?: () => void;
  hasMore?: boolean;
  loadingMore?: boolean;
  loading?: boolean;
}

const CATEGORIES = ['All', 'Finance', 'Logistics', 'Commodities', 'Services', 'AI', 'Web Dev', 'Projects'];

// Memoized Post Item for performance
const PostItem = memo(({ 
  post, 
  idx, 
  onSelectPost, 
  onViewProfile,
  calculateReadingTime 
}: { 
  post: BlogPost, 
  idx: number, 
  onSelectPost: (slug: string) => void, 
  onViewProfile: (userId: string) => void,
  calculateReadingTime: (content: string) => number
}) => {
  return (
    <motion.article
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: idx * 0.05 }}
      className="premium-card overflow-hidden group flex flex-col"
    >
      <div className="cursor-pointer" onClick={() => onSelectPost(post.slug)}>
        <OptimizedImage 
          src={post.coverImage || `https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&q=80&w=800`} 
          alt={post.title}
          className="w-full h-full transition-transform duration-500 group-hover:scale-110"
          aspectRatio="aspect-[16/10]"
        />
      </div>
      <div className="p-5 md:p-6 space-y-3 md:space-y-4 flex flex-col flex-grow">
        <div className="flex items-center justify-between">
          <span className={`badge ${post.type === 'trade' ? 'bg-amber-500/10 text-amber-600 border border-amber-500/20' : 'badge-primary'} scale-90 md:scale-100 origin-left`}>
            {post.type === 'trade' ? 'Trade Entry' : (post.category || 'Blog')}
          </span>
          <span className="text-[10px] font-bold text-ink-muted uppercase tracking-wider flex items-center gap-1">
            <Clock className="w-3 h-3" /> {calculateReadingTime(post.content)}m
          </span>
        </div>
        <h3 onClick={() => onSelectPost(post.slug)} className="text-lg md:text-xl font-bold leading-tight group-hover:text-accent transition-colors line-clamp-2 cursor-pointer text-ink">
          {post.title}
        </h3>
        {post.type === 'trade' ? (
          <div className="space-y-2 p-3 bg-bg-soft rounded-xl border border-border">
            <p className="text-[10px] font-black uppercase text-ink-muted flex items-center gap-2">
              <Briefcase className="w-3.5 h-3.5" /> {post.tradeCategory || 'General Goods'}
            </p>
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-emerald-500 flex items-center gap-1">
                <DollarSign className="w-3 h-3" /> {post.tradeValue || 'Valuation Open'}
              </span>
              <span className="text-[10px] font-bold text-ink-muted flex items-center gap-1">
                <MapPin className="w-3 h-3" /> {post.location || 'Global'}
              </span>
            </div>
          </div>
        ) : (
          <p className="text-xs md:text-sm text-ink-muted leading-relaxed line-clamp-2 min-h-[2.5rem] flex-grow italic">
            {post.excerpt || (post.content.replace(/[#*`]/g, '').slice(0, 100) + '...')}
          </p>
        )}
        
        <div className="pt-3 border-t border-border/50 flex items-center gap-2 cursor-pointer group/author" onClick={() => onViewProfile(post.authorId)}>
          <div className="w-6 h-6 rounded-full bg-bg-soft border border-border flex items-center justify-center text-[8px] font-black uppercase group-hover/author:ring-2 ring-accent transition-all text-ink">
            {post.authorName.charAt(0)}
          </div>
          <span className="text-[10px] font-black text-ink-muted group-hover/author:text-accent transition-colors truncate">{post.authorName}</span>
        </div>

        <div className="pt-2 flex items-center justify-between text-[10px] font-bold text-ink-muted uppercase tracking-widest">
          <span className="flex items-center gap-1.5"><Calendar className="w-3 h-3" /> {format(post.createdAt.toDate(), 'MMM d')}</span>
          <span onClick={() => onSelectPost(post.slug)} className="text-ink font-black group-hover:text-accent transition-colors cursor-pointer">Read <ArrowRight className="inline w-3 h-3 ml-1 group-hover:translate-x-0.5 transition-transform" /></span>
        </div>
      </div>
    </motion.article>
  );
});

PostItem.displayName = 'PostItem';

export default function BlogList({ 
  posts, 
  onSelectPost, 
  onViewProfile,
  onLoadMore,
  hasMore,
  loadingMore,
  loading
}: BlogListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [activeType, setActiveType] = useState<'all' | 'blog' | 'trade'>('all');

  // Debouncing search for performance under load
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const filteredPosts = useMemo(() => {
    return posts.filter(post => {
      const matchesSearch = post.title.toLowerCase().includes(debouncedSearch.toLowerCase()) || 
                           post.excerpt.toLowerCase().includes(debouncedSearch.toLowerCase());
      const matchesCategory = activeCategory === 'All' || post.category === activeCategory;
      const matchesType = activeType === 'all' || post.type === activeType;
      return matchesSearch && matchesCategory && matchesType;
    });
  }, [posts, debouncedSearch, activeCategory, activeType]);

  const featuredPost = useMemo(() => posts[0], [posts]);
  
  const regularPosts = useMemo(() => {
    return filteredPosts.filter(p => !debouncedSearch && activeCategory === 'All' ? p.id !== featuredPost?.id : true);
  }, [filteredPosts, debouncedSearch, activeCategory, featuredPost]);

  if (loading && posts.length === 0) {
    return (
      <div id="blog-listing" className="space-y-6 md:space-y-12">
        <section className="text-center space-y-2 md:space-y-4 max-w-3xl mx-auto py-2 md:py-8">
          <h1 className="text-3xl sm:text-5xl md:text-6xl font-black tracking-tight text-ink uppercase">
            Global<span className="text-accent underline decoration-accent/10 underline-offset-4 md:underline-offset-6">Trade</span>
          </h1>
          <p className="text-sm md:text-lg text-ink-muted font-medium leading-relaxed italic px-4">
            Constructing intelligence networks...
          </p>
        </section>

        <FeaturedBlogSkeleton />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-8">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <BlogCardSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div id="blog-listing" className="space-y-6 md:space-y-12">
      {/* Hero Section */}
      <section className="text-center space-y-2 md:space-y-4 max-w-3xl mx-auto py-2 md:py-8">
        <h1 className="text-3xl sm:text-5xl md:text-6xl font-black tracking-tight text-ink uppercase">
          Global<span className="text-accent underline decoration-accent/10 underline-offset-4 md:underline-offset-6">Trade</span>
        </h1>
        <p className="text-sm md:text-lg text-ink-muted font-medium leading-relaxed italic px-4">
          The premium global intelligence network for technical exchange, industrial narratives, and engineering insights.
        </p>
      </section>

      {/* Search and Filters */}
      <div className="space-y-4">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative w-full md:max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-muted" />
            <input 
              type="text"
              placeholder="Search technical entries, trade dispatches, and engineering narratives..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-11 pr-4 py-2.5 bg-bg-soft border border-border rounded-xl text-sm font-medium focus:outline-none focus:border-accent transition-all text-ink placeholder:text-ink-muted/50"
            />
          </div>
          <div className="flex gap-1 p-1 bg-bg-soft rounded-xl border border-border">
            {(['all', 'blog', 'trade'] as const).map(type => (
              <button 
                key={type}
                onClick={() => setActiveType(type)}
                className={`px-5 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${activeType === type ? 'bg-card text-accent shadow-sm border border-border' : 'text-ink-muted'}`}
              >
                {type}s
              </button>
            ))}
          </div>
        </div>
        
        <div className="flex gap-1.5 overflow-x-auto w-full px-4 md:px-0 no-scrollbar justify-start md:justify-center">
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`whitespace-nowrap px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeCategory === cat 
                  ? 'bg-accent text-slate-950 shadow-md shadow-accent/20' 
                  : 'bg-bg-soft text-ink-muted border border-border hover:border-accent'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Featured Section (Only when no search/filter) */}
      {!debouncedSearch && activeCategory === 'All' && featuredPost && (
        <motion.section 
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="premium-card overflow-hidden group"
        >
          <div className="grid md:grid-cols-2 md:h-[400px] lg:h-[450px]">
            <div className="md:h-full cursor-pointer" onClick={() => onSelectPost(featuredPost.slug)}>
              <OptimizedImage 
                src={featuredPost.coverImage || `https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&q=80&w=2000`} 
                alt={featuredPost.title}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                aspectRatio="aspect-[16/9] md:aspect-auto md:h-full"
              />
            </div>
            <div className="p-6 md:p-8 lg:p-12 flex flex-col justify-center space-y-3 md:space-y-6 overflow-hidden">
              <div className="flex gap-3 items-center">
                <span className="badge badge-primary scale-90 md:scale-100 origin-left">{featuredPost.category || 'Engineering'}</span>
                <span className="text-[10px] font-bold text-ink-muted uppercase tracking-widest flex items-center gap-1">
                  <Clock className="w-3 h-3" /> {calculateReadingTime(featuredPost.content)} min read
                </span>
              </div>
              <h2 onClick={() => onSelectPost(featuredPost.slug)} className="text-xl md:text-3xl lg:text-4xl font-black leading-tight text-ink group-hover:text-accent transition-colors line-clamp-2 cursor-pointer">
                {featuredPost.title}
              </h2>
              <p className="text-sm lg:text-base text-ink-muted leading-relaxed line-clamp-2 md:line-clamp-3 italic">
                {featuredPost.excerpt || (featuredPost.content.replace(/[#*`]/g, '').slice(0, 150) + '...')}
              </p>
              <div className="pt-2 md:pt-4 flex items-center justify-between gap-2">
                <div 
                  className="flex items-center gap-2 md:gap-3 min-w-0 cursor-pointer group/author"
                  onClick={() => onViewProfile(featuredPost.authorId)}
                >
                  <div className="w-8 h-8 rounded-full bg-bg-soft border border-border flex items-center justify-center text-[10px] font-black uppercase shrink-0 group-hover/author:ring-2 ring-accent transition-all text-ink">
                    {featuredPost.authorName.charAt(0)}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold truncate group-hover/author:text-accent transition-colors text-ink">{featuredPost.authorName}</p>
                    <p className="text-[10px] font-medium text-ink-muted">{format(featuredPost.createdAt.toDate(), 'MMM d, yyyy')}</p>
                  </div>
                </div>
                <div onClick={() => onSelectPost(featuredPost.slug)} className="flex items-center gap-1.5 md:gap-2 text-accent font-black text-[10px] md:text-sm uppercase tracking-widest whitespace-nowrap shrink-0 cursor-pointer">
                  <span className="hidden sm:inline">View Entry</span> <ArrowRight className="w-3.5 h-3.5 md:w-4 md:h-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </div>
          </div>
        </motion.section>
      )}

      {/* Posts Grid */}
      <div id="posts-grid" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-8">
        {filteredPosts.length > 0 ? (
          (debouncedSearch || activeCategory !== 'All' ? filteredPosts : regularPosts).map((post, idx) => (
            <PostItem 
              key={post.id}
              post={post}
              idx={idx}
              onSelectPost={onSelectPost}
              onViewProfile={onViewProfile}
              calculateReadingTime={calculateReadingTime}
            />
          ))
        ) : (
          <div className="col-span-full py-20 text-center space-y-4 bg-bg-soft rounded-3xl border-2 border-dashed border-border">
            <BookOpen className="w-12 h-12 text-border mx-auto" />
            <h3 className="text-xl font-bold text-ink-muted">No intelligence matching your parameters.</h3>
            <button 
              onClick={() => { setSearchTerm(''); setActiveCategory('All'); }}
              className="text-accent font-bold text-sm hover:underline"
            >
              Reset exploration
            </button>
          </div>
        )}
      </div>

      {/* Load More Button */}
      {hasMore && !debouncedSearch && activeCategory === 'All' && (
        <div className="flex justify-center pt-8">
          <button 
            onClick={onLoadMore}
            disabled={loadingMore}
            className="px-8 py-3 bg-bg-soft border border-border rounded-2xl text-sm font-bold text-ink-muted hover:border-accent hover:text-accent transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {loadingMore ? (
              <>
                <div className="w-4 h-4 border-2 border-border border-t-accent rounded-full animate-spin" />
                Processing Dispatches...
              </>
            ) : (
              'Load More Artifacts'
            )}
          </button>
        </div>
      )}
    </div>
  );
}
