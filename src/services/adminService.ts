import { collection, getDocs, doc, updateDoc, getDoc, setDoc, query, orderBy, limit, deleteDoc, serverTimestamp, where } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { UserProfile, BlogPost, AppStats } from '../types';
import { handleFirestoreError, OperationType } from '../lib/firestore-utils';

const PRESENCE_COLLECTION_NAME = 'presence';
const ACTIVE_USER_WINDOW_MS = 5 * 60 * 1000;

export interface ActiveUserRecord {
  uid: string;
  displayName: string;
  email: string;
  role: 'user' | 'admin';
  lastSeenAt: number;
}

function createEmptyStats(): AppStats {
  return {
    totalPosts: 0,
    totalViews: 0,
    totalUsers: 0,
    totalLikes: 0,
    totalComments: 0,
    totalInteractions: 0,
    todayActiveUsers: 0,
    currentActiveUsers: 0
  };
}

function getTodayKey(date = new Date()): string {
  return date.toISOString().slice(0, 10);
}

function hasErrorCode(error: unknown, code: string): boolean {
  return typeof error === 'object'
    && error !== null
    && 'code' in error
    && (error as { code?: string }).code === code;
}

async function getPresenceStats() {
  try {
    const [todayUserResult, currentUserResult] = await Promise.allSettled([
      getDocs(
        query(collection(db, 'users'), where('lastActiveDayKey', '==', getTodayKey()))
      ),
      getDocs(
        query(
          collection(db, 'users'),
          where('lastSeenAt', '>=', Date.now() - ACTIVE_USER_WINDOW_MS)
        )
      )
    ]);

    if (todayUserResult.status === 'fulfilled' || currentUserResult.status === 'fulfilled') {
      return {
        todayActiveUsers: todayUserResult.status === 'fulfilled' ? todayUserResult.value.size : 0,
        currentActiveUsers: currentUserResult.status === 'fulfilled' ? currentUserResult.value.size : 0
      };
    }

    const [todayPresenceResult, currentPresenceResult] = await Promise.allSettled([
      getDocs(
        query(collection(db, PRESENCE_COLLECTION_NAME), where('dayKey', '==', getTodayKey()))
      ),
      getDocs(
        query(
          collection(db, PRESENCE_COLLECTION_NAME),
          where('lastSeenAt', '>=', Date.now() - ACTIVE_USER_WINDOW_MS)
        )
      )
    ]);

    return {
      todayActiveUsers: todayPresenceResult.status === 'fulfilled' ? todayPresenceResult.value.size : 0,
      currentActiveUsers: currentPresenceResult.status === 'fulfilled' ? currentPresenceResult.value.size : 0
    };
  } catch {
    return {
      todayActiveUsers: 0,
      currentActiveUsers: 0
    };
  }
}

