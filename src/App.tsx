import { useState, useEffect, useCallback } from 'react';
import Layout from './components/layout/Layout';
import BlogList from './features/blog/components/BlogList';
import BlogPostView from './features/blog/components/BlogPost';
import BlogEditor from './features/blog/components/BlogEditor';
import Dashboard from './features/user/components/Dashboard';
import PublicProfile from './features/user/components/PublicProfile';
import { AdminDashboard } from './features/admin/components/AdminDashboard';
import { BlogPost, View } from './types';
import { ConfirmationModal } from './components/ui/ConfirmationModal';
import {
  getPublishedPosts,
  getPostBySlug,
  createPost,
  updatePost,
  deletePost,
  getAllPostsForUser
} from './services/blogService';
import { useAuthState } from './hooks/useAuthState';
import { NotificationProvider, useNotification } from './components/ui/Toast';
import { ThemeProvider } from './core/contexts/ThemeContext';
import { RestrictedAccess } from './features/user/components/auth/RestrictedAccess';
import { QueryDocumentSnapshot } from 'firebase/firestore';
import { usePerformanceMonitoring } from './core/scaling/PerformanceMonitor';
import { cacheStrategy } from './core/scaling/CacheStrategy';

const PUBLISHED_POSTS_PAGE_SIZE = 10;

