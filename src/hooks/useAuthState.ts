import { useState, useEffect } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { UserProfile } from '../types';
import { handleFirestoreError, OperationType } from '../lib/firestore-utils';

const ROOT_ADMIN_EMAIL = 'rk.upk2345678@gmail.com';
const PROFILE_REFRESH_INTERVAL_MS = 5 * 60 * 1000;
const ACTIVITY_SYNC_INTERVAL_MS = 4 * 60 * 1000;
const MIN_ACTIVITY_SYNC_GAP_MS = 90 * 1000;
const LAST_ACTIVITY_SYNC_KEY = 'last_activity_sync_v1';

function getTodayKey(date = new Date()): string {
  return date.toISOString().slice(0, 10);
}

function readLastActivitySync(uid: string): number {
  if (typeof window === 'undefined') return 0;
  const raw = window.sessionStorage.getItem(`${LAST_ACTIVITY_SYNC_KEY}:${uid}`);
  const parsed = raw ? Number.parseInt(raw, 10) : 0;
  return Number.isFinite(parsed) ? parsed : 0;
}

function writeLastActivitySync(uid: string, value: number) {
  if (typeof window === 'undefined') return;
  window.sessionStorage.setItem(`${LAST_ACTIVITY_SYNC_KEY}:${uid}`, String(value));
}

export function useAuthState() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const loadProfile = async (authUser: User) => {
      try {
        const profileRef = doc(db, 'users', authUser.uid);
        const docSnap = await getDoc(profileRef);

        if (cancelled) return;

        if (docSnap.exists()) {
          setProfile(docSnap.data() as UserProfile);
          setLoading(false);
          return;
        }

        const newProfile: UserProfile = {
          uid: authUser.uid,
          displayName: authUser.displayName || 'Anonymous User',
          email: authUser.email || '',
          photoURL: authUser.photoURL || '',
          bio: '',
          location: '',
          website: '',
          role: authUser.email === ROOT_ADMIN_EMAIL ? 'admin' : 'user',
          suspended: false,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          lastSeenAt: Date.now(),
          lastActiveDayKey: getTodayKey()
        };

        try {
          await setDoc(profileRef, newProfile);
          if (!cancelled) {
            setProfile(newProfile);
          }
        } catch (err) {
          if (import.meta.env.DEV) {
            console.error('CRITICAL: Failed to initialize user identity:', err);
          }
          handleFirestoreError(err, OperationType.CREATE, `users/${authUser.uid}`);
        } finally {
          if (!cancelled) {
            setLoading(false);
          }
        }
      } catch (err) {
        if (import.meta.env.DEV) {
          console.error('SYSTEM: Profile fetch error:', err);
        }
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    const unsubscribe = onAuthStateChanged(auth, (authUser) => {
      setUser(authUser);

      if (authUser) {
        setLoading(true);
        void loadProfile(authUser);
      } else {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!user) {
      return;
    }

    const refreshProfile = async () => {
      try {
        const docSnap = await getDoc(doc(db, 'users', user.uid));
        if (docSnap.exists()) {
          setProfile(docSnap.data() as UserProfile);
        }
      } catch (error) {
        if (import.meta.env.DEV) {
          console.error('SYSTEM: Periodic profile refresh failed:', error);
        }
      }
    };

    const intervalId = window.setInterval(() => {
      void refreshProfile();
    }, PROFILE_REFRESH_INTERVAL_MS);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [user?.uid]);

  useEffect(() => {
    if (!user || !profile) {
      return;
    }

    let activityWritesBlocked = false;

    const syncActivity = async (force = false) => {
      if (activityWritesBlocked) return;

      const now = Date.now();
      if (!force && now - readLastActivitySync(user.uid) < MIN_ACTIVITY_SYNC_GAP_MS) {
        return;
      }

      try {
        await setDoc(
          doc(db, 'users', user.uid),
          {
            uid: user.uid,
            displayName: profile.displayName || user.displayName || 'Anonymous User',
            email: profile.email || user.email || '',
            photoURL: profile.photoURL || user.photoURL || '',
            bio: profile.bio || '',
            role: profile.role || (user.email === ROOT_ADMIN_EMAIL ? 'admin' : 'user'),
            suspended: profile.suspended ?? false,
            createdAt: profile.createdAt ?? serverTimestamp(),
            updatedAt: serverTimestamp(),
            lastSeenAt: now,
            lastActiveDayKey: getTodayKey()
          },
          { merge: true }
        );
        writeLastActivitySync(user.uid, now);
      } catch (error) {
        if (error instanceof Error && error.message.includes('Quota exceeded')) {
          activityWritesBlocked = true;
          return;
        }
        if (import.meta.env.DEV) {
          console.error('SYSTEM: Activity sync error:', error);
        }
      }
    };

    void syncActivity(true);

    const intervalId = window.setInterval(() => {
      void syncActivity(false);
    }, ACTIVITY_SYNC_INTERVAL_MS);

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        void syncActivity(false);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.clearInterval(intervalId);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [user?.uid, user?.displayName, user?.email, user?.photoURL, profile]);

  return { user, profile, loading };
}
