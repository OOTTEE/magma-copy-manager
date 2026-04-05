import React from 'react';
import { User as UserIcon, Printer, Share2, Edit3, ShieldAlert, ShieldCheck } from 'lucide-react';

interface User {
  id: string;
  username: string;
  printUser: string;
  nexudusUser: string;
  role: string;
  a3NoPaperMode?: number;
}

interface UserCardProps {
  user: User;
  onEdit: (user: User) => void;
}

/**
 * UserCard Component
 * 
 * Grid card view for user management.
 * High visual hierarchy and mobile-friendly.
 */
export const UserCard: React.FC<UserCardProps> = ({ user, onEdit }) => {
  const isAdmin = user.role === 'admin';

  return (
    <div className="relative group bg-white dark:bg-[#1a1818] rounded-[2.5rem] p-8 border border-slate-200 dark:border-white/5 shadow-lg hover:shadow-2xl hover:shadow-indigo-500/10 transition-all duration-300">
      {/* Role Badge */}
      <div className="absolute top-6 right-6">
        {isAdmin ? (
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-500 border border-amber-500/20" title="Administrador">
                <ShieldAlert size={18} />
            </div>
        ) : (
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-500 border border-indigo-500/20" title="Cliente">
                <ShieldCheck size={18} />
            </div>
        )}
      </div>

      {/* User Header */}
      <div className="flex flex-col items-center mb-8">
        <div className="w-20 h-20 rounded-3xl bg-slate-50 dark:bg-white/5 flex items-center justify-center text-slate-400 group-hover:scale-110 group-hover:bg-indigo-500/10 group-hover:text-indigo-500 transition-all duration-500">
          <UserIcon size={40} strokeWidth={1} />
        </div>
        <h3 className="mt-4 text-xl font-black text-slate-800 dark:text-white tracking-tighter text-center">
          {user.username}
        </h3>
        <div className="flex flex-col items-center gap-1.5 mt-1">
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-white/20">
            {user.role}
          </span>
          {user.a3NoPaperMode === 1 && (
            <span className="text-[9px] font-black uppercase tracking-tighter text-[#f15a24] bg-[#f15a24]/10 px-2 py-0.5 rounded-lg border border-[#f15a24]/20 animate-pulse">
              Modo A3 Sin Papel
            </span>
          )}
        </div>
      </div>

      {/* Technical Data Section */}
      <div className="space-y-4 p-5 bg-slate-50 dark:bg-black/20 rounded-3xl border border-slate-100 dark:border-white/5 transition-colors">
        {/* Print User */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-slate-400 dark:text-white/20">
            <Printer size={16} strokeWidth={1.5} />
            <span className="text-[10px] font-black uppercase tracking-wider">Printer</span>
          </div>
          <code className="text-xs font-mono font-bold text-slate-600 dark:text-white/60">
            {user.printUser || "---"}
          </code>
        </div>

        {/* Nexudus User */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-slate-400 dark:text-white/20">
            <Share2 size={16} strokeWidth={1.5} className={user.nexudusUser ? "" : "text-red-500"} />
            <span className={user.nexudusUser ? "text-[10px] font-black uppercase tracking-wider" : "text-[10px] font-black uppercase tracking-wider text-red-500"}>Nexudus</span>
          </div>
          {user.nexudusUser ? (
            <span className="text-xs font-bold text-slate-600 dark:text-white/60 truncate max-w-[120px]">
                {user.nexudusUser}
            </span>
          ) : (
            <span className="text-[9px] font-black uppercase tracking-tighter text-red-500 bg-red-500/10 px-2 py-0.5 rounded-lg border border-red-500/20">
                Pendiente
            </span>
          )}
        </div>
      </div>

      {/* Action Section */}
      <button
        onClick={() => onEdit(user)}
        className="w-full mt-6 py-4 flex items-center justify-center gap-2 bg-[#f15a24]/10 text-[#f15a24] hover:bg-[#f15a24] hover:text-white rounded-[1.5rem] font-black text-xs uppercase tracking-widest transition-all shadow-lg shadow-[#f15a24]/5"
      >
        <Edit3 size={16} />
        Editar Usuario
      </button>
    </div>
  );
};
