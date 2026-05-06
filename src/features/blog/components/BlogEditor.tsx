import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Eye, 
  Edit3, 
  X, 
  Image as ImageIcon, 
  Layout, 
  Globe,
  Bold, 
  Italic, 
  List, 
  Link as LinkIcon, 
  Upload, 
  ListOrdered, 
  Table as TableIcon, 
  AlignCenter, 
  AlignRight, 
  Code,
  Quote,
  Heading as HeadingIcon,
  Underline as UnderlineIcon,
  Strikethrough,
  ChevronDown
} from 'lucide-react';
import { BlogPost } from '../../../types';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import TurndownService from 'turndown';
// @ts-expect-error - turndown-plugin-gfm doesn't have types
import { gfm } from 'turndown-plugin-gfm';
import { useEditor, EditorContent } from '@tiptap/react';
import { StarterKit } from '@tiptap/starter-kit';
import { Markdown } from 'tiptap-markdown';
import { Placeholder } from '@tiptap/extension-placeholder';
import { Link as LinkExtension } from '@tiptap/extension-link';
import { Underline as UnderlineExtension } from '@tiptap/extension-underline';
import { Image as ImageExtension } from '@tiptap/extension-image';
import { Table as TiptapTable } from '@tiptap/extension-table';
import { TableRow as TiptapTableRow } from '@tiptap/extension-table-row';
import { TableHeader as TiptapTableHeader } from '@tiptap/extension-table-header';
import { TableCell as TiptapTableCell } from '@tiptap/extension-table-cell';
import { TextAlign } from '@tiptap/extension-text-align';
import { GoogleGenAI } from "@google/genai";

interface BlogEditorProps {
  post?: BlogPost;
  onSave: (data: Partial<BlogPost>) => Promise<void>;
  onCancel: () => void;
  onDelete?: (id: string) => Promise<void>;
  onNotify: (msg: string, type: 'success' | 'error') => void;
}

const CATEGORIES = ['AI', 'Agriculture', 'Finance', 'Web Dev', 'Projects', 'Career', 'Engineering', 'Social', 'Design', 'Commodities', 'Services', 'Healthcare', 'Logistics', 'Other'];

