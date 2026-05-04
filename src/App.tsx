import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import Layout from './components/Layout';
import BlogList from './components/BlogList';
import BlogPostView from './components/BlogPost';
import BlogEditor from './components/BlogEditor';
import Dashboard from './components/Dashboard';
import { BlogPost, View } from './types';
import { 
  getPublishedPosts, 
  getPostBySlug, 
  createPost, 
  updatePost, 
  deletePost,
  getAllPostsForUser 
} from './services/blogService';
import { useAuthState } from './hooks/useAuthState';

export default function App() {
  const [view, setView] = useState<View>('list');
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [currentPost, setCurrentPost] = useState<BlogPost | null>(null);
  const [editingPost, setEditingPost] = useState<BlogPost | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState<{message: string, type: 'success' | 'error'} | null>(null);
  const { user } = useAuthState();

  const showNotification = (message: string, type: 'success' | 'error' = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const fetchPosts = async () => {
    setLoading(true);
    try {
      let data;
      if (view === 'list') {
        data = await getPublishedPosts();
      } else if (view === 'admin' && user) {
        data = await getAllPostsForUser(user.uid);
      } else {
        data = posts;
      }
      setPosts(data);
    } catch (err) {
      showNotification('Failed to fetch posts', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, [view, user]);

  const handleSelectPost = async (slug: string) => {
    setLoading(true);
    try {
      const post = await getPostBySlug(slug);
      if (post) {
        setCurrentPost(post);
        setView('post');
      } else {
        showNotification('Post not found', 'error');
      }
    } catch (err) {
      showNotification('Error loading post', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSavePost = async (data: Partial<BlogPost>) => {
    try {
      if (editingPost) {
        await updatePost(editingPost.id, data);
        showNotification('Entry updated successfully');
      } else {
        await createPost(data);
        showNotification('New entry published');
      }
      setView('admin');
      fetchPosts();
    } catch (err) {
      showNotification('Failed to save entry', 'error');
    }
  };

  const handleDeletePost = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this entry?')) {
      try {
        await deletePost(id);
        showNotification('Entry deleted');
        fetchPosts();
      } catch (err) {
        showNotification('Failed to delete entry', 'error');
      }
    }
  };

  const renderContent = () => {
    if (loading && posts.length === 0) {
      return (
        <div className="py-40 flex items-center justify-center">
          <div className="w-12 h-12 border-2 border-[#141414]/10 border-t-[#141414] rounded-full animate-spin" />
        </div>
      );
    }

    switch (view) {
      case 'list':
        return <BlogList posts={posts} onSelectPost={handleSelectPost} />;
      case 'post':
        return currentPost ? (
          <BlogPostView post={currentPost} onBack={() => setView('list')} allPosts={posts} />
        ) : null;
      case 'admin':
        return user ? (
          <Dashboard 
            posts={posts} 
            onNew={() => { setEditingPost(undefined); setView('editor'); }} 
            onEdit={(post) => { setEditingPost(post); setView('editor'); }}
            onDelete={handleDeletePost}
            onView={handleSelectPost}
            onNotify={showNotification}
          />
        ) : (
          <div className="text-center py-20">
            <p className="text-xl font-serif italic">Please login to access the studio.</p>
          </div>
        );
      case 'editor':
        return (
          <BlogEditor 
            post={editingPost} 
            onSave={handleSavePost} 
            onCancel={() => setView(user ? 'admin' : 'list')}
            onDelete={handleDeletePost}
          />
        );
      default:
        return null;
    }
  };

  return (
    <>
      <Layout 
        activeView={view} 
        onViewChange={setView}
        onNew={() => { setEditingPost(undefined); setView('editor'); }}
      >
        {renderContent()}
      </Layout>

      {/* Notification Toast */}
      {notification && (
        <motion.div 
          initial={{ opacity: 0, y: 50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 50, scale: 0.9 }}
          className={`fixed bottom-12 left-1/2 -translate-x-1/2 px-8 py-4 rounded-2xl text-[10px] md:text-xs font-black uppercase tracking-[0.3em] shadow-2xl z-[100] backdrop-blur-xl border border-white/10 ${
            notification.type === 'success' ? 'bg-[#1A1A1A] text-white' : 'bg-red-600 text-white shadow-red-900/20'
          }`}
        >
          <div className="flex items-center gap-3">
             <div className={`w-2 h-2 rounded-full ${notification.type === 'success' ? 'bg-emerald-400' : 'bg-white'} animate-pulse`} />
            {notification.message}
          </div>
        </motion.div>
      )}
    </>
  );
}
