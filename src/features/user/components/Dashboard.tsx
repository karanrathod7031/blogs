import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, Edit2, Globe, Lock, Trash2, Settings, FileText, Search, MoreHorizontal, ExternalLink } from 'lucide-react';
import { BlogPost } from '../../../types';
import { format } from 'date-fns';
import { ProfileEditor } from './ProfileEditor';

interface DashboardProps {
  posts: BlogPost[];
  onNew: () => void;
  onEdit: (post: BlogPost) => void;
  onDelete: (id: string) => void;
  onView: (slug: string) => void;
  onNotify: (message: string, type: 'success' | 'error') => void;
  deletingPostIds?: Set<string>;
}

export default function Dashboard({ posts, onNew, onEdit, onDelete, onView, onNotify, deletingPostIds = new Set() }: DashboardProps) {
  const [activeTab, setActiveTab] = useState<'posts' | 'settings'>('posts');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredPosts = posts.filter(post => 
    post.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 md:space-y-10">
      {/* Dashboard Nav */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 md:gap-8 bg-card p-4 md:p-8 rounded-2xl md:rounded-3xl border border-border shadow-2xl">
        <div className="flex gap-1 items-center bg-bg-soft p-1 rounded-xl md:rounded-2xl w-full md:w-auto border border-border">
          <button 
            onClick={() => setActiveTab('posts')}
            className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-3 md:px-5 py-2 md:py-2.5 rounded-lg md:rounded-xl text-[10px] md:text-xs font-bold transition-all ${activeTab === 'posts' ? 'bg-card text-accent border border-border shadow-sm' : 'text-ink-muted hover:text-ink'}`}
          >
            <FileText className="w-3.5 h-3.5 md:w-4 md:h-4" />
            Manage Posts
          </button>
          <button 
            onClick={() => setActiveTab('settings')}
            className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-3 md:px-5 py-2 md:py-2.5 rounded-lg md:rounded-xl text-[10px] md:text-xs font-bold transition-all ${activeTab === 'settings' ? 'bg-card text-accent border border-border shadow-sm' : 'text-ink-muted hover:text-ink'}`}
          >
            <Settings className="w-3.5 h-3.5 md:w-4 md:h-4" />
            Identity Studio
          </button>
        </div>

        <button 
          onClick={onNew}
          className="w-full md:w-auto flex items-center justify-center gap-2 bg-accent text-slate-900 px-5 md:px-6 py-3 rounded-xl text-xs md:text-sm font-bold hover:bg-accent/90 transition-all active:scale-95 shadow-lg shadow-accent/20"
        >
          <Plus className="w-4 h-4 md:w-5 md:h-5" />
          Create New Blog
        </button>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'posts' ? (
          <motion.div
            key="posts"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            {/* Filter Bar */}
            <div className="relative max-w-md">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-muted" />
              <input 
                type="text"
                placeholder="Search posts..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-11 pr-4 py-3 bg-card border border-border rounded-2xl text-sm font-medium focus:ring-4 focus:ring-accent/10 focus:border-accent transition-all text-ink placeholder:text-ink-muted/30"
              />
            </div>

            {/* Desktop Table */}
            <div className="hidden md:block bg-card rounded-3xl border border-border overflow-hidden shadow-xl">
              <table className="w-full text-left">
                <thead className="bg-bg-soft border-b border-border">
                  <tr>
                    <th className="px-8 py-4 text-xs font-bold text-ink-muted uppercase tracking-widest">Post Title</th>
                    <th className="px-8 py-4 text-xs font-bold text-ink-muted uppercase tracking-widest">Status</th>
                    <th className="px-8 py-4 text-xs font-bold text-ink-muted uppercase tracking-widest">Modified</th>
                    <th className="px-8 py-4 text-xs font-bold text-ink-muted uppercase tracking-widest text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border italic-none">
                  {filteredPosts.map((post) => (
                    <tr key={post.id} className="hover:bg-bg-soft transition-colors">
                      <td className="px-8 py-5">
                        <div className="space-y-1">
                          <p onClick={() => onView(post.slug)} className="font-bold text-ink hover:text-accent cursor-pointer transition-colors line-clamp-1">{post.title}</p>
                          <p className="text-[11px] font-medium text-ink-muted">{post.category || 'Uncategorized'}</p>
                        </div>
                      </td>
                      <td className="px-8 py-5">
                         <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${post.published ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : 'bg-amber-500/10 text-amber-500 border border-amber-500/20'}`}>
                            {post.published ? <Globe className="w-3 h-3" /> : <Lock className="w-3 h-3" />}
                            {post.published ? 'Published' : 'Draft'}
                          </span>
                      </td>
                      <td className="px-8 py-5 text-sm font-medium text-ink-muted">
                        {format(post.updatedAt.toDate(), 'MMM d, yyyy')}
                      </td>
                      <td className="px-8 py-5">
                        <div className="flex justify-end gap-2">
                          <button onClick={() => onView(post.slug)} className="p-2 text-ink-muted hover:text-accent transition-colors" title="View"><ExternalLink className="w-4 h-4" /></button>
                          <button onClick={() => onEdit(post)} className="p-2 text-ink-muted hover:text-accent transition-colors" title="Edit"><Edit2 className="w-4 h-4" /></button>
                          <button 
                            onClick={() => onDelete(post.id)} 
                            disabled={deletingPostIds.has(post.id)}
                            className="p-2 text-ink-muted hover:text-rose-600 transition-colors disabled:opacity-30" 
                            title="Delete"
                          >
                            {deletingPostIds.has(post.id) ? (
                              <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                            ) : (
                              <Trash2 className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile List */}
            <div className="md:hidden space-y-3">
              {filteredPosts.map((post) => (
                <div key={post.id} className="bg-card p-4 rounded-xl border border-border space-y-3 shadow-md">
                  <div className="flex justify-between items-start">
                    <div className="space-y-1.5">
                       <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-wider ${post.published ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : 'bg-amber-500/10 text-amber-500 border border-amber-500/20'}`}>
                        {post.published ? 'Published' : 'Draft'}
                      </span>
                      <h3 className="font-bold text-ink leading-tight text-sm">{post.title}</h3>
                    </div>
                  </div>
                  <div className="flex justify-between items-center pt-3 border-t border-border">
                    <span className="text-[10px] font-black text-ink-muted uppercase">{format(post.updatedAt.toDate(), 'MMM d')}</span>
                    <div className="flex gap-4">
                      <button onClick={() => onEdit(post)} className="text-accent font-black text-[10px] uppercase tracking-widest">Edit</button>
                      <button onClick={() => onDelete(post.id)} className="text-rose-500 font-black text-[10px] uppercase tracking-widest">Delete</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {filteredPosts.length === 0 && (
              <div className="text-center py-24 bg-bg-soft rounded-3xl border-2 border-dashed border-border">
                <FileText className="w-12 h-12 text-border mx-auto mb-4" />
                <p className="text-lg font-bold text-ink-muted">No posts found.</p>
                <button onClick={onNew} className="mt-4 text-accent font-bold text-sm hover:underline">Draft your first entry</button>
              </div>
            )}
          </motion.div>
        ) : (
          <ProfileEditor onNotify={onNotify} />
        )}
      </AnimatePresence>
    </div>
  );
}
