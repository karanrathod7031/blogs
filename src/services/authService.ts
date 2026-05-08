import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signOut as firebaseSignOut, 
  onAuthStateChanged,
  User
} from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp, WithFieldValue } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { UserProfile } from '../types';

import { handleFirestoreError, OperationType } from '../lib/firestore-utils';

const auth = getAuth();
const googleProvider = new GoogleAuthProvider();

export const authService = {
  async signInWithGoogle(): Promise<User> {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      try {
        await this.syncUserProfile(result.user);
      } catch (profileSyncError) {
        if (import.meta.env.DEV) {
          console.error('Profile sync failed after successful sign-in:', profileSyncError);
        }
      }
      return result.user;
    } catch (error) {
      console.error('Auth error:', error);
      throw error;
    }
  },

  async signOut(): Promise<void> {
    return firebaseSignOut(auth);
  },

  onAuthChange(callback: (user: User | null) => void) {
    return onAuthStateChanged(auth, callback);
  },

  async getUserProfile(uid: string): Promise<UserProfile | null> {
    try {
      const docRef = doc(db, 'users', uid);
      const docSnap = await getDoc(docRef);
      return docSnap.exists() ? (docSnap.data() as UserProfile) : null;
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, `users/${uid}`);
    }
  },

  async syncUserProfile(user: User): Promise<void> {
    const userRef = doc(db, 'users', user.uid);
    const role: UserProfile['role'] = user.email === 'rk.upk2345678@gmail.com' ? 'admin' : 'user';
    const activityDayKey = new Date().toISOString().slice(0, 10);
    try {
      const userSnap = await getDoc(userRef);

      if (!userSnap.exists()) {
        const newUser: WithFieldValue<UserProfile> = {
          uid: user.uid,
          displayName: user.displayName || 'Anonymous User',
          email: user.email || '',
          photoURL: user.photoURL || '',
          role,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          bio: '',
          suspended: false,
          lastSeenAt: Date.now(),
          lastActiveDayKey: activityDayKey
        };
        await setDoc(userRef, newUser);
      } else {
        const existingUserUpdate: WithFieldValue<UserProfile> = {
          uid: user.uid,
          displayName: user.displayName || 'Anonymous User',
          email: user.email || '',
          photoURL: user.photoURL || '',
          role,
          updatedAt: serverTimestamp(),
          lastSeenAt: Date.now(),
          lastActiveDayKey: activityDayKey
        };
        await setDoc(userRef, existingUserUpdate, { merge: true });
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `users/${user.uid}`);
    }
  }
};
