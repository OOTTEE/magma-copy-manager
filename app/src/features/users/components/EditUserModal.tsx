import React, { useState } from 'react';
import { X, User, Printer, Share2, Lock, Save, Loader2, Eye, EyeOff } from 'lucide-react';

interface User {
  id: string;
  username: string;
  printUser: string;
  nexudusUser: string;
  role: string;
  a3NoPaperMode?: number;
}

interface EditUserModalProps {
  user: User;
  onClose: () => void;
  onSave: (updatedData: { 
    username?: string; 
    printUser?: string; 
    nexudusUser?: string; 
    password?: string;
    a3NoPaperMode?: number;
  }) => Promise<void>;
}

/**
 * EditUserModal Component
 * 
 * Floating panel (Glassmorphism) for safe user editing.
 * Security: Password is write-only with verification and visibility toggle.
 */
export const EditUserModal: React.FC<EditUserModalProps> = ({ user, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    username: user.username,
    printUser: user.printUser,
    nexudusUser: user.nexudusUser,
    a3NoPaperMode: user.a3NoPaperMode || 0,
    password: '', 
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Password validation
    if (formData.password && formData.password !== formData.confirmPassword) {
      setError("Las contraseñas no coinciden");
      return;
    }

    setIsSaving(true);

    try {
      const dataToSave: any = { 
        username: formData.username,
        printUser: formData.printUser,
        nexudusUser: formData.nexudusUser,
        a3NoPaperMode: formData.a3NoPaperMode
      };
      
      if (formData.password) {
        dataToSave.password = formData.password;
      }

      await onSave(dataToSave);
      onClose();
    } catch (err) {
      setError("Error al actualizar el usuario. Inténtalo de nuevo.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300"
        onClick={onClose}
      />

      {/* Modal Content */}
      <div className="relative w-full max-w-xl bg-white dark:bg-[#1a1818] rounded-[3rem] shadow-2xl border border-white/20 overflow-hidden animate-in zoom-in-95 fade-in duration-300">
        {/* Header */}
        <div className="px-10 py-8 border-b border-slate-100 dark:border-white/5 flex items-center justify-between bg-slate-50/50 dark:bg-black/20">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-2xl bg-[#f15a24] text-white shadow-lg shadow-[#f15a24]/30">
              <Edit3 size={24} strokeWidth={1.5} />
            </div>
            <div>
              <h3 className="text-xl font-black text-slate-800 dark:text-white tracking-tighter">
                Configuración Técnica
              </h3>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-white/20 mt-1">
                ID: {user.id}
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-3 text-slate-400 hover:text-slate-600 dark:text-white/20 dark:hover:text-white rounded-2xl bg-white dark:bg-white/5 shadow-sm hover:shadow-md transition-all"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-10 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Username */}
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-[#f15a24] ml-2">Nombre de Usuario</label>
              <div className="relative group">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 dark:text-white/10 group-focus-within:text-[#f15a24] transition-colors" size={18} strokeWidth={1.5} />
                <input
                  type="text"
                  value={formData.username}
                  onChange={(e) => setFormData({...formData, username: e.target.value})}
                  className="w-full pl-12 pr-6 py-4 bg-slate-100 dark:bg-white/5 border border-transparent focus:border-[#f15a24]/30 rounded-2xl text-sm font-bold text-slate-700 dark:text-white outline-none transition-all"
                  required
                />
              </div>
            </div>

            {/* Print User */}
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-[#f15a24] ml-2">Usuario Impresión</label>
              <div className="relative group">
                <Printer className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 dark:text-white/10 group-focus-within:text-[#f15a24] transition-colors" size={18} strokeWidth={1.5} />
                <input
                  type="text"
                  value={formData.printUser}
                  onChange={(e) => setFormData({...formData, printUser: e.target.value})}
                  className="w-full pl-12 pr-6 py-4 bg-slate-100 dark:bg-white/5 border border-transparent focus:border-[#f15a24]/30 rounded-2xl text-sm font-bold text-slate-700 dark:text-white outline-none transition-all"
                  required
                />
              </div>
            </div>

            {/* Nexudus User */}
            <div className="md:col-span-2 space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-[#f15a24] ml-2">ID Nexudus</label>
              <div className="relative group">
                <Share2 className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 dark:text-white/10 group-focus-within:text-[#f15a24] transition-colors" size={18} strokeWidth={1.5} />
                <input
                  type="text"
                  value={formData.nexudusUser}
                  onChange={(e) => setFormData({...formData, nexudusUser: e.target.value})}
                  className="w-full pl-12 pr-6 py-4 bg-slate-100 dark:bg-white/5 border border-transparent focus:border-[#f15a24]/30 rounded-2xl text-sm font-bold text-slate-700 dark:text-white outline-none transition-all"
                />
              </div>
            </div>

            {/* A3 No Paper Toggle - Premium Style */}
            <div className="md:col-span-2 p-6 rounded-3xl bg-slate-50 dark:bg-black/20 border border-slate-100 dark:border-white/5 flex items-center justify-between group hover:border-[#f15a24]/20 transition-all">
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-2xl transition-colors ${formData.a3NoPaperMode ? 'bg-[#f15a24]/10 text-[#f15a24]' : 'bg-slate-200 dark:bg-white/5 text-slate-400'}`}>
                  <FileTextIcon size={20} />
                </div>
                <div>
                  <p className="text-sm font-black text-slate-700 dark:text-white tracking-tight">Modo A3 Sin Papel</p>
                  <p className="text-[10px] font-medium text-slate-400 dark:text-white/20">Contabiliza A3 B/N y Color por separado (distinto precio)</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setFormData({...formData, a3NoPaperMode: formData.a3NoPaperMode ? 0 : 1})}
                className={`relative w-12 h-6 rounded-full transition-colors duration-300 outline-none ${formData.a3NoPaperMode ? 'bg-[#f15a24]' : 'bg-slate-300 dark:bg-white/10'}`}
              >
                <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all duration-300 ${formData.a3NoPaperMode ? 'left-7 shadow-lg shadow-black/20' : 'left-1'}`} />
              </button>
            </div>

            <div className="w-full md:col-span-2 h-px bg-slate-100 dark:bg-white/5 my-2" />

            {/* Password */}
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-[#f15a24] ml-2">Nueva Contraseña</label>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 dark:text-white/10 group-focus-within:text-[#f15a24] transition-colors" size={18} strokeWidth={1.5} />
                <input
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                  placeholder="Sin cambios"
                  className="w-full pl-12 pr-12 py-4 bg-slate-100 dark:bg-white/5 border border-transparent focus:border-[#f15a24]/30 rounded-2xl text-sm font-bold text-slate-700 dark:text-white outline-none transition-all placeholder:text-slate-300 dark:placeholder:text-white/10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-[#f15a24] transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-[#f15a24] ml-2">Verificar Contraseña</label>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 dark:text-white/10 group-focus-within:text-[#f15a24] transition-colors" size={18} strokeWidth={1.5} />
                <input
                  type={showPassword ? "text" : "password"}
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
                  placeholder="Repite la contraseña"
                  className="w-full pl-12 pr-6 py-4 bg-slate-100 dark:bg-white/5 border border-transparent focus:border-[#f15a24]/30 rounded-2xl text-sm font-bold text-slate-700 dark:text-white outline-none transition-all placeholder:text-slate-300 dark:placeholder:text-white/10"
                />
              </div>
            </div>
          </div>

          {error && (
            <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-500 text-[10px] font-black uppercase tracking-widest text-center animate-in slide-in-from-top-1">
              {error}
            </div>
          )}

          {/* Footer Actions */}
          <div className="flex items-center gap-4 pt-6 border-t border-slate-100 dark:border-white/5">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-4 bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-white/60 hover:bg-slate-200 dark:hover:bg-white/10 rounded-2xl font-black text-xs uppercase tracking-widest transition-all"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="flex-1 py-4 bg-[#f15a24] text-white hover:bg-[#f15a24]/90 rounded-2xl font-bold text-xs uppercase tracking-widest transition-all shadow-lg shadow-[#f15a24]/30 flex items-center justify-center gap-3 disabled:opacity-50"
            >
              {isSaving ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <>
                  <Save size={16} />
                  Guardar Cambios
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Internal icons for modal
const FileTextIcon = ({ size }: any) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="16" y1="13" x2="8" y2="13" />
    <line x1="16" y1="17" x2="8" y2="17" />
    <line x1="10" y1="9" x2="8" y2="9" />
  </svg>
);

// Internal icon for modal header
const Edit3 = ({ size, strokeWidth, className }: any) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth={strokeWidth || 2} 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <path d="M12 20h9" />
    <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
  </svg>
);