export const adminService = {
  async getRecentActiveUsers(): Promise<ActiveUserRecord[]> {
    try {
      const snapshot = await getDocs(
        query(
          collection(db, 'users'),
          where('lastSeenAt', '>=', Date.now() - (24 * 60 * 60 * 1000)),
          orderBy('lastSeenAt', 'desc'),
          limit(6)
        )
      );

      return snapshot.docs
        .map((entry) => ({ uid: entry.id, ...entry.data() } as UserProfile))
        .filter((entry) => typeof entry.lastSeenAt === 'number')
        .map((entry) => ({
          uid: entry.uid,
          displayName: entry.displayName,
          email: entry.email,
          role: entry.role,
          lastSeenAt: entry.lastSeenAt as number
        }));
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, 'users');
    }
  },

  async getAnonymousActivityStats() {
    try {
      const snapshot = await getDocs(query(collection(db, PRESENCE_COLLECTION_NAME), limit(250)));
      const todayKey = getTodayKey();
      const activeThreshold = Date.now() - ACTIVE_USER_WINDOW_MS;

      const anonymousSessions = snapshot.docs
        .map(doc => doc.data() as { userId?: string | null; dayKey?: string; lastSeenAt?: number })
        .filter(entry => !entry.userId);

      return {
        todayActive: anonymousSessions.filter(entry => entry.dayKey === todayKey).length,
        currentActive: anonymousSessions.filter(entry => typeof entry.lastSeenAt === 'number' && entry.lastSeenAt >= activeThreshold).length,
        recentSessions: anonymousSessions.length
      };
    } catch {
      return null;
    }
  },

  async getAllUsers(): Promise<UserProfile[]> {
    try {
      const q = query(collection(db, 'users'), limit(100)); // Limit for performance
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() } as UserProfile));
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, 'users');
    }
  },

  async getAllPosts(): Promise<BlogPost[]> {
    try {
      const q = query(collection(db, 'posts'), orderBy('createdAt', 'desc'), limit(100));
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as BlogPost));
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, 'posts');
    }
  },

  async toggleUserSuspension(userId: string, currentlySuspended: boolean) {
    console.log(`[adminService] Toggling suspension for: users/${userId} to ${!currentlySuspended}`);
    try {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        suspended: !currentlySuspended,
        updatedAt: serverTimestamp()
      });
      console.log(`[adminService] Successfully updated suspension status for: users/${userId}`);
    } catch (error: unknown) {
      console.error(`[adminService] FAILED to toggle suspension for: users/${userId}`, error);
      handleFirestoreError(error, OperationType.UPDATE, `users/${userId}`);
      throw error;
    }
  },

  async deleteUser(userId: string) {
    console.log(`[adminService] Attempting to delete user metadata: users/${userId}`);
    try {
      const userRef = doc(db, 'users', userId);
      await deleteDoc(userRef);
      console.log(`[adminService] Successfully purged user: users/${userId}`);
    } catch (error: unknown) {
      console.error(`[adminService] FAILED to delete user: users/${userId}`, error);
      handleFirestoreError(error, OperationType.DELETE, `users/${userId}`);
      throw error;
    }
  },

  async deletePost(postId: string) {
    console.log(`[adminService] Attempting to delete document: posts/${postId}`);
    try {
      const postRef = doc(db, 'posts', postId);
      await deleteDoc(postRef);
      console.log(`[adminService] Successfully deleted document: posts/${postId}`);
    } catch (error: unknown) {
      console.error(`[adminService] FAILED to delete document: posts/${postId}`, error);
      // Extra check for permission denied specifically
      if (hasErrorCode(error, 'permission-denied')) {
        console.error('[adminService] Permission Denied. Check if your account is root admin and email is verified.');
      }
      handleFirestoreError(error, OperationType.DELETE, `posts/${postId}`);
      throw error;
    }
  },

  async getAppStats(): Promise<AppStats> {
    try {
      const [presenceStats, statsDocResult] = await Promise.allSettled([
        getPresenceStats(),
        getDoc(doc(db, 'system', 'stats'))
      ]);

      const safePresenceStats = presenceStats.status === 'fulfilled'
        ? presenceStats.value
        : { todayActiveUsers: 0, currentActiveUsers: 0 };

      if (statsDocResult.status === 'fulfilled' && statsDocResult.value.exists()) {
        return {
          ...createEmptyStats(),
          ...(statsDocResult.value.data() as Partial<AppStats>),
          ...safePresenceStats
        };
      }

      if (statsDocResult.status === 'fulfilled') {
        return {
          ...createEmptyStats(),
          ...safePresenceStats
        };
      }

      return {
        ...createEmptyStats(),
        ...safePresenceStats
      };
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, 'system/stats');
    }
  },

  async refreshStats() {
    try {
      const statsRef = doc(db, 'system', 'stats');
      const [usersSnap, postsSnap, existingStatsResult, presenceStats] = await Promise.all([
        getDocs(collection(db, 'users')),
        getDocs(collection(db, 'posts')),
        getDoc(statsRef).catch(() => null),
        getPresenceStats()
      ]);
      
      let totalViews = 0;
      let totalLikes = 0;
      
      postsSnap.docs.forEach(doc => {
        const data = doc.data() as BlogPost;
        totalViews += data.viewCount || 0;
        totalLikes += data.likeCount || 0;
      });

      const stats: AppStats = {
        totalUsers: usersSnap.size,
        totalPosts: postsSnap.size,
        totalComments: 0, // Simplified or separate fetch
        totalViews,
        totalLikes,
        totalInteractions: existingStatsResult?.exists()
          ? (existingStatsResult.data().totalInteractions as number | undefined) || 0
          : 0,
        todayActiveUsers: presenceStats.todayActiveUsers,
        currentActiveUsers: presenceStats.currentActiveUsers
      };

      await setDoc(statsRef, stats);
      return stats;
    } catch (error) {
      console.error('[AdminService] refreshStats failed:', error);
      handleFirestoreError(error, OperationType.WRITE, 'system/stats');
    }
  }
};
