import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Save, Eye, Edit3, Sparkles, X, Trash2, Image as ImageIcon, Tags, Layout, Globe } from 'lucide-react';
import { BlogPost } from '../types';
import ReactMarkdown from 'react-markdown';
import { GoogleGenAI } from "@google/genai";

interface BlogEditorProps {
  post?: BlogPost;
  onSave: (data: Partial<BlogPost>) => Promise<void>;
  onCancel: () => void;
  onDelete?: (id: string) => Promise<void>;
}

const CATEGORIES = ['AI', 'Web Dev', 'Projects', 'Career', 'Engineering', 'Design'];

export default function BlogEditor({ post, onSave, onCancel, onDelete }: BlogEditorProps) {
  const [title, setTitle] = useState(post?.title || '');
  const [slug, setSlug] = useState(post?.slug || '');
  const [excerpt, setExcerpt] = useState(post?.excerpt || '');
  const [content, setContent] = useState(post?.content || '');
  const [published, setPublished] = useState(post?.published || false);
  const [tags, setTags] = useState<string[]>(post?.tags || []);
  const [newTag, setNewTag] = useState('');
  const [category, setCategory] = useState(post?.category || 'Engineering');
  const [coverImage, setCoverImage] = useState(post?.coverImage || '');
  
  const [preview, setPreview] = useState(false);
  const [saving, setSaving] = useState(false);
  const [summarizing, setSummarizing] = useState(false);

  useEffect(() => {
    if (!post && title) {
      setSlug(title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''));
    }
  }, [title, post]);

  const handleSummarize = async () => {
    if (!content) return;
    setSummarizing(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Create a brief, compelling 1-2 sentence excerpt for this blog post. Body: ${content}`,
      });
      const text = response.text;
      if (text) {
        setExcerpt(text.trim());
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSummarizing(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await onSave({
        title,
        slug,
        excerpt,
        content,
        published,
        tags,
        category,
        coverImage
      });
    } finally {
      setSaving(false);
    }
  };

  const toggleTag = (tag: string) => {
    setTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]);
  };

  const handleAddTag = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && newTag.trim()) {
      e.preventDefault();
      if (!tags.includes(newTag.trim())) {
        setTags([...tags, newTag.trim()]);
      }
      setNewTag('');
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 md:space-y-12">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 md:gap-6 py-4 md:py-6 border-b border-slate-100 transition-all">
        <div className="space-y-0.5 md:space-y-1">
          <h2 className="text-2xl md:text-3xl font-black tracking-tighter text-ink">{post ? 'Edit Post' : 'New Entry'}</h2>
          <p className="text-slate-500 font-bold text-[10px] md:text-sm flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-accent" />
            Engineering narratives for the modern web.
          </p>
        </div>
        <div className="flex items-center gap-2 md:gap-4 w-full md:w-auto">
          <button 
            onClick={() => setPreview(!preview)}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 md:px-6 py-2.5 md:py-3 bg-white border-2 border-slate-100 rounded-xl md:rounded-2xl text-[10px] md:text-xs font-black uppercase tracking-widest hover:border-accent hover:text-accent transition-all shadow-clean active:scale-95"
          >
            {preview ? <Edit3 className="w-3.5 h-3.5 md:w-4 md:h-4" /> : <Eye className="w-3.5 h-3.5 md:w-4 md:h-4" />}
            {preview ? 'Edit' : 'Review'}
          </button>
          <button 
            onClick={onCancel}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 md:px-6 py-2.5 md:py-3 bg-white border-2 border-slate-100 rounded-xl md:rounded-2xl text-[10px] md:text-xs font-black uppercase tracking-widest text-slate-400 hover:text-rose-500 hover:border-rose-100 transition-all active:scale-95"
          >
            <X className="w-3.5 h-3.5 md:w-4 md:h-4" />
            Cancel
          </button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {preview ? (
          <motion.div 
            key="preview"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="premium-card p-6 md:p-12 bg-white"
          >
          <article className="max-w-3xl mx-auto">
             <header className="space-y-6 md:space-y-8 mb-6 md:mb-12">
               <div className="flex items-center gap-3 md:gap-4">
                 <span className="badge badge-primary scale-90 md:scale-100 origin-left">{category}</span>
                 <span className="text-[9px] md:text-[10px] font-black text-slate-300 uppercase tracking-widest">Draft Artifact</span>
               </div>
               <h1 className="text-2xl sm:text-5xl md:text-7xl font-black leading-tight tracking-tighter text-ink">
                 {title || 'Untitled Post'}
               </h1>
               {excerpt && (
                 <p className="text-sm md:text-2xl leading-relaxed text-slate-500 font-medium border-l-4 border-accent/20 pl-4 md:pl-8 italic">
                   {excerpt}
                 </p>
               )}
             </header>

             {coverImage && (
               <div className="aspect-[21/9] rounded-[1rem] md:rounded-[2.5rem] overflow-hidden mb-6 md:mb-16 shadow-premium border-2 md:border-4 border-white">
                 <img src={coverImage} alt="" className="w-full h-full object-cover" />
               </div>
             )}

             <div className="prose prose-slate prose-sm md:prose-lg max-w-none prose-headings:font-black prose-headings:tracking-tight prose-a:text-accent font-medium leading-relaxed">
               <ReactMarkdown>{content || '*The canvas is currently empty. Switch back to Edit Mode to begin.*'}</ReactMarkdown>
             </div>
          </article>
          </motion.div>
        ) : (
          <motion.div 
            key="form"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
          >
            <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-8 md:gap-12 items-start">
              <div className="space-y-8 md:space-y-12">
                <div className="premium-card p-6 md:p-10 space-y-8 md:space-y-10 group">
                  <div className="space-y-4 md:space-y-6">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] flex items-center gap-2 ml-1">
                      <Layout className="w-3.5 h-3.5 md:w-4 md:h-4 text-accent" /> Artifact Identity
                    </label>
                    <input 
                      value={title}
                      onChange={e => setTitle(e.target.value)}
                      placeholder="The Future of Distributed Systems..."
                      className="w-full bg-transparent text-2xl sm:text-3xl md:text-5xl font-black text-ink focus:outline-none border-b-2 border-slate-100 focus:border-accent pb-4 md:pb-8 transition-all placeholder:text-slate-200"
                      required
                    />
                  </div>

                  <div className="space-y-4 md:space-y-6">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] flex items-center gap-2 ml-1">
                      <Edit3 className="w-3.5 h-3.5 md:w-4 md:h-4 text-accent" /> Narrative Architecture (Markdown)
                    </label>
                    <textarea 
                      value={content}
                      onChange={e => setContent(e.target.value)}
                      placeholder="Begin your inquiry into the codebase..."
                      className="w-full bg-slate-50/30 rounded-[1.25rem] md:rounded-[2.5rem] border-2 border-slate-200/50 p-5 md:p-10 min-h-[400px] md:min-h-[700px] font-sans text-base md:text-xl leading-relaxed focus:outline-none focus:ring-4 md:ring-8 focus:ring-accent/5 focus:border-accent focus:bg-white transition-all shadow-sm placeholder:text-slate-300"
                      required
                    />
                  </div>
                </div>
              </div>

              <aside className="space-y-6 md:space-y-8 h-fit">
                <div className="premium-card p-6 md:p-8 space-y-8 md:space-y-10 focus-within:border-accent/40 transition-all">
                  <div className="space-y-6">
                    <h4 className="text-[10px] md:text-[11px] font-black text-ink uppercase tracking-widest flex items-center gap-2 pb-3 md:pb-4 border-b border-slate-100">
                      System Configuration
                    </h4>
                    
                    {/* Cover Image Input */}
                    <div className="space-y-3">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 ml-1">
                        <ImageIcon className="w-3.5 h-3.5 text-accent/60" /> Visual Link
                      </label>
                      <input 
                        value={coverImage}
                        onChange={e => setCoverImage(e.target.value)}
                        placeholder="https://images.unsplash.com/..."
                        className="w-full bg-slate-50/50 border-2 border-slate-100 rounded-[1.25rem] px-5 py-4 text-sm font-bold text-ink focus:ring-4 focus:ring-accent/5 focus:border-accent outline-none transition-all placeholder:text-slate-400/30"
                      />
                    </div>

                    {/* Category Select */}
                    <div className="space-y-3">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 ml-1">
                        <Layout className="w-3.5 h-3.5 text-accent/60" /> Taxonomy
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        {CATEGORIES.map(cat => (
                          <button 
                            key={cat}
                            type="button"
                            onClick={() => setCategory(cat)}
                            className={`px-3 py-3 rounded-xl text-[10px] font-black transition-all border-2 ${category === cat ? 'bg-accent text-white border-accent shadow-lg shadow-accent/20' : 'bg-white text-slate-400 border-slate-100 hover:border-slate-300'}`}
                          >
                            {cat}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Slug Input */}
                    <div className="space-y-3">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 ml-1">
                        <Globe className="w-3.5 h-3.5 text-accent/60" /> Permalink
                      </label>
                      <div className="flex items-center gap-2 text-sm font-mono bg-slate-50/50 px-5 py-4 rounded-[1.25rem] border-2 border-slate-100 group focus-within:border-accent transition-all">
                        <span className="text-slate-400 font-bold">/</span>
                        <input 
                          value={slug}
                          onChange={e => setSlug(e.target.value)}
                          className="flex-1 bg-transparent focus:outline-none font-bold text-ink"
                          required
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-6 pt-6 border-t border-slate-100">
                    {/* Excerpt AI Assist */}
                    <div className="space-y-3">
                      <div className="flex justify-between items-center ml-1">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Metadata Segment</label>
                        <button 
                          type="button"
                          onClick={handleSummarize}
                          disabled={summarizing || !content}
                          className="flex items-center gap-1.5 text-[10px] font-black text-accent hover:opacity-80 disabled:opacity-30 uppercase tracking-[0.1em]"
                        >
                          <Sparkles className="w-3.5 h-3.5" />
                          {summarizing ? 'Neural Sync...' : 'AI Assist'}
                        </button>
                      </div>
                      <textarea 
                        value={excerpt}
                        onChange={e => setExcerpt(e.target.value)}
                        placeholder="Neural metadata brief..."
                        className="w-full bg-slate-50/50 rounded-[1.25rem] px-5 py-4 text-sm leading-relaxed font-bold text-ink focus:outline-none border-2 border-slate-100 focus:border-accent focus:bg-white transition-all min-h-[140px] placeholder:text-slate-400/30"
                      />
                    </div>

                    {/* Tags */}
                    <div className="space-y-3">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 ml-1">
                        <Tags className="w-3.5 h-3.5 text-accent/60" /> Linked Nodes
                      </label>
                      <div className="flex flex-wrap gap-2 mb-3">
                        {tags.map(tag => (
                          <span key={tag} className="px-4 py-2 bg-accent/5 text-accent rounded-full text-[10px] font-black flex items-center gap-2 border border-accent/10 shadow-sm">
                            {tag}
                            <button onClick={() => toggleTag(tag)} className="hover:text-ink transition-colors"><X className="w-3.5 h-3.5" /></button>
                          </span>
                        ))}
                      </div>
                      <input 
                        value={newTag}
                        onChange={e => setNewTag(e.target.value)}
                        onKeyDown={handleAddTag}
                        placeholder="Node ID + Enter"
                        className="w-full bg-slate-50/50 border-2 border-slate-100 rounded-[1.25rem] px-5 py-4 text-sm font-bold text-ink focus:bg-white focus:border-accent outline-none transition-all placeholder:text-slate-400/30"
                      />
                    </div>
                  </div>

                  <div className="space-y-6 pt-6 border-t border-slate-100">
                    <label className="flex items-center justify-between cursor-pointer group px-1">
                      <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Broadcast Visibility</span>
                      <div 
                        onClick={() => setPublished(!published)}
                        className={`w-14 h-8 rounded-full p-1.5 transition-all ${published ? 'bg-accent shadow-lg shadow-accent/30' : 'bg-slate-200'}`}
                      >
                        <div className={`w-5 h-5 bg-white rounded-full shadow-md transition-transform ${published ? 'translate-x-6' : 'translate-x-0'}`} />
                      </div>
                    </label>

                    <button 
                      type="submit"
                      disabled={saving}
                      className="w-full bg-ink text-white py-6 rounded-2xl text-xs font-black uppercase tracking-[0.2em] flex items-center justify-center gap-3 hover:bg-accent hover:shadow-premium transition-all disabled:opacity-50 active:scale-95 mt-4"
                    >
                      <Save className="w-5 h-5" />
                      {saving ? 'Synchronizing...' : 'Commit Entry'}
                    </button>

                    {post && onDelete && (
                      <button 
                        type="button"
                        onClick={() => onDelete(post.id)}
                        className="w-full text-slate-400 py-2 text-[10px] font-black uppercase tracking-[0.25em] hover:text-rose-600 transition-colors flex items-center justify-center gap-2"
                      >
                        <Trash2 className="w-4 h-4" />
                        Relinquish Artifact
                      </button>
                    )}
                  </div>
                </div>
              </aside>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
