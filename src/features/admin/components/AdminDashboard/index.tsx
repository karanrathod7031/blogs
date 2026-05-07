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

interface AdminDashboardProps {
  onViewPost: (slug: string) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onViewPost }) => {
  const { user } = useAuthState();
  const { notify } = useNotification();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<AppStats | null>(null);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'posts'>('overview');
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set());
  const [deletingUserIds, setDeletingUserIds] = useState<Set<string>>(new Set());
  const [suspendingUserIds, setSuspendingUserIds] = useState<Set<string>>(new Set());
  const [confirmDeletePayload, setConfirmDeletePayload] = useState<string | null>(null);
  const [confirmDeleteUserPayload, setConfirmDeleteUserPayload] = useState<string | null>(null);

  const fetchData = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const dbStats = await adminService.getAppStats();
      const allUsers = await adminService.getAllUsers();
      const allPosts = await adminService.getAllPosts();
      
      setStats(dbStats);
      setUsers(allUsers);
      setPosts(allPosts);
    } catch (error) {
      console.error('Failed to fetch admin data:', error);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleRefreshStats = async () => {
    setRefreshing(true);
    try {
      const newStats = await adminService.refreshStats();
      setStats(newStats);
    } catch (error) {
      console.error('Failed to refresh stats:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const handleToggleSuspension = async (userId: string, isSuspended: boolean) => {
    setSuspendingUserIds(prev => new Set(prev).add(userId));
    try {
      // Optimistic update
      setUsers(prev => prev.map(u => u.uid === userId ? { ...u, suspended: !isSuspended } : u));
      
      await adminService.toggleUserSuspension(userId, isSuspended);
      notify(`Identity ${isSuspended ? 'restored' : 'suspended'} successfully`, 'success');
      
      // Refresh stats silently
      handleRefreshStats();
    } catch (error) {
      console.error('Failed to toggle suspension:', error);
      notify('Security protocol failure: Suspension could not be enforced', 'error');
      // Rollback
      setUsers(prev => prev.map(u => u.uid === userId ? { ...u, suspended: isSuspended } : u));
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
      
      setPosts(prev => prev.filter(p => p.id !== postId));
      notify('Archive entry terminated successfully', 'success');
      
      // Delay refresh slightly to allow firestore to propagate
      setTimeout(() => handleRefreshStats(), 1000);
    } catch (error: any) {
      console.error(`[Admin] SYSTEM_ERROR: Termination failed for ${postId}`, error);
      notify(`Operation Failed: ${error.message || 'Access Denied'}`, 'error');
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
      setUsers(prev => prev.filter(u => u.uid !== userId));
      notify('User identity purged from registry', 'success');
      handleRefreshStats();
    } catch (error: any) {
      notify(`Purge failed: ${error.message || 'Access Denied'}`, 'error');
    } finally {
      setDeletingUserIds(prev => {
        const next = new Set(prev);
        next.delete(userId);
        return next;
      });
      setConfirmDeleteUserPayload(null);
    }
  };

  if (loading) {
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
        {['overview', 'users', 'posts'].map((tab) => (
          <button 
            key={tab}
            onClick={() => setActiveTab(tab as any)}
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
            <StatCard icon={<Users className="w-5 h-5" />} label="Total Nodes" value={stats?.totalUsers || 0} trend="+3.2%" color="bg-blue-50 text-blue-600" />
            <StatCard icon={<FileText className="w-5 h-5" />} label="Total Dispatches" value={stats?.totalPosts || 0} trend="+5.1%" color="bg-emerald-50 text-emerald-600" />
            <StatCard icon={<Eye className="w-5 h-5" />} label="Network Reach" value={stats?.totalViews || 0} trend="+12.4%" color="bg-amber-50 text-amber-600" />
            <StatCard icon={<Activity className="w-5 h-5" />} label="Engagement" value={(stats?.totalLikes || 0) + (stats?.totalComments || 0)} trend="+8.2%" color="bg-rose-50 text-rose-600" />
            <StatCard icon={<MousePointerClick className="w-5 h-5" />} label="Total Clicks" value={stats?.totalInteractions || 0} trend="Live" color="bg-cyan-50 text-cyan-600" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-8">
            <SystemPulse />

            <div className="space-y-6">
              <SecurityStatusCard />
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
            <UserRegistryTable 
              users={filteredUsers} 
              onToggleSuspension={handleToggleSuspension} 
              onDeleteUser={handleDeleteUser}
              deletingUserIds={deletingUserIds}
              suspendingUserIds={suspendingUserIds}
              currentUserId={user?.uid}
            />
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
          )}

          {(activeTab === 'users' ? filteredUsers : filteredPosts).length === 0 && (
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

const SecurityStatusCard = () => (
  <div className="premium-card p-6 bg-card border border-border shadow-xl">
    <h4 className="text-xs font-black uppercase text-ink-muted tracking-widest mb-4">Security Status</h4>
    <div className="space-y-4">
      {[
        { label: 'Encryption Layer', status: 'ACTIVE', color: 'bg-emerald-500/10 text-emerald-500' },
        { label: 'Auth Protocols', status: 'STABLE', color: 'bg-emerald-500/10 text-emerald-500' },
        { label: 'Database Sync', status: 'PENDING', color: 'bg-amber-400/10 text-amber-600' },
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
