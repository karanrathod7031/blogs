import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { 
  Users, 
  FileText, 
  Eye, 
  Shield, 
  RefreshCcw,
  Search,
  Activity,
  MousePointerClick,
  Radio,
  CalendarClock,
} from 'lucide-react';
import { adminService } from '../../../../services/adminService';
import { UserProfile, BlogPost, AppStats } from '../../../../types';
import { useAuthState } from '../../../../hooks/useAuthState';
import { StatCard } from './StatCard';
import { SystemPulse } from './SystemPulse';
import { UserRegistryTable } from './UserRegistryTable';
import { PostArchiveTable } from './PostArchiveTable';
import { useNotification } from '../../../../components/ui/Toast';
import { ConfirmationModal } from '../../../../components/ui/ConfirmationModal';
import { AnonymousActivityCard } from './AnonymousActivityCard';
import { ActiveUserRecordsCard } from './ActiveUserRecordsCard';

interface AdminDashboardProps {
  onViewPost: (slug: string) => void;
}

const dashboardTabs: Array<'overview' | 'users' | 'posts'> = ['overview', 'users', 'posts'];

type ResourceStatus = 'idle' | 'loading' | 'ready' | 'error';

interface ResourceState<T> {
  status: ResourceStatus;
  data: T | null;
}

interface AnonymousActivityStats {
  todayActive: number;
  currentActive: number;
  recentSessions: number;
}

const ROOT_ADMIN_EMAIL = 'rk.upk2345678@gmail.com';

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return 'Unknown error';
}

function sortUsersWithAdminFirst(list: UserProfile[]): UserProfile[] {
  return [...list].sort((left, right) => {
    const leftRoot = left.email === ROOT_ADMIN_EMAIL ? 1 : 0;
    const rightRoot = right.email === ROOT_ADMIN_EMAIL ? 1 : 0;
    if (leftRoot !== rightRoot) return rightRoot - leftRoot;

    const leftAdmin = (left.email === ROOT_ADMIN_EMAIL || left.role === 'admin') ? 1 : 0;
    const rightAdmin = (right.email === ROOT_ADMIN_EMAIL || right.role === 'admin') ? 1 : 0;
    if (leftAdmin !== rightAdmin) return rightAdmin - leftAdmin;

    const leftCreated = left.createdAt && 'toMillis' in left.createdAt ? left.createdAt.toMillis() : 0;
    const rightCreated = right.createdAt && 'toMillis' in right.createdAt ? right.createdAt.toMillis() : 0;
    return rightCreated - leftCreated;
  }).map((entry) => entry.email === ROOT_ADMIN_EMAIL ? { ...entry, role: 'admin' } : entry);
}

function buildPostDerivedStats(allPosts: BlogPost[]) {
  const totalViews = allPosts.reduce((sum, post) => sum + (post.viewCount || 0), 0);
  const totalLikes = allPosts.reduce((sum, post) => sum + (post.likeCount || 0), 0);

  return {
    totalPosts: allPosts.length,
    totalViews,
    totalLikes,
    totalComments: 0
  };
}

function getTodayKey(date = new Date()): string {
  return date.toISOString().slice(0, 10);
}

