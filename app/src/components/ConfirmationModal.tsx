import React from 'react';
import { X, AlertTriangle, AlertCircle } from 'lucide-react';

interface ConfirmationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    variant?: 'danger' | 'primary' | 'warning';
}

/**
 * ConfirmationModal Component
 * 
 * A reusable, premium floating modal for user confirmations.
 * Replaces native browser confirm().
 */
export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    confirmText = "Confirmar",
    cancelText = "Cancelar",
    variant = 'primary'
}) => {
    if (!isOpen) return null;

    const variantStyles = {
        danger: 'bg-red-500 text-white shadow-red-500/20 hover:bg-red-600',
        primary: 'bg-indigo-500 text-white shadow-indigo-500/20 hover:bg-indigo-600',
        warning: 'bg-amber-500 text-white shadow-amber-500/20 hover:bg-amber-600',
    };

    const iconStyles = {
        danger: 'bg-red-500/10 text-red-500',
        primary: 'bg-indigo-500/10 text-indigo-500',
        warning: 'bg-amber-500/10 text-amber-500',
    };

    const Icon = variant === 'danger' ? AlertTriangle : AlertCircle;

    return (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div 
                className="absolute inset-0 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300"
                onClick={onClose}
            />
            
            {/* Modal Content */}
            <div className="relative w-full max-w-md bg-white dark:bg-[#1a1818] rounded-[2.5rem] shadow-2xl border border-slate-200 dark:border-white/5 overflow-hidden animate-in zoom-in-95 fade-in duration-300">
                <div className="p-8">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-6">
                        <div className={`p-3 rounded-2xl ${iconStyles[variant]}`}>
                            <Icon size={24} />
                        </div>
                        <button 
                            onClick={onClose}
                            className="p-2 text-slate-400 hover:text-slate-600 dark:text-white/20 dark:hover:text-white transition-all"
                        >
                            <X size={20} />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="space-y-2 mb-8">
                        <h2 className="text-2xl font-black text-slate-800 dark:text-white tracking-tight">
                            {title}
                        </h2>
                        <p className="text-sm text-slate-500 dark:text-white/40 leading-relaxed font-medium">
                            {message}
                        </p>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col sm:flex-row gap-3">
                        <button 
                            onClick={onConfirm}
                            className={`flex-1 px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl transition-all active:scale-95 ${variantStyles[variant]}`}
                        >
                            {confirmText}
                        </button>
                        <button 
                            onClick={onClose}
                            className="flex-1 px-8 py-4 bg-slate-100 dark:bg-white/5 text-slate-500 dark:text-white/40 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-slate-200 dark:hover:bg-white/10 transition-all active:scale-95"
                        >
                            {cancelText}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
