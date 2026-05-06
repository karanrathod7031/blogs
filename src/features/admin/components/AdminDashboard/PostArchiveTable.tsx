import React from 'react';
import { Eye, Shield, Ban, Trash2, ExternalLink, RefreshCcw } from 'lucide-react';
import { format } from 'date-fns';
import { BlogPost, UserProfile } from '../../../../types';

interface PostArchiveTableProps {
  posts: BlogPost[];
  users: UserProfile[];
  deletingIds: Set<string>;
  onDeletePost: (postId: string) => Promise<void>;
  onToggleSuspension: (userId: string, isSuspended: boolean) => Promise<void>;
  suspendingUserIds: Set<string>;
  onViewPost: (slug: string) => void;
}

export const PostArchiveTable: React.FC<PostArchiveTableProps> = ({ 
  posts, 
  users, 
  deletingIds, 
  onDeletePost,
  onToggleSuspension,
  suspendingUserIds,
  onViewPost
}) => {
  return (
    <div className="bg-card border border-border rounded-[2rem] overflow-hidden shadow-xl">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="bg-bg-soft border-b border-border">
            <th className="px-8 py-5 text-[10px] font-black uppercase text-ink-muted tracking-widest">Dispatch Title</th>
            <th className="px-8 py-5 text-[10px] font-black uppercase text-ink-muted tracking-widest">Nexus (Category)</th>
            <th className="px-8 py-5 text-[10px] font-black uppercase text-ink-muted tracking-widest">Commenced</th>
            <th className="px-8 py-5 text-[10px] font-black uppercase text-ink-muted tracking-widest text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {posts.map(post => {
            const author = users.find(u => u.uid === post.authorId);
            if (!post.id || !post.slug) {
              console.warn(`[AdminArchive] Entry detected with missing metadata: ID=${post.id}, SLUG=${post.slug}`);
            }
            return (
              <tr key={post.id} className="hover:bg-bg-soft transition-colors">
                <td className="px-8 py-4">
                  <div>
                    <p className="text-sm font-black text-ink truncate max-w-xs">{post.title}</p>
                    <p className="text-[10px] font-bold text-ink-muted">By {post.authorName}</p>
                    {author && (
                      <div className="flex items-center gap-2 mt-1">
                        <p className="text-[9px] font-medium text-accent">{author.email}</p>
                        <button 
                          onClick={() => onToggleSuspension(author.uid, author.suspended || false)}
                          disabled={suspendingUserIds.has(author.uid)}
                          className={`p-1 rounded bg-bg-soft border border-border hover:bg-card transition-all cursor-pointer ${author.suspended ? 'text-emerald-500' : 'text-rose-500'} disabled:opacity-30`}
                          title={author.suspended ? "Unsuspend Account" : "Suspend Account"}
                        >
                          {suspendingUserIds.has(author.uid) ? (
                            <RefreshCcw className="w-2.5 h-2.5 animate-spin" />
                          ) : author.suspended ? (
                            <Shield className="w-2.5 h-2.5" />
                          ) : (
                            <Ban className="w-2.5 h-2.5" />
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                </td>
                <td className="px-8 py-4">
                  <span className="px-2 py-1 bg-bg-soft border border-border text-ink-muted rounded-lg text-[10px] font-black uppercase">
                    {post.category || 'Opinion'}
                  </span>
                </td>
                <td className="px-8 py-4 text-xs font-bold text-ink-muted">
                  {format(post.createdAt.toDate(), 'MMM d, yyyy')}
                </td>
                <td className="px-8 py-4 text-right">
                  <div className="flex justify-end gap-2">
                    <div className="flex items-center gap-1.5 text-ink-muted mr-4">
                      <Eye className="w-3 h-3" /> <span className="text-[10px]">{post.viewCount || 0}</span>
                    </div>
                    <button 
                      onClick={() => {
                        console.log('[Admin] Table delete trigger for:', post.id);
                        onDeletePost(post.id);
                      }}
                      disabled={deletingIds.has(post.id)}
                      className="p-2 bg-rose-500/10 text-rose-500 border border-rose-500/10 rounded-xl hover:bg-rose-500/20 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Delete Post"
                    >
                      {deletingIds.has(post.id) ? (
                        <RefreshCcw className="w-4 h-4 animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </button>
                    <button 
                      onClick={() => {
                        console.log('[Admin] Table view trigger for slug:', post.slug);
                        onViewPost(post.slug);
                      }}
                      className="p-2 bg-bg-soft border border-border text-ink-muted rounded-xl hover:text-accent transition-all cursor-pointer"
                      title="View Post"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};