function deriveSignedInActivity(users: UserProfile[]) {
  const todayKey = getTodayKey();
  const activeThreshold = Date.now() - (5 * 60 * 1000);
  const records = users
    .filter((entry) => typeof entry.lastSeenAt === 'number')
    .sort((left, right) => (right.lastSeenAt || 0) - (left.lastSeenAt || 0))
    .slice(0, 6)
    .map((entry) => ({
      uid: entry.uid,
      displayName: entry.displayName,
      email: entry.email,
      role: entry.role,
      lastSeenAt: entry.lastSeenAt as number
    }));

  return {
    todayActive: users.filter((entry) => entry.lastActiveDayKey === todayKey).length,
    currentActive: users.filter((entry) => typeof entry.lastSeenAt === 'number' && entry.lastSeenAt >= activeThreshold).length,
    records
  };
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onViewPost }) => {
  const { user, profile, loading: authLoading } = useAuthState();
  const { notify } = useNotification();
  const [usersState, setUsersState] = useState<ResourceState<UserProfile[]>>({ status: 'idle', data: null });
  const [postsState, setPostsState] = useState<ResourceState<BlogPost[]>>({ status: 'idle', data: null });
  const [statsState, setStatsState] = useState<ResourceState<AppStats>>({ status: 'idle', data: null });
  const [anonymousState, setAnonymousState] = useState<ResourceState<AnonymousActivityStats>>({ status: 'idle', data: null });
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'posts'>('overview');
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set());
  const [deletingUserIds, setDeletingUserIds] = useState<Set<string>>(new Set());
  const [suspendingUserIds, setSuspendingUserIds] = useState<Set<string>>(new Set());
  const [confirmDeletePayload, setConfirmDeletePayload] = useState<string | null>(null);
  const [confirmDeleteUserPayload, setConfirmDeleteUserPayload] = useState<string | null>(null);

  const isAdmin = profile?.role === 'admin' || user?.email === ROOT_ADMIN_EMAIL;

  const users = usersState.data || [];
  const posts = postsState.data || [];
  const postDerivedStats = buildPostDerivedStats(posts);
  const signedInActivity = deriveSignedInActivity(users);
  const overviewStats: Partial<Record<keyof AppStats, number | null>> = {
    totalUsers: usersState.status === 'ready' ? users.length : null,
    totalPosts: postsState.status === 'ready' ? postDerivedStats.totalPosts : null,
    totalViews: postsState.status === 'ready' ? postDerivedStats.totalViews : null,
    totalLikes: postsState.status === 'ready' ? postDerivedStats.totalLikes : null,
    totalComments: postsState.status === 'ready' ? postDerivedStats.totalComments : null,
    totalInteractions: statsState.status === 'ready' ? (statsState.data?.totalInteractions ?? 0) : null,
    todayActiveUsers: usersState.status === 'ready'
      ? signedInActivity.todayActive + (anonymousState.data?.todayActive || 0)
      : null,
    currentActiveUsers: usersState.status === 'ready'
      ? signedInActivity.currentActive + (anonymousState.data?.currentActive || 0)
      : null
  };

  const fetchUsers = async (silent = false) => {
    if (!silent || !usersState.data) {
      setUsersState((prev) => ({ ...prev, status: 'loading' }));
    }

    try {
      const allUsers = sortUsersWithAdminFirst(await adminService.getAllUsers());
      setUsersState({ status: 'ready', data: allUsers });
    } catch (error) {
      console.error('Failed to fetch users:', error);
      setUsersState((prev) => ({ status: 'error', data: prev.data }));
      notify(`User registry sync failed: ${getErrorMessage(error)}`, 'error');
    }
  };

  const fetchPosts = async (silent = false) => {
    if (!silent || !postsState.data) {
      setPostsState((prev) => ({ ...prev, status: 'loading' }));
    }

    try {
      const allPosts = await adminService.getAllPosts();
      setPostsState({ status: 'ready', data: allPosts });
    } catch (error) {
      console.error('Failed to fetch posts:', error);
      setPostsState((prev) => ({ status: 'error', data: prev.data }));
      notify(`Archive sync failed: ${getErrorMessage(error)}`, 'error');
    }
  };

  const fetchStats = async (silent = false) => {
    if (!silent || !statsState.data) {
      setStatsState((prev) => ({ ...prev, status: 'loading' }));
    }

    try {
      const statSnapshot = await adminService.getAppStats();
      setStatsState({ status: 'ready', data: statSnapshot });
    } catch (error) {
      console.error('Failed to fetch stats:', error);
      setStatsState((prev) => ({ status: 'error', data: prev.data }));
      notify(`Telemetry sync failed: ${getErrorMessage(error)}`, 'error');
    }
  };

  const fetchAnonymous = async (silent = false) => {
    if (!silent || !anonymousState.data) {
      setAnonymousState((prev) => ({ ...prev, status: 'loading' }));
    }

    try {
      const snapshot = await adminService.getAnonymousActivityStats();
      setAnonymousState({ status: 'ready', data: snapshot });
    } catch (error) {
      console.error('Failed to fetch anonymous activity:', error);
      setAnonymousState((prev) => ({ status: 'error', data: prev.data }));
      notify(`Anonymous activity sync failed: ${getErrorMessage(error)}`, 'error');
    }
  };

  const fetchData = async (silent = false) => {
    if (authLoading) return;

    if (!user || !isAdmin) {
      setUsersState((prev) => ({ ...prev, status: 'idle' }));
      setPostsState((prev) => ({ ...prev, status: 'idle' }));
      setStatsState((prev) => ({ ...prev, status: 'idle' }));
      setAnonymousState((prev) => ({ ...prev, status: 'idle' }));
      return;
    }

    await Promise.all([
      fetchUsers(silent),
      fetchPosts(silent),
      fetchStats(silent),
      fetchAnonymous(silent)
    ]);
  };

  useEffect(() => {
    void fetchData();
  }, [authLoading, user?.uid, profile?.role]);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      void handleRefreshStats();
    }, 30000);

    return () => window.clearInterval(intervalId);
  }, []);

  const handleRefreshStats = async () => {
    if (!user || !isAdmin) return;

    setRefreshing(true);
    try {
      const newStats = await adminService.refreshStats();
      setStatsState({ status: 'ready', data: newStats });
      await fetchData(true);
    } catch (error) {
      console.error('Failed to refresh stats:', error);
      notify('Stats refresh failed', 'error');
    } finally {
      setRefreshing(false);
    }
  };

  const handleToggleSuspension = async (userId: string, isSuspended: boolean) => {
    setSuspendingUserIds(prev => new Set(prev).add(userId));
    try {
      // Optimistic update
      setUsersState((prev) => ({
        ...prev,
        data: (prev.data || []).map((entry) => entry.uid === userId ? { ...entry, suspended: !isSuspended } : entry)
      }));
      
      await adminService.toggleUserSuspension(userId, isSuspended);
      notify(`Identity ${isSuspended ? 'restored' : 'suspended'} successfully`, 'success');
      
      // Refresh stats silently
      handleRefreshStats();
    } catch (error) {
      console.error('Failed to toggle suspension:', error);
      notify('Security protocol failure: Suspension could not be enforced', 'error');
      // Rollback
      setUsersState((prev) => ({
        ...prev,
        data: (prev.data || []).map((entry) => entry.uid === userId ? { ...entry, suspended: isSuspended } : entry)
      }));
    } finally {
      setSuspendingUserIds(prev => {
        const next = new Set(prev);
        next.delete(userId);
        return next;
      });
    }
  };

  const handleDeletePost = async (postId: string) => {
    console.log(`[Admin] SYSTEM_REQUEST: Deletion triggered for postId: "${postId}"`);
    
    if (!postId) {
      console.error('[Admin] CRITICAL_ERROR: Cannot delete post with missing ID');
      notify('Target ID invalid', 'error');
      return;
    }

    setConfirmDeletePayload(postId);
  };

  const executeDeletePost = async (postId: string) => {
    setDeletingIds(prev => new Set(prev).add(postId));
    
    try {
      console.log(`[Admin] SYSTEM_LOG: Calling adminService.deletePost for ${postId}`);
      await adminService.deletePost(postId);
      console.log(`[Admin] SYSTEM_LOG: Deletion confirmed for ${postId}`);
      
      setPostsState((prev) => ({
        ...prev,
        data: (prev.data || []).filter((entry) => entry.id !== postId)
      }));
      notify('Archive entry terminated successfully', 'success');
      
      // Delay refresh slightly to allow firestore to propagate
      setTimeout(() => handleRefreshStats(), 1000);
    } catch (error: unknown) {
      console.error(`[Admin] SYSTEM_ERROR: Termination failed for ${postId}`, error);
      notify(`Operation Failed: ${getErrorMessage(error) || 'Access Denied'}`, 'error');
    } finally {
      setDeletingIds(prev => {
        const next = new Set(prev);
        next.delete(postId);
        return next;
      });
      setConfirmDeletePayload(null);
    }
  };

  const handleDeleteUser = (userId: string) => {
    const targetUser = users.find(u => u.uid === userId);
    if (!targetUser) return;

    if (targetUser.email === 'rk.upk2345678@gmail.com') {
      notify('CRITICAL: Cannot delete Root Authority account', 'error');
      return;
    }

    const isMasterAdmin = user?.email === 'rk.upk2345678@gmail.com';

    if (targetUser.role === 'admin' && !isMasterAdmin) {
      notify('Master Clearance required to purge administrative accounts', 'error');
      return;
    }
    setConfirmDeleteUserPayload(userId);
  };

  const executeDeleteUser = async (userId: string) => {
    setDeletingUserIds(prev => new Set(prev).add(userId));
    try {
      await adminService.deleteUser(userId);
      setUsersState((prev) => ({
        ...prev,
        data: (prev.data || []).filter((entry) => entry.uid !== userId)
      }));
      notify('User identity purged from registry', 'success');
      handleRefreshStats();
    } catch (error: unknown) {
      notify(`Purge failed: ${getErrorMessage(error) || 'Access Denied'}`, 'error');
    } finally {
      setDeletingUserIds(prev => {
        const next = new Set(prev);
        next.delete(userId);
        return next;
      });
      setConfirmDeleteUserPayload(null);
    }
  };

  const isBootstrapping = !authLoading && isAdmin && [usersState.status, postsState.status, statsState.status].every((status) => status === 'idle' || status === 'loading');

  if (isBootstrapping) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="w-10 h-10 border-4 border-accent border-t-transparent rounded-full"
        />
      </div>
    );
  }

  const filteredUsers = users.filter(u => 
    u.displayName.toLowerCase().includes(searchTerm.toLowerCase()) || 
    u.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredPosts = posts.filter(p => 
    p.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.authorName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl font-black tracking-tight text-ink">Master Console</h1>
          <p className="text-ink-muted font-medium text-sm flex items-center gap-2">
            <Shield className="w-4 h-4 text-accent" />
            Global oversight and system integrity protocols.
          </p>
        </div>
        <button 
          onClick={handleRefreshStats}
          disabled={refreshing}
          className="flex items-center gap-2 px-6 py-3 bg-bg-soft border border-border rounded-2xl text-xs font-black uppercase tracking-widest hover:border-accent transition-all active:scale-95 disabled:opacity-50 cursor-pointer text-ink-muted"
        >
          <RefreshCcw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          {refreshing ? 'Synchronizing...' : 'Refresh Stats'}
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 p-1 bg-bg-soft rounded-2xl w-fit border border-border">
        {dashboardTabs.map((tab) => (
          <button 
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-6 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer capitalize ${activeTab === tab ? 'bg-card text-accent shadow-sm border border-border' : 'text-ink-muted hover:text-ink'}`}
          >
            {tab === 'users' ? 'User Registry' : tab === 'posts' ? 'Global Archive' : tab}
          </button>
        ))}
      </div>

      {activeTab === 'overview' && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-8"
        >
          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-7 gap-6">
            <StatCard icon={<Users className="w-5 h-5" />} label="Total Nodes" value={overviewStats.totalUsers ?? null} trend="+3.2%" color="bg-blue-50 text-blue-600" status={usersState.status === 'error' ? 'error' : 'ready'} />
            <StatCard icon={<FileText className="w-5 h-5" />} label="Total Dispatches" value={overviewStats.totalPosts ?? null} trend="+5.1%" color="bg-emerald-50 text-emerald-600" status={postsState.status === 'error' ? 'error' : 'ready'} />
            <StatCard icon={<Eye className="w-5 h-5" />} label="Network Reach" value={overviewStats.totalViews ?? null} trend="+12.4%" color="bg-amber-50 text-amber-600" status={postsState.status === 'error' ? 'error' : 'ready'} />
            <StatCard icon={<Activity className="w-5 h-5" />} label="Engagement" value={overviewStats.totalLikes !== null && overviewStats.totalComments !== null ? overviewStats.totalLikes + overviewStats.totalComments : null} trend="+8.2%" color="bg-rose-50 text-rose-600" status={postsState.status === 'error' ? 'error' : 'ready'} />
            <StatCard icon={<MousePointerClick className="w-5 h-5" />} label="Total Clicks" value={overviewStats.totalInteractions ?? null} trend="Live" color="bg-cyan-50 text-cyan-600" status={statsState.status === 'error' ? 'error' : 'ready'} />
            <StatCard icon={<CalendarClock className="w-5 h-5" />} label="Today Active" value={overviewStats.todayActiveUsers ?? null} trend="Today" color="bg-violet-50 text-violet-600" status={usersState.status === 'error' ? 'error' : 'ready'} />
            <StatCard icon={<Radio className="w-5 h-5" />} label="Currently Active" value={overviewStats.currentActiveUsers ?? null} trend="5 min" color="bg-lime-50 text-lime-600" status={usersState.status === 'error' ? 'error' : 'ready'} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-8">
            <SystemPulse stats={overviewStats} />

            <div className="space-y-6">
              <AnonymousActivityCard
                todayActive={anonymousState.status === 'ready' ? (anonymousState.data?.todayActive ?? 0) : null}
                currentActive={anonymousState.status === 'ready' ? (anonymousState.data?.currentActive ?? 0) : null}
                recentSessions={anonymousState.data?.recentSessions ?? 0}
                status={anonymousState.status === 'error' ? 'error' : anonymousState.status === 'loading' ? 'loading' : 'ready'}
              />
              <ActiveUserRecordsCard records={signedInActivity.records} />
              <SecurityStatusCard status={{
                users: usersState.status,
                posts: postsState.status,
                stats: statsState.status
              }} />
              <MasterCredentialsCard />
            </div>
          </div>
        </motion.div>
      )}

      {(activeTab === 'users' || activeTab === 'posts') && (
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="space-y-6"
        >
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-ink-muted" />
            <input 
              type="text"
              placeholder={`Search ${activeTab}...`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-6 py-4 bg-bg-soft border border-border rounded-2xl outline-none focus:border-accent transition-all font-medium text-sm text-ink placeholder:text-ink-muted/50"
            />
          </div>

          {activeTab === 'users' ? (
            usersState.status === 'error' && filteredUsers.length === 0 ? (
              <DataUnavailablePanel label="User registry" />
            ) : (
              <UserRegistryTable 
                users={filteredUsers} 
                onToggleSuspension={handleToggleSuspension} 
                onDeleteUser={handleDeleteUser}
                deletingUserIds={deletingUserIds}
                suspendingUserIds={suspendingUserIds}
                currentUserId={user?.uid}
              />
            )
          ) : (
            postsState.status === 'error' && filteredPosts.length === 0 ? (
              <DataUnavailablePanel label="Global archive" />
            ) : (
              <PostArchiveTable 
                posts={filteredPosts} 
                users={users} 
                deletingIds={deletingIds} 
                onDeletePost={handleDeletePost} 
                onToggleSuspension={handleToggleSuspension}
                suspendingUserIds={suspendingUserIds}
                onViewPost={onViewPost}
              />
            )
          )}

          {(activeTab === 'users' ? filteredUsers : filteredPosts).length === 0 && !((activeTab === 'users' ? usersState.status : postsState.status) === 'error') && (
            <div className="p-20 text-center opacity-30 bg-bg-soft border border-border rounded-[2rem]">
              <Search className="w-12 h-12 mx-auto mb-4 text-ink-muted" />
              <p className="text-xs font-black uppercase tracking-widest text-ink-muted">No signals found in current frequency</p>
            </div>
          )}
        </motion.div>
      )}

      <ConfirmationModal
        isOpen={!!confirmDeletePayload}
        onClose={() => setConfirmDeletePayload(null)}
        onConfirm={() => confirmDeletePayload && executeDeletePost(confirmDeletePayload)}
        title="Terminate Entry"
        message="Are you absolutely sure you want to terminate this dispatch? This action is irreversible and will remove all associated data from the Global Archive."
        confirmLabel="Execute Termination"
      />

      <ConfirmationModal
        isOpen={!!confirmDeleteUserPayload}
        onClose={() => setConfirmDeleteUserPayload(null)}
        onConfirm={() => confirmDeleteUserPayload && executeDeleteUser(confirmDeleteUserPayload)}
        title="Purge Identity"
        message="DANGER: You are about to purge this user identity from the registry. All profile data will be permanently erased. Proceed with extreme caution."
        confirmLabel="Execute Purge"
      />
    </div>
  );
};

const DataUnavailablePanel = ({ label }: { label: string }) => (
  <div className="p-20 text-center bg-bg-soft border border-border rounded-[2rem]">
    <Search className="w-12 h-12 mx-auto mb-4 text-amber-500/70" />
    <p className="text-xs font-black uppercase tracking-widest text-amber-600">{label} unavailable</p>
    <p className="mt-2 text-sm font-medium text-ink-muted">That section failed to synchronize, but the rest of the dashboard is still active.</p>
  </div>
);

const SecurityStatusCard = ({ status }: { status: { users: ResourceStatus; posts: ResourceStatus; stats: ResourceStatus } }) => (
  <div className="premium-card p-6 bg-card border border-border shadow-xl">
    <h4 className="text-xs font-black uppercase text-ink-muted tracking-widest mb-4">Security Status</h4>
    <div className="space-y-4">
      {[
        { label: 'Encryption Layer', status: 'ACTIVE', color: 'bg-emerald-500/10 text-emerald-500' },
        { label: 'Auth Protocols', status: 'STABLE', color: 'bg-emerald-500/10 text-emerald-500' },
        {
          label: 'Database Sync',
          status: [status.users, status.posts, status.stats].includes('error') ? 'DEGRADED' : 'STABLE',
          color: [status.users, status.posts, status.stats].includes('error')
            ? 'bg-amber-400/10 text-amber-600'
            : 'bg-emerald-500/10 text-emerald-500'
        },
      ].map((item) => (
        <div key={item.label} className="flex items-center justify-between">
          <span className="text-sm font-bold text-ink">{item.label}</span>
          <span className={`px-2 py-1 ${item.color} rounded text-[10px] font-black border border-current/10`}>{item.status}</span>
        </div>
      ))}
    </div>
  </div>
);

const MasterCredentialsCard = () => (
  <div className="premium-card p-6 bg-bg-soft text-ink border border-border">
    <h4 className="text-xs font-black uppercase text-ink-muted tracking-widest mb-4">Master Credentials</h4>
    <div className="p-4 bg-card rounded-xl border border-border">
      <p className="text-[10px] text-ink-muted font-bold uppercase mb-1">Authenticated As</p>
      <p className="text-sm font-black text-emerald-500 truncate">rk.upk2345678@gmail.com</p>
      <div className="mt-2 inline-flex items-center gap-1.5 px-2 py-0.5 bg-emerald-500/10 text-emerald-500 rounded text-[8px] font-black uppercase border border-emerald-500/20">
        <Shield className="w-2.5 h-2.5" /> Root Authority
      </div>
    </div>
  </div>
);
