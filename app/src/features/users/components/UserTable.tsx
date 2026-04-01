import React from 'react';
import { User as UserIcon, Printer, Share2, Edit3 } from 'lucide-react';

interface User {
  id: string;
  username: string;
  printUser: string;
  nexudusUser: string;
  role: string;
}

interface UserTableProps {
  users: User[];
  onEdit: (user: User) => void;
}

/**
 * UserTable Component
 * 
 * Tabular view for user management.
 * Shows essential technical fields and actions.
 */
export const UserTable: React.FC<UserTableProps> = ({ users, onEdit }) => {
  return (
    <div className="overflow-hidden bg-white dark:bg-[#1a1818] rounded-[2rem] border border-slate-200 dark:border-white/5 shadow-xl transition-all">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="border-b border-slate-100 dark:border-white/5">
            <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-white/20">Usuario</th>
            <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-white/20">Impresora (Print)</th>
            <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-white/20">Nexudus</th>
            <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-white/20">Rol</th>
            <th className="px-8 py-6 text-right text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-white/20">Acciones</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-50 dark:divide-white/5">
          {users.map((user) => (
            <tr key={user.id} className="group hover:bg-slate-50/50 dark:hover:bg-white/5 transition-colors">
              <td className="px-8 py-5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-500">
                    <UserIcon size={20} strokeWidth={1.5} />
                  </div>
                  <span className="font-bold text-slate-700 dark:text-white/80">{user.username}</span>
                </div>
              </td>
              <td className="px-8 py-5">
                <div className="flex items-center gap-2 text-slate-500 dark:text-white/40">
                  <Printer size={16} strokeWidth={1.5} />
                  <code className="text-xs font-mono bg-slate-100 dark:bg-white/5 px-2 py-1 rounded-md text-slate-600 dark:text-white/60">
                    {user.printUser || "No asignado"}
                  </code>
                </div>
              </td>
              <td className="px-8 py-5">
                <div className="flex items-center gap-2 text-slate-500 dark:text-white/40">
                  <Share2 size={16} strokeWidth={1.5} />
                  <span className="text-sm font-medium">{user.nexudusUser || "Sin vincular"}</span>
                </div>
              </td>
              <td className="px-8 py-5">
                <span className={`
                  px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider
                  ${user.role === 'admin' 
                    ? "bg-amber-500/10 text-amber-500 border border-amber-500/20" 
                    : "bg-indigo-500/10 text-indigo-500 border border-indigo-500/20"
                  }
                `}>
                  {user.role}
                </span>
              </td>
              <td className="px-8 py-5 text-right">
                <button 
                  onClick={() => onEdit(user)}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#f15a24]/10 text-[#f15a24] hover:bg-[#f15a24] hover:text-white font-bold text-xs transition-all"
                >
                  <Edit3 size={14} />
                  Editar
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
