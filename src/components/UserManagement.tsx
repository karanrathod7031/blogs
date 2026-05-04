import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Save, User as UserIcon, Camera, AtSign, FileText } from 'lucide-react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { UserProfile } from '../types';

interface UserManagementProps {
  onNotify: (message: string, type: 'success' | 'error') => void;
}

export function UserManagement({ onNotify }: UserManagementProps) {
  const [profile, setProfile] = useState<UserProfile>({
    uid: '',
    displayName: '',
    bio: '',
    photoURL: '',
    email: ''
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      const user = auth.currentUser;
      if (!user) return;

      try {
        const docRef = doc(db, 'users', user.uid);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          setProfile(docSnap.data() as UserProfile);
        } else {
          setProfile({
            uid: user.uid,
            displayName: user.displayName || '',
            email: user.email || '',
            bio: '',
            photoURL: user.photoURL || ''
          });
        }
      } catch (err) {
        console.error('Error fetching profile:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const user = auth.currentUser;
    if (!user) return;

    setSaving(true);
    try {
      await setDoc(doc(db, 'users', user.uid), {
        ...profile,
        updatedAt: new Date()
      });
      onNotify('Identity synchronized successfully', 'success');
    } catch (err) {
      onNotify('Failed to update identity', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <div className="flex justify-center py-20">
      <div className="w-8 h-8 border-4 border-slate-200 border-t-accent rounded-full animate-spin" />
    </div>
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-2xl mx-auto"
    >
      <form onSubmit={handleSave} className="project-card space-y-8">
        <div className="flex flex-col items-center gap-6">
          <div className="relative group">
            {profile.photoURL ? (
              <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-white shadow-clean">
                <img src={profile.photoURL} alt="" className="w-full h-full object-cover" />
              </div>
            ) : (
              <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center border-2 border-dashed border-slate-200">
                <UserIcon className="w-8 h-8 opacity-10" />
              </div>
            )}
            <div className="absolute inset-0 bg-accent/60 opacity-0 group-hover:opacity-100 rounded-full flex items-center justify-center transition-all cursor-pointer backdrop-blur-[2px]">
              <Camera className="w-6 h-6 text-white" />
            </div>
          </div>
          <div className="text-center">
            <h3 className="text-xl font-black tracking-tight">{profile.displayName || 'Unnamed Architect'}</h3>
            <p className="text-[10px] font-black uppercase tracking-widest opacity-30 mt-1">{profile.email}</p>
          </div>
        </div>

        <div className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest opacity-40">
                <UserIcon className="w-3 h-3" /> User Alias
              </label>
              <input 
                type="text"
                value={profile.displayName}
                onChange={e => setProfile({...profile, displayName: e.target.value})}
                className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-sm font-bold focus:bg-white focus:border-accent outline-none transition-all"
                placeholder="Ex. Karan Rathod"
              />
            </div>
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest opacity-40">
                <AtSign className="w-3 h-3" /> Image URL
              </label>
              <input 
                type="text"
                value={profile.photoURL}
                onChange={e => setProfile({...profile, photoURL: e.target.value})}
                className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-sm font-bold focus:bg-white focus:border-accent outline-none transition-all"
                placeholder="https://..."
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest opacity-40">
              <FileText className="w-3 h-3" /> Professional Bio
            </label>
            <textarea 
              value={profile.bio}
              onChange={e => setProfile({...profile, bio: e.target.value})}
              rows={4}
              className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-4 py-3 text-sm font-bold focus:bg-white focus:border-accent outline-none transition-all resize-none"
              placeholder="Curator of digital narratives..."
            />
          </div>
        </div>

        <button 
          type="submit"
          disabled={saving}
          className="w-full flex items-center justify-center gap-3 bg-ink text-white py-4 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-accent transition-all active:scale-95 disabled:opacity-50 shadow-xl shadow-accent/10"
        >
          {saving ? (
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <>
              <Save className="w-4 h-4" />
              Synchronize Identity
            </>
          )}
        </button>
      </form>
    </motion.div>
  );
}
