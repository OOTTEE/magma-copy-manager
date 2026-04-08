import { X, CheckCircle2, AlertTriangle, Info, XCircle, Bell } from 'lucide-react';
import { useSystemStore } from '../../../../store/systemStore';

/**
 * NotificationCenter
 * 
 * A premium, glassmorphism-styled notification display for system alerts.
 * Persists until the user explicitly marks them as read.
 */
export const NotificationCenter = () => {
    const { notifications, markNotificationAsRead } = useSystemStore();

    if (notifications.length === 0) return null;

    return (
        <div className="fixed top-6 right-6 z-[100] w-full max-w-sm flex flex-col gap-4">
            {notifications.map((notif) => (
                <div 
                    key={notif.id}
                    className="animate-in slide-in-from-right-8 fade-in duration-500 overflow-hidden group relative"
                >
                    {/* Glassmorphism Background with variable border based on type */}
                    <div className={`
                        relative flex items-start gap-4 p-5 rounded-[1.5rem] 
                        backdrop-blur-2xl border transition-all duration-300
                        ${notif.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/20 shadow-lg shadow-emerald-500/5' : ''}
                        ${notif.type === 'error' ? 'bg-red-500/10 border-red-500/20 shadow-lg shadow-red-500/5' : ''}
                        ${notif.type === 'warning' ? 'bg-amber-500/10 border-amber-500/20 shadow-lg shadow-amber-500/5' : ''}
                        ${notif.type === 'info' ? 'bg-indigo-500/10 border-indigo-500/20 shadow-lg shadow-indigo-500/5' : ''}
                    `}>
                        {/* Status Icon */}
                        <div className={`
                            p-2 rounded-xl shrink-0
                            ${notif.type === 'success' ? 'bg-emerald-500 text-white' : ''}
                            ${notif.type === 'error' ? 'bg-red-500 text-white' : ''}
                            ${notif.type === 'warning' ? 'bg-amber-500 text-white' : ''}
                            ${notif.type === 'info' ? 'bg-indigo-500 text-white' : ''}
                        `}>
                            {notif.type === 'success' && <CheckCircle2 size={18} />}
                            {notif.type === 'error' && <XCircle size={18} />}
                            {notif.type === 'warning' && <AlertTriangle size={18} />}
                            {notif.type === 'info' && <Info size={18} />}
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0 pr-4">
                            <h4 className={`text-sm font-bold tracking-tight mb-1 truncate
                                ${notif.type === 'success' ? 'text-emerald-400' : ''}
                                ${notif.type === 'error' ? 'text-red-400' : ''}
                                ${notif.type === 'warning' ? 'text-amber-400' : ''}
                                ${notif.type === 'info' ? 'text-indigo-400' : ''}
                            `}>
                                {notif.title}
                            </h4>
                            <p className="text-xs text-slate-600 dark:text-white/60 font-medium leading-relaxed line-clamp-2">
                                {notif.message}
                            </p>
                            <span className="text-[9px] font-black uppercase tracking-[0.1em] text-slate-400 dark:text-white/20 mt-2 block">
                                {new Date(notif.createdAt).toLocaleTimeString('es-ES', { 
                                    hour: '2-digit', 
                                    minute: '2-digit' 
                                })}
                            </span>
                        </div>

                        {/* Close Action */}
                        <button 
                            onClick={() => markNotificationAsRead(notif.id)}
                            className="absolute top-4 right-4 p-1 rounded-lg hover:bg-white/5 text-slate-400 hover:text-white transition-colors"
                        >
                            <X size={14} />
                        </button>
                    </div>
                </div>
            ))}
            
            {/* Notification Badge / Summary if many */}
            {notifications.length > 2 && (
                <div className="flex justify-center">
                    <div className="px-4 py-1.5 bg-slate-900/40 backdrop-blur-md rounded-full border border-white/5 text-[9px] font-black uppercase tracking-[0.1em] text-white/40 flex items-center gap-2">
                        <Bell size={10} />
                        {notifications.length} notificaciones pendientes
                    </div>
                </div>
            )}
        </div>
    );
};
