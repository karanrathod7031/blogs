import { useState } from 'react';
import { motion } from 'motion/react';
import { Search, Clock, Calendar, ArrowRight, BookOpen } from 'lucide-react';
import { BlogPost } from '../types';
import { format } from 'date-fns';

interface BlogListProps {
  posts: BlogPost[];
  onSelectPost: (slug: string) => void;
}

const CATEGORIES = ['All', 'AI', 'Web Dev', 'Projects', 'Career'];

export default function BlogList({ posts, onSelectPost }: BlogListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');

  const filteredPosts = posts.filter(post => {
    const matchesSearch = post.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         post.excerpt.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = activeCategory === 'All' || post.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  const featuredPost = posts[0];
  const regularPosts = filteredPosts.filter(p => !searchTerm && activeCategory === 'All' ? p.id !== featuredPost?.id : true);

  const calculateReadingTime = (content: string) => {
    const wordsPerMinute = 200;
    const words = content.trim().split(/\s+/).length;
    return Math.ceil(words / wordsPerMinute);
  };

  return (
    <div className="space-y-10 md:space-y-16">
      {/* Hero Section */}
      <section className="text-center space-y-4 md:space-y-6 max-w-3xl mx-auto py-6 md:py-12">
        <h1 className="text-3xl sm:text-5xl md:text-7xl font-black tracking-tight text-ink">
          Technical<span className="text-accent underline decoration-accent/10 underline-offset-4 md:underline-offset-8">Feed</span>
        </h1>
        <p className="text-sm md:text-xl text-ink-muted font-medium leading-relaxed italic px-4">
          Curated dispatches on web architecture, engineering leadership, and digital craft.
        </p>
      </section>

      {/* Search and Filters */}
      <div className="flex flex-col md:flex-row gap-6 items-center justify-between">
        <div className="relative w-full md:max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input 
            type="text"
            placeholder="Search artifacts..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-2 w-full md:w-auto px-1 no-scrollbar">
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`whitespace-nowrap px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeCategory === cat 
                  ? 'bg-ink text-white shadow-lg' 
                  : 'bg-white text-slate-500 border border-slate-200 hover:border-accent hover:text-accent'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Featured Section (Only when no search/filter) */}
      {!searchTerm && activeCategory === 'All' && featuredPost && (
        <motion.section 
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="premium-card overflow-hidden group cursor-pointer"
          onClick={() => onSelectPost(featuredPost.slug)}
        >
          <div className="grid md:grid-cols-2 md:h-[400px] lg:h-[450px]">
            <div className="aspect-[16/9] md:aspect-auto md:h-full overflow-hidden bg-slate-100">
              <img 
                src={featuredPost.coverImage || `https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&q=80&w=2000`} 
                alt={featuredPost.title}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
            </div>
            <div className="p-6 md:p-8 lg:p-12 flex flex-col justify-center space-y-4 md:space-y-6 overflow-hidden">
              <div className="flex gap-3 items-center">
                <span className="badge badge-primary scale-90 md:scale-100 origin-left">{featuredPost.category || 'Engineering'}</span>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
                  <Clock className="w-3 h-3" /> {calculateReadingTime(featuredPost.content)} min read
                </span>
              </div>
              <h2 className="text-2xl md:text-3xl lg:text-4xl font-black leading-tight group-hover:text-accent transition-colors line-clamp-2">
                {featuredPost.title}
              </h2>
              <p className="text-sm lg:text-base text-ink-muted leading-relaxed line-clamp-2 md:line-clamp-3">
                {featuredPost.excerpt}
              </p>
              <div className="pt-2 md:pt-4 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 md:gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-black uppercase shrink-0">
                    {featuredPost.authorName.charAt(0)}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold truncate">{featuredPost.authorName}</p>
                    <p className="text-[10px] font-medium text-slate-400">{format(featuredPost.createdAt.toDate(), 'MMM d, yyyy')}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 md:gap-2 text-accent font-black text-[10px] md:text-sm uppercase tracking-widest whitespace-nowrap shrink-0">
                  <span className="hidden sm:inline">View Entry</span> <ArrowRight className="w-3.5 h-3.5 md:w-4 md:h-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </div>
          </div>
        </motion.section>
      )}

      {/* Posts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
        {filteredPosts.length > 0 ? (
          (searchTerm || activeCategory !== 'All' ? filteredPosts : regularPosts).map((post, idx) => (
            <motion.article
              key={post.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              className="premium-card overflow-hidden group cursor-pointer flex flex-col"
              onClick={() => onSelectPost(post.slug)}
            >
              <div className="aspect-[16/10] overflow-hidden bg-slate-100">
                <img 
                  src={post.coverImage || `https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&q=80&w=800`} 
                  alt={post.title}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
              </div>
              <div className="p-4 md:p-6 space-y-3 md:space-y-4 flex flex-col flex-grow">
                <div className="flex items-center justify-between">
                  <span className="badge badge-primary scale-90 md:scale-100 origin-left">{post.category || 'Dev'}</span>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                    <Clock className="w-3 h-3" /> {calculateReadingTime(post.content)}m
                  </span>
                </div>
                <h3 className="text-lg md:text-xl font-bold leading-tight group-hover:text-accent transition-colors line-clamp-2">
                  {post.title}
                </h3>
                <p className="text-xs md:text-sm text-ink-muted leading-relaxed line-clamp-2 flex-grow">
                  {post.excerpt}
                </p>
                <div className="pt-3 md:pt-4 border-t border-slate-100 flex items-center justify-between text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  <span className="flex items-center gap-1.5"><Calendar className="w-3 h-3" /> {format(post.createdAt.toDate(), 'MMM d')}</span>
                  <span className="text-ink group-hover:text-accent transition-colors">Read <ArrowRight className="inline w-3 h-3 ml-1 group-hover:translate-x-0.5 transition-transform" /></span>
                </div>
              </div>
            </motion.article>
          ))
        ) : (
          <div className="col-span-full py-20 text-center space-y-4 bg-white rounded-3xl border-2 border-dashed border-slate-200">
            <BookOpen className="w-12 h-12 text-slate-200 mx-auto" />
            <h3 className="text-xl font-bold text-ink-muted">No artifacts matching your criteria.</h3>
            <button 
              onClick={() => { setSearchTerm(''); setActiveCategory('All'); }}
              className="text-accent font-bold text-sm hover:underline"
            >
              Reset exploration
            </button>
          </div>
        )}
      </div>

      {/* Load More Mockup */}
      {filteredPosts.length > 5 && (
        <div className="flex justify-center pt-8">
          <button className="px-8 py-3 bg-white border border-slate-200 rounded-2xl text-sm font-bold text-ink hover:border-accent hover:text-accent transition-all shadow-sm">
            Load More Artifacts
          </button>
        </div>
      )}
    </div>
  );
}