function AppContent() {
  const [view, setView] = useState<View>('list');
  const [prevView, setPrevView] = useState<View>('list');

  useEffect(() => {
    const handlePopState = (event: PopStateEvent) => {
      if (event.state?.view) {
        setView(event.state.view);
      } else {
        setView('list');
      }
    };

    window.addEventListener('popstate', handlePopState);

    if (!window.history.state) {
      window.history.replaceState({ view: 'list' }, '');
    }

    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [lastDoc, setLastDoc] = useState<QueryDocumentSnapshot | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [knownPageCount, setKnownPageCount] = useState(1);
  const [pageCache, setPageCache] = useState<Record<number, BlogPost[]>>({});
  const [cursorCache, setCursorCache] = useState<Record<number, QueryDocumentSnapshot | null>>({});
  const [currentPost, setCurrentPost] = useState<BlogPost | null>(null);
  const [currentProfileId, setCurrentProfileId] = useState<string | null>(null);
  const [editingPost, setEditingPost] = useState<BlogPost | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [deletingPostIds, setDeletingPostIds] = useState<Set<string>>(new Set());
  const { user, profile, loading: authLoading } = useAuthState();
  const { notify } = useNotification();
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  usePerformanceMonitoring('AppMainFeed');

  const navTo = useCallback((newView: View) => {
    window.scrollTo({ top: 0, behavior: 'auto' });

    if (newView !== view) {
      window.history.pushState({ view: newView }, '');
    }

    setView((prev) => {
      setPrevView(prev === 'post' || prev === 'profile' ? prevView : prev);
      return newView;
    });
  }, [view, prevView]);

  const fetchPosts = useCallback(async () => {
    if (view === 'list') {
      const cached = cacheStrategy.get<{ posts: BlogPost[]; hasMore: boolean }>('published_posts_v2');

      if (cached) {
        setPosts(cached.posts);
        setPageCache({ 1: cached.posts });
        setCurrentPage(1);
        setKnownPageCount(cached.hasMore ? 2 : 1);
        setHasMore(cached.hasMore);
        setLoading(false);
      }

      setLoading(true);
    }

    try {
      if (view === 'list') {
        const result = await getPublishedPosts();
        const newHasMore = result.posts.length === PUBLISHED_POSTS_PAGE_SIZE;

        setPosts(result.posts);
        setLastDoc(result.lastVisible);
        setHasMore(newHasMore);
        setCurrentPage(1);
        setKnownPageCount(newHasMore ? 2 : 1);
        setPageCache({ 1: result.posts });
        setCursorCache({ 1: result.lastVisible });

        cacheStrategy.set('published_posts_v2', {
          posts: result.posts,
          hasMore: newHasMore
        });
      } else if (view === 'admin' && user) {
        const data = await getAllPostsForUser(user.uid);
        setPosts(data);
        setHasMore(false);
        setCurrentPage(1);
        setKnownPageCount(1);
      }
    } catch {
      notify('Failed to fetch synchronization signals', 'error');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [view, user, notify]);

  useEffect(() => {
    if (view === 'list' || view === 'admin') {
      fetchPosts();
    }
  }, [view, user, fetchPosts]);

  const handleNextPage = useCallback(async () => {
    if (loadingMore || !hasMore) return;

    const nextPage = currentPage + 1;

    if (pageCache[nextPage]) {
      setPosts(pageCache[nextPage]);
      setCurrentPage(nextPage);
      setLastDoc(cursorCache[nextPage] || null);
      setKnownPageCount((prev) => Math.max(prev, hasMore ? nextPage + 1 : nextPage));
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    setLoadingMore(true);

    try {
      const result = await getPublishedPosts(lastDoc || undefined);
      const newHasMore = result.posts.length === PUBLISHED_POSTS_PAGE_SIZE;

      setPosts(result.posts);
      setLastDoc(result.lastVisible);
      setHasMore(newHasMore);
      setCurrentPage(nextPage);
      setKnownPageCount(newHasMore ? nextPage + 1 : nextPage);

      setPageCache((prev) => ({
        ...prev,
        [nextPage]: result.posts
      }));

      setCursorCache((prev) => ({
        ...prev,
        [nextPage]: result.lastVisible
      }));

      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch {
      notify('Failed to load next page', 'error');
    } finally {
      setLoadingMore(false);
    }
  }, [
    currentPage,
    cursorCache,
    hasMore,
    lastDoc,
    loadingMore,
    notify,
    pageCache
  ]);

  const handlePreviousPage = useCallback(() => {
    if (currentPage === 1) return;

    const previousPage = currentPage - 1;

    if (pageCache[previousPage]) {
      setPosts(pageCache[previousPage]);
      setCurrentPage(previousPage);
      setLastDoc(cursorCache[previousPage] || null);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [currentPage, cursorCache, pageCache]);

  const handlePageSelect = useCallback((page: number) => {
    if (page === currentPage || !pageCache[page]) return;

    setPosts(pageCache[page]);
    setCurrentPage(page);
    setLastDoc(cursorCache[page] || null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [currentPage, cursorCache, pageCache]);

  const handleSelectPost = useCallback(async (slug: string) => {
    console.log('[App] Selection Request for SLUG:', slug);

    if (!slug) {
      console.error('[App] Selection FAILED: Missing slug');
      notify('Target slug missing from source data', 'error');
      return;
    }

    setCurrentPost(null);
    navTo('post');
    setLoading(true);

    try {
      const post = await getPostBySlug(slug);
      console.log('[App] Selection RESOLVED:', post ? 'Found' : 'NULL');

      if (post) {
        setCurrentPost(post);
        document.title = `${post.title} | GlobalTrade`;
      } else {
        notify('Terminal not found in Global Archive', 'error');
        navTo('list');
      }
    } catch (err) {
      console.error('[App] Selection ERROR:', err);
      notify('Connection timeout or protocol violation', 'error');
      navTo('list');
    } finally {
      setLoading(false);
    }
  }, [notify, navTo]);

  const handleViewProfile = useCallback((userId: string) => {
    setCurrentProfileId(userId);
    navTo('profile');
  }, [navTo]);

  const handleSavePost = async (data: Partial<BlogPost>) => {
    try {
      if (editingPost) {
        await updatePost(editingPost.id, data);
        notify('Archive updated successfully', 'success');
      } else {
        await createPost(data);
        notify('New signal broadcasted', 'success');
      }

      navTo('admin');
      fetchPosts();
    } catch {
      notify('Sync failure: protocol error', 'error');
    }
  };

  const handleDeletePost = async (id: string) => {
    setConfirmDeleteId(id);
  };

  const executeDeletePost = async (id: string) => {
    setDeletingPostIds((prev) => new Set(prev).add(id));
    setConfirmDeleteId(null);

    try {
      await deletePost(id);
      setPosts((prev) => prev.filter((post) => post.id !== id));
      notify('Archive entry terminated', 'success');
    } catch {
      notify('Termination failure: security override active', 'error');
    } finally {
      setDeletingPostIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  };

  if (authLoading) {
    return (
      <div className="fixed inset-0 bg-[#020617] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-slate-800 border-t-accent rounded-full animate-spin" />
      </div>
    );
  }

  if (profile?.suspended) {
    return <RestrictedAccess reason="suspended" />;
  }

  const renderContent = () => {
    switch (view) {
      case 'list':
        return (
          <BlogList
            posts={posts}
            onSelectPost={handleSelectPost}
            onViewProfile={handleViewProfile}
            onNextPage={handleNextPage}
            onPreviousPage={handlePreviousPage}
            onPageSelect={handlePageSelect}
            currentPage={currentPage}
            knownPageCount={knownPageCount}
            hasMore={hasMore}
            loadingMore={loadingMore}
            loading={loading}
          />
        );

      case 'post':
        return (
          <BlogPostView
            post={currentPost}
            onBack={() => navTo(prevView)}
            onSelectPost={handleSelectPost}
            allPosts={posts}
            onNotify={notify}
            onViewProfile={handleViewProfile}
            loading={loading && !currentPost}
          />
        );

      case 'profile':
        return currentProfileId ? (
          <PublicProfile
            userId={currentProfileId}
            onBack={() => navTo(prevView)}
            onViewPost={handleSelectPost}
          />
        ) : null;

      case 'admin':
        return user ? (
          <Dashboard
            posts={posts}
            onNew={() => {
              setEditingPost(undefined);
              navTo('editor');
            }}
            onEdit={(post) => {
              setEditingPost(post);
              navTo('editor');
            }}
            onDelete={handleDeletePost}
            onView={handleSelectPost}
            onNotify={notify}
            deletingPostIds={deletingPostIds}
          />
        ) : (
          <div className="text-center py-20">
            <p className="text-xl font-serif italic text-slate-600">Credential authorization required.</p>
          </div>
        );

      case 'admin-panel': {
        const isAdmin = profile?.role === 'admin' || user?.email === 'rk.upk2345678@gmail.com';

        return isAdmin ? (
          <AdminDashboard onViewPost={handleSelectPost} />
        ) : (
          <div className="text-center py-20">
            <p className="text-xl font-serif italic text-rose-500">Master Clearance Required.</p>
          </div>
        );
      }

      case 'editor':
        return (
          <BlogEditor
            post={editingPost}
            onSave={handleSavePost}
            onCancel={() => navTo(user ? 'admin' : 'list')}
            onDelete={handleDeletePost}
            onNotify={notify}
          />
        );

      default:
        return null;
    }
  };

  return (
    <Layout
      activeView={view}
      onViewChange={navTo}
      onNew={() => {
        setEditingPost(undefined);
        navTo('editor');
      }}
      isLoading={loading}
    >
      {renderContent()}

      <ConfirmationModal
        isOpen={!!confirmDeleteId}
        onClose={() => setConfirmDeleteId(null)}
        onConfirm={() => confirmDeleteId && executeDeletePost(confirmDeleteId)}
        title="Confirm Termination"
        message="This action will permanently remove this entry from the Global Archive. This process is irreversible."
        confirmLabel="Terminate Dispatch"
      />
    </Layout>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <NotificationProvider>
        <AppContent />
      </NotificationProvider>
    </ThemeProvider>
  );
}



// import { useState, useEffect, useCallback } from 'react';
// import Layout from './components/layout/Layout';
// import BlogList from './features/blog/components/BlogList';
// import BlogPostView from './features/blog/components/BlogPost';
// import BlogEditor from './features/blog/components/BlogEditor';
// import Dashboard from './features/user/components/Dashboard';
// import PublicProfile from './features/user/components/PublicProfile';
// import { AdminDashboard } from './features/admin/components/AdminDashboard';
// import { BlogPost, View } from './types';
// import { ConfirmationModal } from './components/ui/ConfirmationModal';
// import { 
//   getPublishedPosts, 
//   getPostBySlug, 
//   createPost, 
//   updatePost, 
//   deletePost,
//   getAllPostsForUser 
// } from './services/blogService';
// import { useAuthState } from './hooks/useAuthState';
// import { NotificationProvider, useNotification } from './components/ui/Toast';
// import { ThemeProvider } from './core/contexts/ThemeContext';
// import { RestrictedAccess } from './features/user/components/auth/RestrictedAccess';
// import { QueryDocumentSnapshot } from 'firebase/firestore';
// import { usePerformanceMonitoring } from './core/scaling/PerformanceMonitor';
// import { cacheStrategy } from './core/scaling/CacheStrategy';

// function AppContent() {
//   const [view, setView] = useState<View>('list');
//   const [prevView, setPrevView] = useState<View>('list');

//   // Sync view with browser history for hardware back button support
//   useEffect(() => {
//     const handlePopState = (event: PopStateEvent) => {
//       if (event.state?.view) {
//         setView(event.state.view);
//       } else {
//         setView('list');
//       }
//     };

//     window.addEventListener('popstate', handlePopState);
//     if (!window.history.state) {
//       window.history.replaceState({ view: 'list' }, '');
//     }
//     return () => window.removeEventListener('popstate', handlePopState);
//   }, []);
//   const [posts, setPosts] = useState<BlogPost[]>([]);
//   const [lastDoc, setLastDoc] = useState<QueryDocumentSnapshot | null>(null);
//   const [hasMore, setHasMore] = useState(true);
//   const [currentPost, setCurrentPost] = useState<BlogPost | null>(null);
//   const [currentProfileId, setCurrentProfileId] = useState<string | null>(null);
//   const [editingPost, setEditingPost] = useState<BlogPost | undefined>(undefined);
//   const [loading, setLoading] = useState(true);
//   const [loadingMore, setLoadingMore] = useState(false);
//   const [deletingPostIds, setDeletingPostIds] = useState<Set<string>>(new Set());
//   const { user, profile, loading: authLoading } = useAuthState();
//   const { notify } = useNotification();
//   const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

//   usePerformanceMonitoring('AppMainFeed');

//   const navTo = useCallback((newView: View) => {
//     window.scrollTo({ top: 0, behavior: 'auto' });
    
//     // Update history for back button support
//     if (newView !== view) {
//       window.history.pushState({ view: newView }, '');
//     }

//     setView(prev => {
//       setPrevView(prev === 'post' || prev === 'profile' ? prevView : prev);
//       return newView;
//     });
//   }, [view, prevView]);

//   const fetchPosts = useCallback(async (isLoadMore = false) => {
//     if (isLoadMore) setLoadingMore(true);
//     else {
//       // Check cache first for initial load to scale to 10,000+ users without DB stress
//       if (view === 'list') {
//         const cached = cacheStrategy.get<{ posts: BlogPost[], hasMore: boolean }>('published_posts_v2');
//         if (cached) {
//           setPosts(cached.posts);
//           setHasMore(cached.hasMore);
//           setLoading(false);
//           // Still fetch in background to sync (SWR pattern)
//         }
//       }
//       setLoading(true);
//     }

//     try {
//       if (view === 'list') {
//         const result = await getPublishedPosts(isLoadMore ? (lastDoc || undefined) : undefined);
//         const newHasMore = result.posts.length === 9;

//         if (isLoadMore) {
//           setPosts(prev => [...prev, ...result.posts]);
//         } else {
//           setPosts(result.posts);
//           // Only cache the first page for optimal scaling
//           cacheStrategy.set('published_posts_v2', { 
//             posts: result.posts, 
//             hasMore: newHasMore 
//           });
//         }
//         setLastDoc(result.lastVisible);
//         setHasMore(newHasMore);
//       } else if (view === 'admin' && user) {
//         const data = await getAllPostsForUser(user.uid);
//         setPosts(data);
//         setHasMore(false);
//       }
//     } catch {
//       notify('Failed to fetch synchronization signals', 'error');
//     } finally {
//       setLoading(false);
//       setLoadingMore(false);
//     }
//   }, [view, user, lastDoc, notify]);

//   useEffect(() => {
//     if (view === 'list' || view === 'admin') {
//       fetchPosts(false);
//     }
//   }, [view, user]);

//   const handleLoadMore = useCallback(() => {
//     if (!loadingMore && hasMore) {
//       fetchPosts(true);
//     }
//   }, [loadingMore, hasMore, fetchPosts]);

//   const handleSelectPost = useCallback(async (slug: string) => {
//     console.log('[App] Selection Request for SLUG:', slug);
//     if (!slug) {
//       console.error('[App] Selection FAILED: Missing slug');
//       notify('Target slug missing from source data', 'error');
//       return;
//     }

//     // Step 1: Immediate Transition for Instagram-like feel
//     setCurrentPost(null);
//     navTo('post');
//     setLoading(true);

//     try {
//       const post = await getPostBySlug(slug);
//       console.log('[App] Selection RESOLVED:', post ? 'Found' : 'NULL');
//       if (post) {
//         setCurrentPost(post);
//         // Page title updates for SEO/Feel
//         document.title = `${post.title} | GlobalTrade`;
//       } else {
//         notify('Terminal not found in Global Archive', 'error');
//         navTo('list');
//       }
//     } catch (err) {
//       console.error('[App] Selection ERROR:', err);
//       notify('Connection timeout or protocol violation', 'error');
//       navTo('list');
//     } finally {
//       setLoading(false);
//     }
//   }, [notify, navTo]);

//   const handleViewProfile = useCallback((userId: string) => {
//     setCurrentProfileId(userId);
//     navTo('profile');
//   }, [navTo]);

//   const handleSavePost = async (data: Partial<BlogPost>) => {
//     try {
//       if (editingPost) {
//         await updatePost(editingPost.id, data);
//         notify('Archive updated successfully', 'success');
//       } else {
//         await createPost(data);
//         notify('New signal broadcasted', 'success');
//       }
//       navTo('admin');
//       fetchPosts();
//     } catch {
//       notify('Sync failure: protocol error', 'error');
//     }
//   };

//   const handleDeletePost = async (id: string) => {
//     setConfirmDeleteId(id);
//   };

//   const executeDeletePost = async (id: string) => {
//     setDeletingPostIds(prev => new Set(prev).add(id));
//     setConfirmDeleteId(null);
//     try {
//       await deletePost(id);
//       setPosts(prev => prev.filter(p => p.id !== id));
//       notify('Archive entry terminated', 'success');
//     } catch {
//       notify('Termination failure: security override active', 'error');
//     } finally {
//       setDeletingPostIds(prev => {
//         const next = new Set(prev);
//         next.delete(id);
//         return next;
//       });
//     }
//   };

//   if (authLoading) {
//     return (
//       <div className="fixed inset-0 bg-[#020617] flex items-center justify-center">
//         <div className="w-8 h-8 border-2 border-slate-800 border-t-accent rounded-full animate-spin" />
//       </div>
//     );
//   }

//   if (profile?.suspended) {
//     return <RestrictedAccess reason="suspended" />;
//   }

//   const renderContent = () => {
//     switch (view) {
//       case 'list':
//         return (
//           <BlogList 
//             posts={posts} 
//             onSelectPost={handleSelectPost} 
//             onViewProfile={handleViewProfile}
//             onLoadMore={handleLoadMore}
//             hasMore={hasMore}
//             loadingMore={loadingMore}
//             loading={loading}
//           />
//         );
//       case 'post':
//         return (
//           <BlogPostView 
//             post={currentPost} 
//             onBack={() => navTo(prevView)} 
//             onSelectPost={handleSelectPost}
//             allPosts={posts} 
//             onNotify={notify} 
//             onViewProfile={handleViewProfile}
//             loading={loading && !currentPost}
//           />
//         );
//       case 'profile':
//         return currentProfileId ? (
//           <PublicProfile userId={currentProfileId} onBack={() => navTo(prevView)} onViewPost={handleSelectPost} />
//         ) : null;
//       case 'admin':
//         return user ? (
//           <Dashboard 
//             posts={posts} 
//             onNew={() => { setEditingPost(undefined); navTo('editor'); }} 
//             onEdit={(post) => { setEditingPost(post); navTo('editor'); }}
//             onDelete={handleDeletePost}
//             onView={handleSelectPost}
//             onNotify={notify}
//             deletingPostIds={deletingPostIds}
//           />
//         ) : (
//           <div className="text-center py-20">
//             <p className="text-xl font-serif italic text-slate-600">Credential authorization required.</p>
//           </div>
//         );
//       case 'admin-panel':
//         const isAdmin = profile?.role === 'admin' || user?.email === 'rk.upk2345678@gmail.com';
//         return isAdmin ? (
//           <AdminDashboard onViewPost={handleSelectPost} />
//         ) : (
//           <div className="text-center py-20">
//             <p className="text-xl font-serif italic text-rose-500">Master Clearance Required.</p>
//           </div>
//         );
//       case 'editor':
//         return (
//           <BlogEditor 
//             post={editingPost} 
//             onSave={handleSavePost} 
//             onCancel={() => navTo(user ? 'admin' : 'list')}
//             onDelete={handleDeletePost}
//             onNotify={notify}
//           />
//         );
//       default:
//         return null;
//     }
//   };

//   return (
//     <Layout 
//       activeView={view} 
//       onViewChange={navTo}
//       onNew={() => { setEditingPost(undefined); navTo('editor'); }}
//       isLoading={loading}
//     >
//       {renderContent()}
      
//       <ConfirmationModal
//         isOpen={!!confirmDeleteId}
//         onClose={() => setConfirmDeleteId(null)}
//         onConfirm={() => confirmDeleteId && executeDeletePost(confirmDeleteId)}
//         title="Confirm Termination"
//         message="This action will permanently remove this entry from the Global Archive. This process is irreversible."
//         confirmLabel="Terminate Dispatch"
//       />
//     </Layout>
//   );
// }

// export default function App() {
//   return (
//     <ThemeProvider>
//       <NotificationProvider>
//         <AppContent />
//       </NotificationProvider>
//     </ThemeProvider>
//   );
// }
