import React, { useEffect } from 'react';
import { useUserStore } from '../../../store/userStore';
import { User, Mail, Loader2 } from 'lucide-react';

interface NexudusAccountBadgeProps {
  nexudusUserId: string;
  className?: string;
  hideEmail?: boolean;
}

/**
 * NexudusAccountBadge
 * 
 * Reusable component to display Nexudus account info (Name, Email) instead of technical IDs.
 * Handles automatic data fetching and caching via UserStore.
 */
export const NexudusAccountBadge: React.FC<NexudusAccountBadgeProps> = ({ 
  nexudusUserId, 
  className = "",
  hideEmail = false
}) => {
  const { coworkers, fetchCoworkerById } = useUserStore();
  
  // Find coworker in store cache
  const coworker = coworkers.find(c => c.id?.toString() === nexudusUserId);

  useEffect(() => {
    if (nexudusUserId && !coworker) {
      fetchCoworkerById(nexudusUserId);
    }
  }, [nexudusUserId, coworker, fetchCoworkerById]);

  if (!nexudusUserId) return null;

  if (!coworker) {
    return (
      <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/5 animate-pulse ${className}`}>
        <Loader2 size={14} className="animate-spin text-slate-400" />
        <span className="text-[10px] font-bold text-slate-400 dark:text-white/20 uppercase tracking-wider">
          Cargando cuenta...
        </span>
        <code className="text-[9px] opacity-30">ID: {nexudusUserId}</code>
      </div>
    );
  }

  return (
    <div className={`inline-flex flex-col gap-0.5 min-w-0 ${className}`}>
      <div className="flex items-center gap-2">
        <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-500">
          <User size={14} strokeWidth={2} />
        </div>
        <div className="flex flex-col min-w-0">
          <span className="text-sm font-bold text-slate-700 dark:text-white/80 truncate leading-tight">
            {coworker.fullName || "Sin nombre"}
          </span>
          {!hideEmail && coworker.email && (
            <div className="flex items-center gap-1.5 text-slate-400 dark:text-white/20">
              <Mail size={10} />
              <span className="text-[11px] font-medium truncate">
                {coworker.email}
              </span>
            </div>
          )}
        </div>
      </div>
      <code className="text-[9px] font-mono text-slate-300 dark:text-white/10 ml-10">
        ID: {nexudusUserId}
      </code>
    </div>
  );
};
