import ReactMarkdown from 'react-markdown';
import { motion } from 'motion/react';
import { ArrowLeft, Share2, Calendar, Clock, Share, Twitter, Globe, Facebook, Link as LinkIcon, BookOpen, ArrowRight } from 'lucide-react';
import { BlogPost, UserProfile } from '../types';
import { format } from 'date-fns';
import { useState, useEffect } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';

interface BlogPostProps {
  post: BlogPost;
  onBack: () => void;
  allPosts?: BlogPost[];
}

export default function BlogPostView({ post, onBack, allPosts = [] }: BlogPostProps) {
  const [copied, setCopied] = useState(false);
  const [authorProfile, setAuthorProfile] = useState<UserProfile | null>(null);

  useEffect(() => {
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
    fetchAuthorProfile();
    window.scrollTo(0, 0);
  }, [post.authorId, post.id]);

  const calculateReadingTime = (content: string) => {
    const wordsPerMinute = 200;
    const words = content.trim().split(/\s+/).length;
    return Math.ceil(words / wordsPerMinute);
  };

  const relatedPosts = allPosts
    .filter(p => p.id !== post.id && (p.category === post.category || p.tags.some(t => post.tags.includes(t))))
    .slice(0, 3);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Simple TOC extractor mockup
  const toc = post.content.match(/^#+\s+.+$/gm)?.map(h => ({
    text: h.replace(/^#+\s+/, ''),
    level: h.match(/^#+/)?.[0].length || 1
  })) || [];

  return (
    <div className="relative">
      <div className="mb-8">
        <button 
          onClick={onBack}
          className="group flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-accent transition-colors"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          Back to blog
        </button>
      </div>

      <article className="grid lg:grid-cols-[1fr_280px] gap-8 md:gap-16">
        <div className="space-y-8 md:space-y-12">
          {/* Header */}
          <header className="space-y-5 md:space-y-8">
            <div className="space-y-3 md:space-y-4">
              <span className="badge badge-primary scale-90 md:scale-100 origin-left">{post.category || 'Article'}</span>
              <h1 className="text-2xl sm:text-4xl md:text-6xl font-black leading-tight tracking-tight text-ink">
                {post.title}
              </h1>
              <p className="text-base md:text-xl text-ink-muted leading-relaxed font-medium">
                {post.excerpt}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-4 md:gap-6 py-4 md:py-6 border-y border-slate-100">
              <div className="flex items-center gap-2 md:gap-3">
                {authorProfile?.photoURL ? (
                  <img src={authorProfile.photoURL} alt="" className="w-8 h-8 md:w-10 md:h-10 rounded-full border border-slate-200" />
                ) : (
                  <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-slate-100 flex items-center justify-center font-bold text-[10px] md:text-xs text-slate-400">
                    {post.authorName.charAt(0)}
                  </div>
                )}
                <div>
                  <p className="text-xs md:text-sm font-bold text-ink">{post.authorName}</p>
                  <p className="text-[8px] md:text-[10px] uppercase font-bold text-slate-400 tracking-wider">Author</p>
                </div>
              </div>
              <div className="h-6 md:h-8 w-px bg-slate-100" />
              <div className="flex items-center gap-4 md:gap-6 text-[9px] md:text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                <span className="flex items-center gap-1 md:gap-1.5"><Calendar className="w-3.5 h-3.5 md:w-4 md:h-4" /> {format(post.createdAt.toDate(), 'MMM d, yyyy')}</span>
                <span className="flex items-center gap-1 md:gap-1.5"><Clock className="w-3.5 h-3.5 md:w-4 md:h-4" /> {calculateReadingTime(post.content)}m</span>
              </div>
            </div>
          </header>

          {/* Cover Image */}
          {post.coverImage && (
            <div className="rounded-2xl md:rounded-3xl overflow-hidden aspect-video shadow-premium">
              <img src={post.coverImage} alt="" className="w-full h-full object-cover" />
            </div>
          )}

          {/* Body */}
          <div className="prose prose-sm md:prose-xl max-w-none prose-headings:text-ink prose-headings:font-black prose-p:text-slate-600 prose-p:leading-relaxed prose-a:text-accent prose-blockquote:border-l-accent prose-blockquote:bg-slate-50 prose-blockquote:rounded-r-2xl prose-img:rounded-2xl md:prose-img:rounded-3xl">
            <ReactMarkdown>{post.content}</ReactMarkdown>
          </div>

          {/* Bottom Tags */}
          <div className="flex flex-wrap gap-2 pt-12 border-t border-slate-100">
            {post.tags.map(tag => (
              <span key={tag} className="px-4 py-1.5 bg-slate-50 text-slate-500 rounded-lg text-xs font-bold border border-slate-100">
                #{tag}
              </span>
            ))}
          </div>
        </div>

        {/* Sidebar */}
        <aside className="hidden lg:block space-y-12 sticky top-32 h-fit">
          {/* TOC */}
          {toc.length > 0 && (
            <div className="space-y-4">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">On this page</h4>
              <nav className="flex flex-col gap-3">
                {toc.map((item, i) => (
                  <a 
                    key={i} 
                    href="#" 
                    onClick={(e) => e.preventDefault()}
                    className={`text-sm font-semibold transition-colors hover:text-accent ${item.level > 1 ? 'pl-4 text-slate-400 text-xs' : 'text-slate-600'}`}
                  >
                    {item.text}
                  </a>
                ))}
              </nav>
            </div>
          )}

          {/* Share */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Share post</h4>
            <div className="flex gap-2">
              <button className="p-2.5 rounded-xl bg-white border border-slate-200 hover:border-accent hover:text-accent transition-all"><Twitter className="w-4 h-4" /></button>
              <button className="p-2.5 rounded-xl bg-white border border-slate-200 hover:border-accent hover:text-accent transition-all"><Facebook className="w-4 h-4" /></button>
              <button 
                onClick={handleCopyLink} 
                className={`p-2.5 rounded-xl border transition-all ${copied ? 'bg-emerald-50 border-emerald-200 text-emerald-600' : 'bg-white border-slate-200 hover:border-accent hover:text-accent'}`}
              >
                <LinkIcon className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Author mini */}
          <div className="p-6 bg-slate-50/50 rounded-2xl border border-slate-100 space-y-4">
            <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">About author</h4>
            <p className="text-xs leading-relaxed text-slate-500 font-medium italic">
              {authorProfile?.bio || "Architect of digital experiences and curator of technical narratives."}
            </p>
          </div>
        </aside>
      </article>

      {/* Related Posts */}
      {relatedPosts.length > 0 && (
        <section className="bg-white border-t border-slate-100 mt-24 py-24 -mx-6 md:-mx-10 px-6 md:px-10">
          <div className="max-w-7xl mx-auto space-y-12">
            <div className="flex justify-between items-end">
              <div className="space-y-4">
                <h2 className="text-3xl font-black tracking-tight text-ink">Related Reading</h2>
                <p className="text-ink-muted font-medium">Continue your exploration through similar topics.</p>
              </div>
              <button 
                onClick={onBack} 
                className="hidden md:flex items-center gap-2 text-sm font-bold text-accent hover:opacity-80"
              >
                View all feed <ArrowRight className="w-4 h-4" />
              </button>
            </div>
            <div className="grid md:grid-cols-3 gap-8">
              {relatedPosts.map(p => (
                <article 
                  key={p.id} 
                  className="group cursor-pointer space-y-4" 
                  onClick={() => { window.scrollTo(0,0); onBack(); }}
                >
                  <div className="aspect-video rounded-2xl overflow-hidden bg-slate-100 border border-slate-200 shadow-sm transition-all group-hover:shadow-md">
                    <img 
                      src={p.coverImage || `https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&q=80&w=800`} 
                      alt="" 
                      className="w-full h-full object-cover transition-transform group-hover:scale-105" 
                    />
                  </div>
                  <div className="space-y-2">
                    <span className="badge badge-primary">{p.category || 'Article'}</span>
                    <h3 className="font-bold text-lg leading-tight group-hover:text-accent transition-colors line-clamp-2">{p.title}</h3>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
