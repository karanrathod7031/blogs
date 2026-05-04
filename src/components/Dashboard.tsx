import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, Edit2, Globe, Lock, Trash2, Settings, FileText, Search, MoreHorizontal, ExternalLink } from 'lucide-react';
import { BlogPost } from '../types';
import { format } from 'date-fns';
import { UserManagement } from './UserManagement';

interface DashboardProps {
  posts: BlogPost[];
  onNew: () => void;
  onEdit: (post: BlogPost) => void;
  onDelete: (id: string) => void;
  onView: (slug: string) => void;
  onNotify: (message: string, type: 'success' | 'error') => void;
}

export default function Dashboard({ posts, onNew, onEdit, onDelete, onView, onNotify }: DashboardProps) {
  const [activeTab, setActiveTab] = useState<'posts' | 'settings'>('posts');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredPosts = posts.filter(post => 
    post.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 md:space-y-10">
      {/* Dashboard Nav */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 md:gap-8 bg-white p-4 md:p-8 rounded-2xl md:rounded-3xl border border-slate-200">
        <div className="flex gap-1 items-center bg-slate-50 p-1 rounded-xl md:rounded-2xl w-full md:w-auto">
          <button 
            onClick={() => setActiveTab('posts')}
            className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-3 md:px-5 py-2 md:py-2.5 rounded-lg md:rounded-xl text-[10px] md:text-xs font-bold transition-all ${activeTab === 'posts' ? 'bg-white text-accent shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
          >
            <FileText className="w-3.5 h-3.5 md:w-4 md:h-4" />
            Manage Posts
          </button>
          <button 
            onClick={() => setActiveTab('settings')}
            className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-3 md:px-5 py-2 md:py-2.5 rounded-lg md:rounded-xl text-[10px] md:text-xs font-bold transition-all ${activeTab === 'settings' ? 'bg-white text-accent shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
          >
            <Settings className="w-3.5 h-3.5 md:w-4 md:h-4" />
            Identity Studio
          </button>
        </div>

        <button 
          onClick={onNew}
          className="w-full md:w-auto flex items-center justify-center gap-2 bg-accent text-white px-5 md:px-6 py-3 rounded-xl text-xs md:text-sm font-bold hover:bg-accent-hover transition-all active:scale-95 shadow-lg shadow-accent/20"
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
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input 
                type="text"
                placeholder="Search posts..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm font-medium focus:ring-2 focus:ring-accent/10 focus:border-accent transition-all"
              />
            </div>

            {/* Desktop Table */}
            <div className="hidden md:block bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
              <table className="w-full text-left">
                <thead className="bg-slate-50/50 border-b border-slate-100">
                  <tr>
                    <th className="px-8 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Post Title</th>
                    <th className="px-8 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Status</th>
                    <th className="px-8 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Modified</th>
                    <th className="px-8 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 italic-none">
                  {filteredPosts.map((post) => (
                    <tr key={post.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-8 py-5">
                        <div className="space-y-1">
                          <p onClick={() => onView(post.slug)} className="font-bold text-ink hover:text-accent cursor-pointer transition-colors line-clamp-1">{post.title}</p>
                          <p className="text-[11px] font-medium text-slate-400">{post.category || 'Uncategorized'}</p>
                        </div>
                      </td>
                      <td className="px-8 py-5">
                         <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${post.published ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-amber-50 text-amber-600 border border-amber-100'}`}>
                            {post.published ? <Globe className="w-3 h-3" /> : <Lock className="w-3 h-3" />}
                            {post.published ? 'Published' : 'Draft'}
                          </span>
                      </td>
                      <td className="px-8 py-5 text-sm font-medium text-slate-500">
                        {format(post.updatedAt.toDate(), 'MMM d, yyyy')}
                      </td>
                      <td className="px-8 py-5">
                        <div className="flex justify-end gap-2">
                          <button onClick={() => onView(post.slug)} className="p-2 text-slate-400 hover:text-accent transition-colors" title="View"><ExternalLink className="w-4 h-4" /></button>
                          <button onClick={() => onEdit(post)} className="p-2 text-slate-400 hover:text-accent transition-colors" title="Edit"><Edit2 className="w-4 h-4" /></button>
                          <button onClick={() => onDelete(post.id)} className="p-2 text-slate-400 hover:text-rose-600 transition-colors" title="Delete"><Trash2 className="w-4 h-4" /></button>
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
                <div key={post.id} className="bg-white p-4 rounded-xl border border-slate-200 space-y-3">
                  <div className="flex justify-between items-start">
                    <div className="space-y-1.5">
                       <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-wider ${post.published ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-amber-50 text-amber-600 border border-amber-100'}`}>
                        {post.published ? 'Published' : 'Draft'}
                      </span>
                      <h3 className="font-bold text-ink leading-tight text-sm">{post.title}</h3>
                    </div>
                  </div>
                  <div className="flex justify-between items-center pt-3 border-t border-slate-50">
                    <span className="text-[10px] font-black text-slate-300 uppercase">{format(post.updatedAt.toDate(), 'MMM d')}</span>
                    <div className="flex gap-4">
                      <button onClick={() => onEdit(post)} className="text-accent font-black text-[10px] uppercase tracking-widest">Edit</button>
                      <button onClick={() => onDelete(post.id)} className="text-rose-500 font-black text-[10px] uppercase tracking-widest">Delete</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {filteredPosts.length === 0 && (
              <div className="text-center py-24 bg-white rounded-3xl border-2 border-dashed border-slate-200">
                <FileText className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                <p className="text-lg font-bold text-ink-muted">No posts found.</p>
                <button onClick={onNew} className="mt-4 text-accent font-bold text-sm hover:underline">Draft your first entry</button>
              </div>
            )}
          </motion.div>
        ) : (
          <UserManagement onNotify={onNotify} />
        )}
      </AnimatePresence>
    </div>
  );
}
