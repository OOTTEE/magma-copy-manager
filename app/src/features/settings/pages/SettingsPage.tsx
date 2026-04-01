import { useState, useEffect } from 'react';
import { api } from '../../../services/api';
import { 
    Settings, 
    Globe, 
    Calendar, 
    Save, 
    Loader2, 
    CheckCircle2, 
    AlertCircle,
    Info,
    ShieldCheck
} from 'lucide-react';

/**
 * SettingsPage Component
 * 
 * Centralized system configuration for Magma admins.
 * Manages printer infrastructure and billing cycle parameters.
 */
export const SettingsPage = () => {
    const [settings, setSettings] = useState<{ 
        printer_url: string; 
        billing_cycle_day: string;
        price_a3_bw_no_paper: string;
        price_a3_color_no_paper: string;
    }>({
        printer_url: '',
        billing_cycle_day: '27',
        price_a3_bw_no_paper: '0.05',
        price_a3_color_no_paper: '0.10'
    });
    const [originalSettings, setOriginalSettings] = useState(settings);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [status, setStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

    const fetchSettings = async () => {
        setIsLoading(true);
        try {
            const { data, error } = await api.GET("/api/v1/settings/", {});
            if (error) throw error;
            if (data) {
                const fetched = data as any;
                const newSettings = {
                    printer_url: fetched.printer_url || '',
                    billing_cycle_day: fetched.billing_cycle_day || '27',
                    price_a3_bw_no_paper: fetched.price_a3_bw_no_paper || '0.05',
                    price_a3_color_no_paper: fetched.price_a3_color_no_paper || '0.10'
                };
                setSettings(newSettings);
                setOriginalSettings(newSettings);
            }
        } catch (err: any) {
            setStatus({ type: 'error', message: err.message || "Error al cargar la configuración." });
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchSettings();
    }, []);

    const validate = () => {
        if (!settings.printer_url.startsWith('http://') && !settings.printer_url.startsWith('https://')) {
            return "La URL de la impresora debe empezar por http:// o https://";
        }
        const day = parseInt(settings.billing_cycle_day, 10);
        if (isNaN(day) || day < 1 || day > 28) {
            return "El día del ciclo de facturación debe estar entre 1 y 28.";
        }
        if (isNaN(parseFloat(settings.price_a3_bw_no_paper)) || isNaN(parseFloat(settings.price_a3_color_no_paper))) {
            return "Los precios deben ser valores numéricos válidos.";
        }
        return null;
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        const error = validate();
        if (error) {
            setStatus({ type: 'error', message: error });
            return;
        }

        setIsSaving(true);
        setStatus(null);
        try {
            const { error: apiError } = await api.PATCH("/api/v1/settings/", {
                body: settings
            });
            if (apiError) throw apiError;
            
            setOriginalSettings(settings);
            setStatus({ type: 'success', message: "Configuración guardada correctamente." });
            setTimeout(() => setStatus(null), 3000);
        } catch (err: any) {
            setStatus({ type: 'error', message: err.message || "Error al guardar los cambios." });
        } finally {
            setIsSaving(false);
        }
    };

    const hasChanges = JSON.stringify(settings) !== JSON.stringify(originalSettings);

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center py-40 gap-4">
                <Loader2 size={48} className="text-indigo-500 animate-spin" />
                <p className="text-slate-400 dark:text-white/20 font-black uppercase tracking-widest text-xs">Cargando Parámetros...</p>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto space-y-10 pb-20">
            {/* Header */}
            <div className="flex items-center gap-4">
                <div className="p-4 rounded-3xl bg-indigo-500/10 text-indigo-500 border border-indigo-500/20">
                    <Settings size={32} strokeWidth={1.5} />
                </div>
                <div>
                    <h1 className="text-4xl font-black text-slate-800 dark:text-white tracking-tighter">
                        Configuración del Sistema
                    </h1>
                    <p className="text-slate-500 dark:text-white/40 font-medium">Gestiona la infraestructura y los ciclos de facturación globales.</p>
                </div>
            </div>

            {/* Main Form */}
            <form onSubmit={handleSave} className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="bg-white dark:bg-[#1a1818] rounded-[2.5rem] p-10 border border-slate-200 dark:border-white/5 shadow-2xl shadow-indigo-500/10">
                    
                    <div className="grid grid-cols-1 gap-12">
                        {/* Printer URL Section */}
                        <div className="space-y-6">
                            <div className="flex items-center gap-3">
                                <Globe size={20} className="text-indigo-500" />
                                <h3 className="text-lg font-black text-slate-800 dark:text-white tracking-tight">Infraestructura de Impresión</h3>
                            </div>
                            
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-white/20 ml-2">URL del Servidor de Impresión</label>
                                <input 
                                    type="text"
                                    value={settings.printer_url}
                                    onChange={(e) => setSettings({...settings, printer_url: e.target.value})}
                                    placeholder="https://ip-o-dominio-impresora"
                                    className="w-full h-16 px-6 rounded-2xl bg-slate-50 dark:bg-black/20 border border-slate-100 dark:border-white/5 text-slate-700 dark:text-white font-bold focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none"
                                />
                                <p className="text-[10px] text-slate-400 dark:text-white/20 flex items-center gap-1 mt-2 ml-2">
                                    <Info size={12} />
                                    Debe comenzar con http:// o https://
                                </p>
                            </div>
                        </div>

                        {/* Divider */}
                        <div className="h-px w-full bg-slate-100 dark:bg-white/5" />

                        {/* Billing Section */}
                        <div className="space-y-6">
                            <div className="flex items-center gap-3">
                                <Calendar size={20} className="text-[#f15a24]" />
                                <h3 className="text-lg font-black text-slate-800 dark:text-white tracking-tight">Periodos de Facturación</h3>
                            </div>

                            <div className="space-y-2 max-w-xs">
                                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-white/20 ml-2">Día de Corte de Ciclo</label>
                                <div className="relative">
                                    <input 
                                        type="number"
                                        min="1"
                                        max="28"
                                        value={settings.billing_cycle_day}
                                        onChange={(e) => setSettings({...settings, billing_cycle_day: e.target.value})}
                                        className="w-full h-16 px-6 rounded-2xl bg-slate-50 dark:bg-black/20 border border-slate-100 dark:border-white/5 text-slate-700 dark:text-white font-bold focus:ring-2 focus:ring-[#f15a24]/20 focus:border-[#f15a24] transition-all outline-none"
                                    />
                                    <span className="absolute right-6 top-1/2 -translate-y-1/2 text-[10px] font-black uppercase tracking-widest text-slate-400">Mensual</span>
                                </div>
                                <p className="text-[10px] text-slate-400 dark:text-white/20 flex items-center gap-1 mt-2 ml-2">
                                    <Info size={12} />
                                    Determina el inicio y fin de los reportes (rango 1-28).
                                </p>
                            </div>
                        </div>

                        {/* Divider */}
                        <div className="h-px w-full bg-slate-100 dark:bg-white/5" />

                        {/* Special Prices Section */}
                        <div className="space-y-6">
                            <div className="flex items-center gap-3">
                                <ShieldCheck size={20} className="text-indigo-500" />
                                <h3 className="text-lg font-black text-slate-800 dark:text-white tracking-tight">Tarifas A3 (Sin Papel)</h3>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-white/20 ml-2">Precio A3 B/N (sin papel)</label>
                                    <div className="relative">
                                        <input 
                                            type="text"
                                            value={settings.price_a3_bw_no_paper}
                                            onChange={(e) => setSettings({...settings, price_a3_bw_no_paper: e.target.value})}
                                            className="w-full h-16 px-6 rounded-2xl bg-slate-50 dark:bg-black/20 border border-slate-100 dark:border-white/5 text-slate-700 dark:text-white font-bold focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none"
                                        />
                                        <span className="absolute right-6 top-1/2 -translate-y-1/2 text-[10px] font-black text-indigo-500">€ / ud</span>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-white/20 ml-2">Precio A3 Color (sin papel)</label>
                                    <div className="relative">
                                        <input 
                                            type="text"
                                            value={settings.price_a3_color_no_paper}
                                            onChange={(e) => setSettings({...settings, price_a3_color_no_paper: e.target.value})}
                                            className="w-full h-16 px-6 rounded-2xl bg-slate-50 dark:bg-black/20 border border-slate-100 dark:border-white/5 text-slate-700 dark:text-white font-bold focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none"
                                        />
                                        <span className="absolute right-6 top-1/2 -translate-y-1/2 text-[10px] font-black text-[#f15a24]">€ / ud</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Feedback Status */}
                    {status && (
                        <div className={`mt-10 flex items-center gap-3 p-6 rounded-2xl border ${
                            status.type === 'success' 
                                ? 'bg-emerald-500/5 border-emerald-500/20 text-emerald-500' 
                                : 'bg-red-500/5 border-red-500/20 text-red-500'
                        } animate-in fade-in slide-in-from-top-2`}>
                            {status.type === 'success' ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
                            <span className="text-sm font-bold">{status.message}</span>
                        </div>
                    )}

                    {/* Action Bar */}
                    <div className="mt-12 pt-10 border-t border-slate-100 dark:bg-white/5 flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-100 dark:bg-white/5 text-slate-400 dark:text-white/20 text-[10px] font-black uppercase tracking-widest">
                            <ShieldCheck size={14} />
                            Acceso Nivel Administrador
                        </div>
                        
                        <button 
                            type="submit"
                            disabled={isSaving || !hasChanges}
                            className={`flex items-center justify-center gap-2 min-w-[180px] h-14 rounded-2xl font-bold transition-all ${
                                hasChanges && !isSaving
                                ? "bg-indigo-500 text-white shadow-xl shadow-indigo-500/30 hover:scale-105 active:scale-95"
                                : "bg-slate-100 dark:bg-white/5 text-slate-400 dark:text-white/10 cursor-not-allowed"
                            }`}
                        >
                            {isSaving ? (
                                <Loader2 size={20} className="animate-spin" />
                            ) : (
                                <>
                                    <Save size={20} />
                                    Guardar Cambios
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </form>
        </div>
    );
};
