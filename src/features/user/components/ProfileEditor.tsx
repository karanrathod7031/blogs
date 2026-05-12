import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Save, User as UserIcon, Camera, FileText, Upload, Eye, X } from 'lucide-react';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '../../../lib/firebase';
import { UserProfile } from '../../../types';
import { handleFirestoreError, OperationType } from '../../../lib/firestore-utils';

interface ProfileEditorProps {
  onNotify: (message: string, type: 'success' | 'error') => void;
}

export function ProfileEditor({ onNotify }: ProfileEditorProps) {
  const [profile, setProfile] = useState<UserProfile>({
    uid: '',
    displayName: '',
    bio: '',
    photoURL: '',
    email: '',
    role: 'user'
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showFullImage, setShowFullImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleDPUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        onNotify('Image file is too large. Please select an image under 5MB.', 'error');
        return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          // Square target for DP
          const SIZE = 400;
          
          canvas.width = SIZE;
          canvas.height = SIZE;
          const ctx = canvas.getContext('2d');
          
          // Center crop to square
          const minDim = Math.min(width, height);
          const sx = (width - minDim) / 2;
          const sy = (height - minDim) / 2;
          
          ctx?.drawImage(img, sx, sy, minDim, minDim, 0, 0, SIZE, SIZE);

          const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
          setProfile(prev => ({ ...prev, photoURL: dataUrl }));
        };
        img.src = event.target?.result as string;
      };
      reader.readAsDataURL(file);
    }
  };

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
            photoURL: user.photoURL || '',
            role: 'user'
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
        updatedAt: serverTimestamp()
      });
      onNotify('Identity synchronized successfully', 'success');
    } catch (err) {
      console.error('Failed to update identity:', err);
      handleFirestoreError(err, OperationType.UPDATE, `users/${user.uid}`);
      onNotify('Failed to update identity', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <div className="flex justify-center py-20">
      <div className="w-8 h-8 border-4 border-bg-soft border-t-accent rounded-full animate-spin" />
    </div>
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-2xl mx-auto"
    >
      <form onSubmit={handleSave} className="space-y-8 bg-transparent py-8">
        <div className="flex flex-col items-center gap-6">
          <div className="relative" ref={menuRef}>
            <div 
              className="relative group cursor-pointer"
              onClick={() => setShowMenu(!showMenu)}
            >
              {profile.photoURL ? (
                <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-bg shadow-clean transition-transform hover:scale-105 active:scale-95">
                  <img src={profile.photoURL} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" loading="lazy" />
                </div>
              ) : (
                <div className="w-24 h-24 bg-bg-soft rounded-full flex items-center justify-center border-2 border-dashed border-border hover:bg-card transition-all active:scale-95">
                  <UserIcon className="w-8 h-8 opacity-10 text-ink" />
                </div>
              )}
              <div className="absolute inset-0 bg-ink/5 opacity-0 group-hover:opacity-100 rounded-full flex items-center justify-center transition-all">
                <div className="bg-bg/80 p-2 rounded-full shadow-lg border border-border">
                  <Camera className="w-5 h-5 text-accent" />
                </div>
              </div>
            </div>

            <AnimatePresence>
              {showMenu && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9, y: 10 }}
                  className="absolute top-full left-1/2 -translate-x-1/2 mt-3 w-48 bg-card rounded-2xl shadow-2xl border border-border py-2 z-50 overflow-hidden"
                >
                  <button
                    type="button"
                    onClick={() => {
                      if (profile.photoURL) setShowFullImage(true);
                      setShowMenu(false);
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3 text-[10px] font-black uppercase tracking-widest text-ink-muted hover:bg-bg-soft transition-colors"
                  >
                    <Eye className="w-4 h-4 text-accent" /> View Profile
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      fileInputRef.current?.click();
                      setShowMenu(false);
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3 text-[10px] font-black uppercase tracking-widest text-ink-muted hover:bg-bg-soft transition-colors"
                  >
                    <Upload className="w-4 h-4 text-purple-500" /> Change Profile
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            <input 
              type="file"
              ref={fileInputRef}
              onChange={handleDPUpload}
              accept="image/*"
              className="hidden"
            />
          </div>
          <div className="text-center">
            <h3 className="text-xl font-black tracking-tight text-ink">{profile.displayName || 'Unnamed Architect'}</h3>
            <p className="text-[10px] font-black uppercase tracking-widest text-ink-muted/50 mt-1">{profile.email}</p>
          </div>
        </div>

        <div className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-ink-muted/60">
                <UserIcon className="w-3 h-3 text-accent" /> User Alias
              </label>
              <input 
                type="text"
                value={profile.displayName}
                onChange={e => setProfile({...profile, displayName: e.target.value})}
                className="w-full bg-bg border border-border rounded-xl px-4 py-3 text-sm font-bold focus:bg-bg-soft focus:border-accent outline-none transition-all text-ink placeholder:text-ink-muted/30"
                placeholder="Ex. Karan Rathod"
              />
            </div>
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-ink-muted/60">
                <Upload className="w-3 h-3 text-accent" /> Identity Photo
              </label>
              <div className="flex gap-2">
                <input 
                  type="text"
                  value={profile.photoURL}
                  onChange={e => setProfile({...profile, photoURL: e.target.value})}
                  className="flex-1 bg-bg border border-border rounded-xl px-4 py-3 text-sm font-bold focus:bg-bg-soft focus:border-accent outline-none transition-all text-ink placeholder:text-ink-muted/30"
                  placeholder="Paste URL or click avatar to upload"
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-ink-muted/60">
              <FileText className="w-3 h-3 text-accent" /> Professional Bio
            </label>
            <textarea 
              value={profile.bio}
              onChange={e => setProfile({...profile, bio: e.target.value})}
              rows={4}
              className="w-full bg-bg border border-border rounded-2xl px-4 py-3 text-sm font-bold focus:bg-bg-soft focus:border-accent outline-none transition-all resize-none text-ink placeholder:text-ink-muted/30"
              placeholder="Curator of digital narratives..."
            />
          </div>
        </div>

        <button 
          type="submit"
          disabled={saving}
          className="w-full flex items-center justify-center gap-3 bg-accent text-slate-900 py-4 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-accent/90 transition-all active:scale-95 disabled:opacity-50 shadow-xl shadow-accent/10"
        >
          {saving ? (
            <div className="w-4 h-4 border-2 border-slate-900/30 border-t-slate-900 rounded-full animate-spin" />
          ) : (
            <>
              <Save className="w-4 h-4" />
              Synchronize Identity
            </>
          )}
        </button>
      </form>

      {/* Full Image Viewer */}
      <AnimatePresence>
        {showFullImage && profile.photoURL && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-bg/90 p-4 backdrop-blur-md"
            onClick={() => setShowFullImage(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative max-w-2xl w-full"
              onClick={e => e.stopPropagation()}
            >
              <button
                onClick={() => setShowFullImage(false)}
                className="absolute -top-12 right-0 p-2 text-ink-muted hover:text-ink transition-colors"
                title="Close viewer"
              >
                <X className="w-8 h-8" />
              </button>
              <div className="aspect-square bg-bg-soft rounded-3xl overflow-hidden shadow-2xl border-4 border-border">
                <img 
                  src={profile.photoURL} 
                  alt={profile.displayName} 
                  className="w-full h-full object-contain" 
                  referrerPolicy="no-referrer"
                  loading="lazy"
                />
              </div>
              <div className="mt-4 text-center">
                <h3 className="text-ink text-xl font-black italic">{profile.displayName}</h3>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
