import { collection, getDocs, doc, updateDoc, getDoc, setDoc, query, orderBy, limit, Timestamp, deleteDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { UserProfile, BlogPost, AppStats } from '../types';
import { handleFirestoreError, OperationType } from '../lib/firestore-utils';

export const adminService = {
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
      const { serverTimestamp } = await import('firebase/firestore');
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        suspended: !currentlySuspended,
        updatedAt: serverTimestamp()
      });
      console.log(`[adminService] Successfully updated suspension status for: users/${userId}`);
    } catch (error: any) {
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
    } catch (error: any) {
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
    } catch (error: any) {
      console.error(`[adminService] FAILED to delete document: posts/${postId}`, error);
      // Extra check for permission denied specifically
      if (error.code === 'permission-denied') {
        console.error('[adminService] Permission Denied. Check if your account is root admin and email is verified.');
      }
      handleFirestoreError(error, OperationType.DELETE, `posts/${postId}`);
      throw error;
    }
  },

  async getAppStats(): Promise<AppStats> {
    try {
      const statsDoc = await getDoc(doc(db, 'system', 'stats'));
      if (statsDoc.exists()) {
        return statsDoc.data() as AppStats;
      }
      
      // Initial stats if none exist
      const initialStats: AppStats = {
        totalPosts: 0,
        totalViews: 0,
        totalUsers: 0,
        totalLikes: 0,
        totalComments: 0
      };
      return initialStats;
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, 'system/stats');
    }
  },

  async refreshStats() {
    try {
      const usersSnap = await getDocs(collection(db, 'users'));
      const postsSnap = await getDocs(collection(db, 'posts'));
      
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
        totalLikes
      };

      await setDoc(doc(db, 'system', 'stats'), stats);
      return stats;
    } catch (error) {
      console.error('[AdminService] refreshStats failed:', error);
      handleFirestoreError(error, OperationType.WRITE, 'system/stats');
    }
  }
};
