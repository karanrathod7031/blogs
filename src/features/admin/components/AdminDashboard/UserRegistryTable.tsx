import React from 'react';
import { Shield, Ban, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { Timestamp } from 'firebase/firestore';
import { UserProfile } from '../../../../types';

interface UserRegistryTableProps {
  users: UserProfile[];
  onToggleSuspension: (userId: string, isSuspended: boolean) => Promise<void>;
  onDeleteUser: (userId: string) => void;
  deletingUserIds: Set<string>;
  suspendingUserIds: Set<string>;
  currentUserId?: string;
}

export const UserRegistryTable: React.FC<UserRegistryTableProps> = ({ 
  users, 
  onToggleSuspension,
  onDeleteUser,
  deletingUserIds,
  suspendingUserIds,
  currentUserId
}) => {
  return (
    <div className="bg-card border border-border rounded-[2rem] overflow-hidden shadow-xl">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="bg-bg-soft border-b border-border">
            <th className="px-8 py-5 text-[10px] font-black uppercase text-ink-muted tracking-widest">Node Identity</th>
            <th className="px-8 py-5 text-[10px] font-black uppercase text-ink-muted tracking-widest">Role / Status</th>
            <th className="px-8 py-5 text-[10px] font-black uppercase text-ink-muted tracking-widest">Linked Since</th>
            <th className="px-8 py-5 text-[10px] font-black uppercase text-ink-muted tracking-widest text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {users.map(user => (
            <tr key={user.uid} className="hover:bg-bg-soft transition-colors">
              <td className="px-8 py-4">
                <div className="flex items-center gap-3">
                  {user.photoURL ? (
                    <img src={user.photoURL} className="w-10 h-10 rounded-full border border-border" referrerPolicy="no-referrer" loading="lazy" />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-bg-soft border border-border flex items-center justify-center font-bold text-ink-muted text-xs text-center leading-[40px]">
                      {user.displayName.charAt(0)}
                    </div>
                  )}
                  <div>
                    <p className="text-sm font-black text-ink">{user.displayName}</p>
                    <p className="text-[10px] font-bold text-ink-muted">{user.email}</p>
                  </div>
                </div>
              </td>
              <td className="px-8 py-4">
                <div className="flex gap-2">
                  <span className={`px-2 py-1 rounded-lg border text-[10px] font-black uppercase ${user.role === 'admin' ? 'bg-accent/10 text-accent border-accent/10' : 'bg-bg-soft text-ink-muted border-border'}`}>
                    {user.role}
                  </span>
                  {user.suspended && (
                    <span className="px-2 py-1 bg-rose-500/10 text-rose-500 rounded-lg border border-rose-500/10 text-[10px] font-black uppercase">Suspended</span>
                  )}
                </div>
              </td>
              <td className="px-8 py-4 text-xs font-bold text-ink-muted">
                {user.createdAt ? (
                  user.createdAt instanceof Timestamp ? format(user.createdAt.toDate(), 'MMM d, yyyy') : 'Recently Linked'
                ) : 'N/A'}
              </td>
              <td className="px-8 py-4 text-right">
                <div className="flex justify-end gap-2">
                  <button 
                    onClick={() => onToggleSuspension(user.uid, user.suspended || false)}
                    disabled={user.email === 'rk.upk2345678@gmail.com' || user.uid === currentUserId || suspendingUserIds.has(user.uid)}
                    className={`p-2 rounded-xl border transition-all cursor-pointer ${user.suspended ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/10' : 'bg-rose-500/10 text-rose-500 border-rose-500/10'} disabled:opacity-30 disabled:cursor-not-allowed`}
                    title={user.email === 'rk.upk2345678@gmail.com' ? 'Root Authority - Immutable' : (user.suspended ? 'Restore Access' : 'Suspend Access')}
                  >
                    {suspendingUserIds.has(user.uid) ? (
                      <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    ) : user.suspended ? (
                      <Shield className="w-4 h-4" />
                    ) : (
                      <Ban className="w-4 h-4" />
                    )}
                  </button>
                  <button 
                    onClick={() => onDeleteUser(user.uid)}
                    disabled={
                      deletingUserIds.has(user.uid) || 
                      user.email === 'rk.upk2345678@gmail.com' || 
                      user.uid === currentUserId ||
                      (user.role === 'admin' && users.find(u => u.uid === currentUserId)?.email !== 'rk.upk2345678@gmail.com')
                    }
                    className="p-2 bg-rose-500/10 text-rose-500 border border-rose-500/10 rounded-xl hover:bg-rose-500/20 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    title={user.email === 'rk.upk2345678@gmail.com' ? 'Root Authority - Protected' : 'Purge Identity'}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