export default function BlogEditor({ post, onSave, onCancel, onDelete, onNotify }: BlogEditorProps) {
  const [title, setTitle] = useState(post?.title || '');
  const [slug, setSlug] = useState(post?.slug || '');
  const [excerpt, setExcerpt] = useState(post?.excerpt || '');
  const [content, setContent] = useState(post?.content || '');
  const [published, setPublished] = useState(post?.published || false);
  const [tags, setTags] = useState<string[]>(post?.tags || []);
  const [newTag, setNewTag] = useState('');
  const [category, setCategory] = useState(post?.category || 'Engineering');
  const [isSlugAuto, setIsSlugAuto] = useState(!post?.slug);
  const [customCategory, setCustomCategory] = useState(!CATEGORIES.includes(post?.category || 'Engineering') ? (post?.category || '') : '');
  const [coverImage, setCoverImage] = useState(post?.coverImage || '');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showHeadings, setShowHeadings] = useState(false);
  const headingDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (headingDropdownRef.current && !headingDropdownRef.current.contains(event.target as Node)) {
        setShowHeadings(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Basic pre-check: If raw file > 5MB, reject immediately
      if (file.size > 5 * 1024 * 1024) {
        onNotify("Image file is too large. Please select an image under 5MB.", 'error');
        return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;

          // Max dimensions for header image
          const MAX_WIDTH = 1200;
          const MAX_HEIGHT = 800;

          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);

          // Quality 0.7 usually keeps images well under 500KB even at 1200px
          const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
          
          // Safety check: Firestore limit is 1MB total. 
          // We aim for 700KB max for the image to leave room for text.
          if (dataUrl.length > 800000) {
             // If still too large, try a lower quality
             const compressedUrl = canvas.toDataURL('image/jpeg', 0.5);
             setCoverImage(compressedUrl);
          } else {
            setCoverImage(dataUrl);
          }
        };
        img.src = event.target?.result as string;
      };
      reader.readAsDataURL(file);
    }
  };

  const finalCategory = category === 'Other' ? customCategory : category;
  const [type, setType] = useState<'blog' | 'trade'>(post?.type || 'blog');
  const [tradeValue, setTradeValue] = useState(post?.tradeValue || '');
  const [tradeCategory, setTradeCategory] = useState(post?.tradeCategory || '');
  const [location, setLocation] = useState(post?.location || '');
  
  const [preview, setPreview] = useState(false);
  const [saving, setSaving] = useState(false);
  const [summarizing, setSummarizing] = useState(false);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3, 4, 5, 6],
        },
      }),
      Markdown,
      UnderlineExtension,
      LinkExtension.configure({
        openOnClick: false,
      }),
      Placeholder.configure({
        placeholder: 'Pasted from Word/Docs will preserve formatting! Start writing your story here...',
      }),
      ImageExtension,
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      TiptapTable.configure({
        resizable: true,
      }),
      TiptapTableRow,
      TiptapTableHeader,
      TiptapTableCell,
    ],
    content: content,
    onUpdate: ({ editor }) => {
      try {
        // @ts-expect-error - tiptap-markdown adds getMarkdown
        const md = editor.getMarkdown();
        setContent(md);
      } catch (err) {
        console.warn('tiptap-markdown failed, falling back to turndown:', err);
        const html = editor.getHTML();
        const turndownService = new TurndownService({
          headingStyle: 'atx',
          codeBlockStyle: 'fenced',
          bulletListMarker: '-'
        });
        // @ts-expect-error - gfm plugin types
        turndownService.use(gfm);
        const md = turndownService.turndown(html);
        setContent(md);
      }
    },
    editorProps: {
      attributes: {
        class: 'prose prose-sm md:prose-base max-w-none focus:outline-none min-h-[600px] p-6 md:p-8',
      },
    },
  });

  // Sync content if changed externally (e.g. initial load)
  useEffect(() => {
    if (editor && content !== editor.getHTML() && content !== editor.getText()) {
      // Basic check to see if we need to sync. 
      // If the editor is empty and we have content, we should set it.
      if (editor.isEmpty && content) {
        editor.commands.setContent(content);
      }
    }
  }, [content, editor]);

  const slugify = (text: string) => {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  };

  useEffect(() => {
    // Sync slug if auto-sync is on OR if we are on a new post and title is being typed
    if (isSlugAuto && title) {
      setSlug(slugify(title));
    }
  }, [title, isSlugAuto]);

  const handleSummarize = async () => {
    if (!content) return;
    setSummarizing(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Summarize the following blog post in exactly 1-2 sentences. Return ONLY the plain text summary. Do not include any labels, options, conversational filler, or markdown formatting like bold (**). Body: ${content}`,
      });
      const text = response.text;
      if (text) {
        // Clean up any remaining markdown bold markers just in case
        setExcerpt(text.trim().replace(/\*\*/g, ''));
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
      const data: Partial<BlogPost> = {
        title,
        slug,
        excerpt,
        content,
        published,
        tags,
        category: finalCategory || 'Uncategorized',
        coverImage,
        type,
      };

      if (type === 'trade') {
        data.tradeValue = tradeValue;
        data.tradeCategory = tradeCategory;
        data.location = location;
      }

      await onSave(data);
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
    <div className="max-w-7xl mx-auto space-y-4 md:space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 py-3 md:py-4 border-b border-border transition-all">
        <div className="space-y-0.5">
          <h2 className="text-xl md:text-2xl font-black tracking-tight text-ink">{post ? 'Edit Dispatch' : 'New Entry'}</h2>
          <p className="text-ink-muted font-bold text-[10px] md:text-xs flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-accent" />
            Direct contribution to the global network.
          </p>
        </div>
        <div className="flex items-center gap-2 w-full md:w-auto">
          <button 
            onClick={() => setPreview(!preview)}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-bg-soft border border-border rounded-xl text-[10px] font-black uppercase tracking-widest hover:border-accent transition-all active:scale-95 text-ink-muted"
          >
            {preview ? <Edit3 className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            {preview ? 'Edit' : 'Review'}
          </button>
          <button 
            onClick={onCancel}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-bg-soft border border-border rounded-xl text-[10px] font-black uppercase tracking-widest text-ink-muted hover:text-rose-500 transition-all active:scale-95"
          >
            <X className="w-3.5 h-3.5" />
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
            className="premium-card p-6 md:p-10 bg-card border border-border"
          >
          <article className="max-w-3xl mx-auto">
             <header className="space-y-4 mb-8">
               <div className="flex items-center gap-3">
                 <span className="badge badge-primary scale-90 md:scale-100 origin-left">{finalCategory || 'Uncategorized'}</span>
               </div>
               <h1 className="text-3xl md:text-5xl font-black leading-tight tracking-tight text-ink">
                 {title || 'Untitled Post'}
               </h1>
               {excerpt && (
                 <p className="text-sm md:text-lg leading-relaxed text-ink-muted font-medium">
                   {excerpt}
                 </p>
               )}
             </header>
 
             <div className="max-h-[70vh] overflow-y-auto scrollbar-thin pr-4 -mr-4">
               {coverImage && (
                 <div className="aspect-[21/9] rounded-2xl overflow-hidden mb-10 shadow-sm border border-border">
                   <img src={coverImage} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" loading="lazy" />
                 </div>
               )}

               <div className="prose prose-sm md:prose-lg max-w-none prose-headings:font-black prose-headings:text-ink prose-p:text-ink-muted prose-strong:text-ink prose-strong:font-black prose-a:text-accent prose-table:border prose-table:border-border prose-th:bg-bg-soft prose-th:px-4 prose-th:py-2 prose-td:border prose-td:border-border prose-td:px-4 prose-td:py-2">
                 <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]}>{content || '*The canvas is currently empty.*'}</ReactMarkdown>
               </div>
             </div>
          </article>
          </motion.div>
        ) : (
          <motion.div 
            key="form"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6 md:gap-8 items-start">
              <div className="space-y-6 md:space-y-8">
                <div className="premium-card p-5 md:p-8 space-y-6 md:space-y-8 bg-card border border-border">
                  <div className="space-y-2">
                    <label className="text-[9px] font-black text-ink-muted uppercase tracking-widest flex items-center gap-2 ml-1">
                      <Layout className="w-3 h-3 text-accent" /> Mode
                    </label>
                    <div className="flex gap-1 p-1 bg-bg rounded-xl w-fit border border-border">
                      <button 
                        type="button"
                        onClick={() => setType('blog')}
                        className={`px-4 py-1.5 rounded-lg text-[9px] font-black transition-all ${type === 'blog' ? 'bg-card text-accent shadow-sm border border-border' : 'text-ink-muted'}`}
                      >
                        Blog
                      </button>
                      <button 
                        type="button"
                        onClick={() => setType('trade')}
                        className={`px-4 py-1.5 rounded-lg text-[9px] font-black transition-all ${type === 'trade' ? 'bg-card text-accent shadow-sm border border-border' : 'text-ink-muted'}`}
                      >
                        Trade
                      </button>
                    </div>
                  </div>

                  {type === 'trade' && (
                    <motion.div 
                      key="trade-fields"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="grid grid-cols-1 md:grid-cols-3 gap-3 p-4 bg-bg-soft rounded-2xl border border-border"
                    >
                      <div className="space-y-1">
                        <label className="text-[9px] font-black text-accent uppercase tracking-widest ml-1">Category</label>
                        <input value={tradeCategory} onChange={e => setTradeCategory(e.target.value)} placeholder="Sector" className="w-full bg-bg border border-border rounded-lg px-3 py-2 text-xs font-bold outline-none text-ink focus:border-accent" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] font-black text-accent uppercase tracking-widest ml-1">Value</label>
                        <input value={tradeValue} onChange={e => setTradeValue(e.target.value)} placeholder="Volume" className="w-full bg-bg border border-border rounded-lg px-3 py-2 text-xs font-bold outline-none text-ink focus:border-accent" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] font-black text-accent uppercase tracking-widest ml-1">Location</label>
                        <input value={location} onChange={e => setLocation(e.target.value)} placeholder="Origin" className="w-full bg-bg border border-border rounded-lg px-3 py-2 text-xs font-bold outline-none text-ink focus:border-accent" />
                      </div>
                    </motion.div>
                  )}

                  <div className="space-y-2">
                    <input 
                      value={title}
                      onChange={e => setTitle(e.target.value)}
                      placeholder="Entry Title..."
                      className="w-full bg-transparent text-2xl md:text-4xl font-black text-ink focus:outline-none border-b border-border focus:border-accent pb-4 transition-all placeholder:text-ink-muted/30"
                      required
                    />
                  </div>

                  <div className="space-y-4">
                    <div className="flex flex-col space-y-4">
                      <div className="flex justify-between items-center">
                        <label className="text-[9px] font-black text-ink-muted uppercase tracking-widest flex items-center gap-2 ml-1">
                          <Edit3 className="w-3 h-3 text-accent" /> Discourse (Markdown supported)
                        </label>
                        <div className="flex flex-wrap gap-1 bg-bg p-1 rounded-xl border border-border shadow-sm">
                          {/* Typography Group */}
                          <div className="flex gap-0.5 pr-2 border-r border-border/50">
                            <button 
                              type="button" 
                              onClick={() => editor?.chain().focus().toggleBold().run()} 
                              className={`p-1.5 rounded-lg transition-colors ${editor?.isActive('bold') ? 'bg-accent text-slate-900' : 'hover:bg-bg-soft text-ink-muted hover:text-accent'}`}
                              title="Bold (Ctrl+B)"
                            >
                              <Bold className="w-3.5 h-3.5" />
                            </button>
                            <button 
                              type="button" 
                              onClick={() => editor?.chain().focus().toggleItalic().run()} 
                              className={`p-1.5 rounded-lg transition-colors ${editor?.isActive('italic') ? 'bg-accent text-slate-900' : 'hover:bg-bg-soft text-ink-muted hover:text-accent'}`}
                              title="Italic (Ctrl+I)"
                            >
                              <Italic className="w-3.5 h-3.5" />
                            </button>
                            <button 
                              type="button" 
                              onClick={() => editor?.chain().focus().toggleUnderline().run()} 
                              className={`p-1.5 rounded-lg transition-colors ${editor?.isActive('underline') ? 'bg-accent text-slate-900' : 'hover:bg-bg-soft text-ink-muted hover:text-accent'}`}
                              title="Underline (Ctrl+U)"
                            >
                              <UnderlineIcon className="w-3.5 h-3.5" />
                            </button>
                            <button 
                              type="button" 
                              onClick={() => editor?.chain().focus().toggleStrike().run()} 
                              className={`p-1.5 rounded-lg transition-colors ${editor?.isActive('strike') ? 'bg-accent text-slate-900' : 'hover:bg-bg-soft text-ink-muted hover:text-accent'}`}
                              title="Strikethrough"
                            >
                              <Strikethrough className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          {/* Headers Dropdown */}
                          <div ref={headingDropdownRef} className="relative flex items-center px-2 border-r border-border/50">
                            <button 
                              type="button" 
                              onClick={() => setShowHeadings(!showHeadings)}
                              className={`flex items-center gap-1 p-1.5 rounded-lg transition-colors ${showHeadings ? 'bg-bg-soft text-accent' : 'text-ink-muted hover:text-accent hover:bg-bg-soft'}`}
                              title="Headings"
                            >
                              <HeadingIcon className="w-3.5 h-3.5" />
                              <ChevronDown className={`w-2.5 h-2.5 transition-transform ${showHeadings ? 'rotate-180' : ''}`} />
                            </button>
                            {showHeadings && (
                              <div className="absolute top-full left-0 mt-1 z-50 bg-card border border-border rounded-xl shadow-xl p-1 min-w-[120px] animate-in fade-in zoom-in duration-100">
                                <button type="button" onClick={() => { editor?.chain().focus().toggleHeading({ level: 1 }).run(); setShowHeadings(false); }} className={`flex items-center gap-2 w-full px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${editor?.isActive('heading', { level: 1 }) ? 'bg-accent text-slate-900' : 'hover:bg-bg-soft text-ink'}`}>H1 <span className="text-[10px] opacity-50 font-normal ml-auto">Title</span></button>
                                <button type="button" onClick={() => { editor?.chain().focus().toggleHeading({ level: 2 }).run(); setShowHeadings(false); }} className={`flex items-center gap-2 w-full px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${editor?.isActive('heading', { level: 2 }) ? 'bg-accent text-slate-900' : 'hover:bg-bg-soft text-ink'}`}>H2 <span className="text-[10px] opacity-50 font-normal ml-auto">Section</span></button>
                                <button type="button" onClick={() => { editor?.chain().focus().toggleHeading({ level: 3 }).run(); setShowHeadings(false); }} className={`flex items-center gap-2 w-full px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${editor?.isActive('heading', { level: 3 }) ? 'bg-accent text-slate-900' : 'hover:bg-bg-soft text-ink'}`}>H3 <span className="text-[10px] opacity-50 font-normal ml-auto">Sub</span></button>
                                <button type="button" onClick={() => { editor?.chain().focus().toggleHeading({ level: 4 }).run(); setShowHeadings(false); }} className={`flex items-center gap-2 w-full px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${editor?.isActive('heading', { level: 4 }) ? 'bg-accent text-slate-900' : 'hover:bg-bg-soft text-ink'}`}>H4</button>
                                <button type="button" onClick={() => { editor?.chain().focus().toggleHeading({ level: 5 }).run(); setShowHeadings(false); }} className={`flex items-center gap-2 w-full px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${editor?.isActive('heading', { level: 5 }) ? 'bg-accent text-slate-900' : 'hover:bg-bg-soft text-ink'}`}>H5</button>
                                <button type="button" onClick={() => { editor?.chain().focus().toggleHeading({ level: 6 }).run(); setShowHeadings(false); }} className={`flex items-center gap-2 w-full px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${editor?.isActive('heading', { level: 6 }) ? 'bg-accent text-slate-900' : 'hover:bg-bg-soft text-ink'}`}>H6</button>
                              </div>
                            )}
                          </div>

                          {/* Lists Group */}
                          <div className="flex gap-0.5 px-2 border-r border-border/50">
                            <button 
                              type="button" 
                              onClick={() => editor?.chain().focus().toggleBulletList().run()} 
                              className={`p-1.5 rounded-lg transition-colors ${editor?.isActive('bulletList') ? 'bg-accent text-slate-900' : 'hover:bg-bg-soft text-ink-muted hover:text-accent'}`}
                              title="Bullet List"
                            >
                              <List className="w-3.5 h-3.5" />
                            </button>
                            <button 
                              type="button" 
                              onClick={() => editor?.chain().focus().toggleOrderedList().run()} 
                              className={`p-1.5 rounded-lg transition-colors ${editor?.isActive('orderedList') ? 'bg-accent text-slate-900' : 'hover:bg-bg-soft text-ink-muted hover:text-accent'}`}
                              title="Numbered List"
                            >
                              <ListOrdered className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          {/* Elements Group */}
                          <div className="flex gap-0.5 px-2 border-r border-border/50">
                            <button 
                              type="button" 
                              onClick={() => {
                                const url = window.prompt('URL');
                                if (url) editor?.chain().focus().setLink({ href: url }).run();
                              }} 
                              className={`p-1.5 rounded-lg transition-colors ${editor?.isActive('link') ? 'bg-accent text-slate-900' : 'hover:bg-bg-soft text-ink-muted hover:text-accent'}`}
                              title="Link (Ctrl+K)"
                            >
                              <LinkIcon className="w-3.5 h-3.5" />
                            </button>
                            <button 
                              type="button" 
                              onClick={() => {
                                const url = window.prompt('Image URL');
                                if (url) editor?.chain().focus().setImage({ src: url }).run();
                              }} 
                              className={`p-1.5 rounded-lg transition-colors ${editor?.isActive('image') ? 'bg-accent text-slate-900' : 'hover:bg-bg-soft text-ink-muted hover:text-accent'}`}
                              title="Insert Image"
                            >
                              <ImageIcon className="w-3.5 h-3.5" />
                            </button>
                            <button 
                              type="button" 
                              onClick={() => editor?.chain().focus().toggleCodeBlock().run()} 
                              className={`p-1.5 rounded-lg transition-colors ${editor?.isActive('codeBlock') ? 'bg-accent text-slate-900' : 'hover:bg-bg-soft text-ink-muted hover:text-accent'}`}
                              title="Code Block"
                            >
                              <Code className="w-3.5 h-3.5" />
                            </button>
                            <button 
                              type="button" 
                              onClick={() => editor?.chain().focus().toggleBlockquote().run()} 
                              className={`p-1.5 rounded-lg transition-colors ${editor?.isActive('blockquote') ? 'bg-accent text-slate-900' : 'hover:bg-bg-soft text-ink-muted hover:text-accent'}`}
                              title="Quote"
                            >
                              <Quote className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          {/* Alignment Group */}
                          <div className="flex gap-0.5 px-2 border-r border-border/50">
                            <button 
                              type="button" 
                              onClick={() => editor?.chain().focus().setTextAlign('center').run()} 
                              className={`p-1.5 rounded-lg transition-colors ${editor?.isActive({ textAlign: 'center' }) ? 'bg-accent text-slate-900' : 'hover:bg-bg-soft text-ink-muted hover:text-accent'}`}
                              title="Align Center"
                            >
                              <AlignCenter className="w-3.5 h-3.5" />
                            </button>
                            <button 
                              type="button" 
                              onClick={() => editor?.chain().focus().setTextAlign('right').run()} 
                              className={`p-1.5 rounded-lg transition-colors ${editor?.isActive({ textAlign: 'right' }) ? 'bg-accent text-slate-900' : 'hover:bg-bg-soft text-ink-muted hover:text-accent'}`}
                              title="Align Right"
                            >
                              <AlignRight className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          {/* Table Group */}
                          <div className="flex gap-0.5 pl-2">
                             <button 
                              type="button" 
                              onClick={() => editor?.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()} 
                              className="p-1.5 hover:bg-bg-soft rounded-lg text-ink-muted hover:text-accent transition-colors" 
                              title="Insert Table"
                            >
                              <TableIcon className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="bg-bg-soft rounded-2xl border border-border min-h-[600px] max-h-[800px] overflow-y-auto scrollbar-thin transition-all focus-within:border-accent focus-within:bg-card">
                      {editor ? (
                        <EditorContent editor={editor} />
                      ) : (
                        <div className="p-8 text-ink-muted/30 italic">Initializing interface...</div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <aside className="space-y-4 md:space-y-6">
                <div className="premium-card p-5 md:p-6 space-y-6 border border-border bg-card shadow-xl">
                  <div className="space-y-5">
                    <div className="space-y-2">
                      <label className="text-[9px] font-black text-ink-muted uppercase tracking-widest flex items-center gap-2 ml-1">
                        <ImageIcon className="w-3 h-3 text-accent/60" /> Header Image
                      </label>
                      <div className="flex gap-2">
                        <input 
                          value={coverImage}
                          onChange={e => setCoverImage(e.target.value)}
                          placeholder="Image URL"
                          className="flex-1 bg-bg border border-border rounded-xl px-4 py-2.5 text-xs font-bold outline-none text-ink"
                        />
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="px-4 bg-bg-soft hover:bg-card text-ink-muted rounded-xl transition-colors cursor-pointer border border-border"
                          title="Upload image"
                        >
                          <Upload className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <input 
                        type="file" 
                        ref={fileInputRef} 
                        onChange={handleImageUpload} 
                        accept="image/*" 
                        className="hidden" 
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-[9px] font-black text-ink-muted uppercase tracking-widest flex items-center gap-2 ml-1">
                        <Layout className="w-3 h-3 text-accent/60" /> Category
                      </label>
                      <div className="grid grid-cols-2 gap-1.5">
                        {CATEGORIES.map(cat => (
                          <button 
                            key={cat}
                            type="button"
                            onClick={() => setCategory(cat)}
                            className={`px-2 py-2 rounded-lg text-[9px] font-black transition-all border ${category === cat ? 'bg-accent text-slate-900 border-accent shadow-sm' : 'bg-bg text-ink-muted border-border hover:border-accent/40'}`}
                          >
                            {cat}
                          </button>
                        ))}
                      </div>
                      {category === 'Other' && (
                        <motion.div
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="mt-2"
                        >
                          <input
                            value={customCategory}
                            onChange={e => setCustomCategory(e.target.value)}
                            placeholder="Enter custom category..."
                            className="w-full bg-bg border border-border rounded-xl px-4 py-2.5 text-xs font-bold outline-none focus:border-accent text-ink"
                          />
                        </motion.div>
                      )}
                    </div>

                    <div className="space-y-2">
                      <label className="text-[9px] font-black text-ink-muted uppercase tracking-widest flex items-center gap-2 ml-1">
                        <Globe className="w-3 h-3 text-accent/60" /> Slug
                        {title && !isSlugAuto && (
                          <button 
                            type="button" 
                            onClick={() => setIsSlugAuto(true)}
                            className="ml-auto text-[8px] text-accent hover:underline lowercase font-bold"
                          >
                            Auto-sync
                          </button>
                        )}
                      </label>
                      <input 
                        value={slug}
                        onChange={e => {
                          setSlug(e.target.value);
                          setIsSlugAuto(false);
                        }}
                        onBlur={() => {
                          if (!slug && title) {
                            setIsSlugAuto(true);
                          }
                        }}
                        className="w-full bg-bg border border-border rounded-xl px-4 py-2.5 text-xs font-bold outline-none text-ink"
                        required
                        placeholder="path-to-article"
                      />
                    </div>
                  </div>

                  <div className="space-y-4 pt-4 border-t border-border">
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <label className="text-[9px] font-black text-ink-muted uppercase tracking-widest">Excerpt</label>
                        <button type="button" onClick={handleSummarize} disabled={summarizing || !content} className="text-[9px] font-black text-accent uppercase tracking-widest disabled:opacity-30">
                          {summarizing ? 'Neural Sync...' : 'AI Assist'}
                        </button>
                      </div>
                      <textarea 
                        value={excerpt}
                        onChange={e => setExcerpt(e.target.value)}
                        className="w-full bg-bg rounded-xl px-4 py-3 text-xs leading-relaxed font-bold border border-border min-h-[100px] outline-none text-ink-muted"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-[9px] font-black text-ink-muted uppercase tracking-widest">Nodes (Tags)</label>
                      <div className="flex flex-wrap gap-1.5 mb-2">
                        {tags.map(tag => (
                          <span key={tag} className="px-2 py-1 bg-bg border border-border text-ink-muted rounded-lg text-[9px] font-black flex items-center gap-1.5">
                            {tag}
                            <button onClick={() => toggleTag(tag)} className="hover:text-rose-500"><X className="w-3 h-3" /></button>
                          </span>
                        ))}
                      </div>
                      <input 
                        value={newTag}
                        onChange={e => setNewTag(e.target.value)}
                        onKeyDown={handleAddTag}
                        placeholder="Add tag..."
                        className="w-full bg-bg border border-border rounded-xl px-4 py-2.5 text-xs font-bold outline-none text-ink"
                      />
                    </div>
                  </div>

                  <div className="space-y-4 pt-4 border-t border-border">
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] font-black text-ink-muted uppercase tracking-widest">Publicity</span>
                      <button 
                        type="button"
                        onClick={() => setPublished(!published)}
                        className={`w-10 h-5 rounded-full p-1 transition-all ${published ? 'bg-teal-500' : 'bg-bg-soft border border-border'}`}
                      >
                        <div className={`w-3 h-3 ${published ? 'bg-slate-900' : 'bg-ink-muted'} rounded-full transition-transform ${published ? 'translate-x-5' : 'translate-x-0'}`} />
                      </button>
                    </div>

                    <button 
                      type="submit"
                      disabled={saving}
                      className="w-full bg-accent text-slate-900 py-4 rounded-xl text-[10px] font-black uppercase tracking-widest hover:opacity-90 transition-all disabled:opacity-50 active:scale-95"
                    >
                      {saving ? 'Saving...' : 'Publish Entry'}
                    </button>

                    {post && onDelete && (
                      <button 
                        type="button"
                        onClick={() => onDelete(post.id)}
                        className="w-full text-ink-muted py-1 text-[9px] font-black uppercase tracking-widest hover:text-rose-500 transition-colors"
                      >
                        Delete Artifact
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
