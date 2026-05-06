import { useState, useEffect } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { onSnapshot, doc, getDoc, setDoc, Timestamp, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { UserProfile } from '../types';
import { handleFirestoreError, OperationType } from '../lib/firestore-utils';

export function useAuthState() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubProfile: (() => void) | undefined;

    const unsubscribe = onAuthStateChanged(auth, (authUser) => {
      setUser(authUser);
      
      if (unsubProfile) {
        unsubProfile();
        unsubProfile = undefined;
      }

      if (authUser) {
        // Initialize listener for profile
        unsubProfile = onSnapshot(doc(db, 'users', authUser.uid), async (docSnap) => {
          if (docSnap.exists()) {
            setProfile(docSnap.data() as UserProfile);
            setLoading(false);
          } else {
            console.log('Profile missing, attempting to initialize identity registry...');
            const newProfile: any = {
              uid: authUser.uid,
              displayName: authUser.displayName || 'Anonymous User',
              email: authUser.email || '',
              photoURL: authUser.photoURL || '',
              role: authUser.email === 'rk.upk2345678@gmail.com' ? 'admin' : 'user',
              suspended: false,
              createdAt: serverTimestamp()
            };
            
            // Auto-create profile in Firestore
            try {
              await setDoc(doc(db, 'users', authUser.uid), newProfile);
              console.log('Successfully initialized new identity in registry');
              // The snapshot listener will fire again with the new data
            } catch (err) {
              console.error('CRITICAL: Failed to initialize user identity:', err);
              handleFirestoreError(err, OperationType.CREATE, `users/${authUser.uid}`);
              setLoading(false);
            }
          }
        }, (err) => {
          console.error('SYSTEM: Profile sync error:', err);
          setLoading(false);
        });
      } else {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => {
      unsubscribe();
      if (unsubProfile) unsubProfile();
    };
  }, []);

  return { user, profile, loading };
}
