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
    ShieldCheck,
    Timer,
    ToggleLeft,
    ToggleRight
} from 'lucide-react';
import { AutoBillingLogs } from '../components/AutoBillingLogs';

/**
 * SettingsPage Component
 * 
 * Centralized system configuration for Magma admins.
 * Manages printer infrastructure, billing cycle parameters and copy pricing.
 */
export const SettingsPage = () => {
    const [settings, setSettings] = useState<{ 
        printer_url: string; 
        billing_cycle_day: string;
        auto_billing_enabled: boolean;
        auto_billing_day: string;
        auto_billing_time: string;
        auto_sync_enabled: boolean;
        auto_sync_frequency: string;
        auto_sync_day: string;
        auto_sync_time: string;
        nexudus_email: string;
        nexudus_password: string;
        nexudus_product_id_a4bw: string;
        nexudus_product_id_a4color: string;
        nexudus_product_id_a3bw: string;
        nexudus_product_id_a3color: string;
        nexudus_product_id_sra3bw: string;
        nexudus_product_id_sra3color: string;
    }>({
        printer_url: '',
        billing_cycle_day: '27',
        auto_billing_enabled: false,
        auto_billing_day: '1',
        auto_billing_time: '01:00',
        auto_sync_enabled: false,
        auto_sync_frequency: 'daily',
        auto_sync_day: '1',
        auto_sync_time: '02:00',
        nexudus_email: '',
        nexudus_password: '',
        nexudus_product_id_a4bw: '',
        nexudus_product_id_a4color: '',
        nexudus_product_id_a3bw: '',
        nexudus_product_id_a3color: '',
        nexudus_product_id_sra3bw: '',
        nexudus_product_id_sra3color: ''
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
                    auto_billing_enabled: fetched.auto_billing_enabled === true || fetched.auto_billing_enabled === "true" || fetched.auto_billing_enabled === 1 || fetched.auto_billing_enabled === "1",
                    auto_billing_day: fetched.auto_billing_day?.toString() || '1',
                    auto_billing_time: fetched.auto_billing_time || '01:00',
                    auto_sync_enabled: fetched.auto_sync_enabled === true || fetched.auto_sync_enabled === "true" || fetched.auto_sync_enabled === 1 || fetched.auto_sync_enabled === "1",
                    auto_sync_frequency: fetched.auto_sync_frequency || 'daily',
                    auto_sync_day: fetched.auto_sync_day?.toString() || '1',
                    auto_sync_time: fetched.auto_sync_time || '02:00',
                    nexudus_email: fetched.nexudus_email || '',
                    nexudus_password: fetched.nexudus_password || '',
                    nexudus_product_id_a4bw: fetched.nexudus_product_id_a4bw || '',
                    nexudus_product_id_a4color: fetched.nexudus_product_id_a4color || '',
                    nexudus_product_id_a3bw: fetched.nexudus_product_id_a3bw || '',
                    nexudus_product_id_a3color: fetched.nexudus_product_id_a3color || '',
                    nexudus_product_id_sra3bw: fetched.nexudus_product_id_sra3bw || '',
                    nexudus_product_id_sra3color: fetched.nexudus_product_id_sra3color || ''
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
        
        if (settings.auto_billing_time && !/^([01]\d|2[0-3]):([0-5]\d)$/.test(settings.auto_billing_time)) {
            return "La hora de facturación automática debe tener el formato HH:mm (24h).";
        }

        if (settings.auto_sync_time && !/^([01]\d|2[0-3]):([0-5]\d)$/.test(settings.auto_sync_time)) {
            return "La hora de sincronización automática debe tener el formato HH:mm (24h).";
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
            const { error: apiError } = await (api as any).PATCH("/api/v1/settings/", {
                body: settings as any
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
                    <p className="text-slate-500 dark:text-white/40 font-medium">Gestiona la infraestructura, tarifas y ciclos de facturación globales.</p>
                </div>
            </div>

            {/* Main Form */}
            <form onSubmit={handleSave} className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="bg-white dark:bg-[#1a1818] rounded-[2.5rem] p-10 border border-slate-200 dark:border-white/5 shadow-2xl shadow-indigo-500/10">
                    
                    <div className="grid grid-cols-1 gap-12">
                        {/* Printer URL Section */}
                        <div className="space-y-6">
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-xl bg-slate-100 dark:bg-white/5 text-slate-400">
                                    <Globe size={18} />
                                </div>
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

                        {/* Nexudus Credentials Section */}
                        <div className="space-y-6">
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-500">
                                    <ShieldCheck size={18} />
                                </div>
                                <h3 className="text-lg font-black text-slate-800 dark:text-white tracking-tight">Credenciales de Nexudus</h3>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-white/20 ml-2">Email Administrador</label>
                                    <input 
                                        type="email"
                                        value={settings.nexudus_email}
                                        onChange={(e) => setSettings({...settings, nexudus_email: e.target.value})}
                                        placeholder="admin@tu-coworking.com"
                                        className="w-full h-16 px-6 rounded-2xl bg-slate-50 dark:bg-black/20 border border-slate-100 dark:border-white/5 text-slate-700 dark:text-white font-bold focus:ring-2 focus:ring-indigo-500/20 outline-none"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-white/20 ml-2">Contraseña</label>
                                    <input 
                                        type="password"
                                        value={settings.nexudus_password}
                                        onChange={(e) => setSettings({...settings, nexudus_password: e.target.value})}
                                        placeholder="********"
                                        className="w-full h-16 px-6 rounded-2xl bg-slate-50 dark:bg-black/20 border border-slate-100 dark:border-white/5 text-slate-700 dark:text-white font-bold focus:ring-2 focus:ring-indigo-500/20 outline-none"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Divider */}
                        <div className="h-px w-full bg-slate-100 dark:bg-white/5" />

                        {/* Nexudus Product Mapping Section */}
                        <div className="space-y-6">
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-xl bg-orange-500/10 text-orange-500">
                                    <CheckCircle2 size={18} />
                                </div>
                                <h3 className="text-lg font-black text-slate-800 dark:text-white tracking-tight">Mapeo de Productos Nexudus</h3>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-x-8 gap-y-10">
                                {/* A4 Group Mapping */}
                                <div className="space-y-4">
                                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-white/20">
                                        Formato A4 (con papel)
                                    </p>
                                    <div className="space-y-4">
                                        <div className="relative">
                                            <input 
                                                type="text"
                                                value={settings.nexudus_product_id_a4bw}
                                                onChange={(e) => setSettings({...settings, nexudus_product_id_a4bw: e.target.value})}
                                                placeholder="ID Producto"
                                                className="w-full h-14 px-6 rounded-2xl bg-emerald-500/5 dark:bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-bold focus:ring-2 focus:ring-emerald-500/20 outline-none"
                                            />
                                            <span className="absolute left-6 -top-2 px-2 bg-white dark:bg-[#1a1818] text-[8px] font-black uppercase tracking-widest text-emerald-500">ID B/N</span>
                                        </div>
                                        <div className="relative">
                                            <input 
                                                type="text"
                                                value={settings.nexudus_product_id_a4color}
                                                onChange={(e) => setSettings({...settings, nexudus_product_id_a4color: e.target.value})}
                                                placeholder="ID Producto"
                                                className="w-full h-14 px-6 rounded-2xl bg-indigo-500/5 dark:bg-indigo-500/10 border border-indigo-500/20 text-indigo-600 dark:text-indigo-400 font-bold focus:ring-2 focus:ring-indigo-500/20 outline-none"
                                            />
                                            <span className="absolute left-6 -top-2 px-2 bg-white dark:bg-[#1a1818] text-[8px] font-black uppercase tracking-widest text-indigo-500">ID Color</span>
                                        </div>
                                    </div>
                                </div>

                                {/* A3 Group Mapping */}
                                <div className="space-y-4">
                                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-white/20">
                                        Formato A3 (con papel)
                                    </p>
                                    <div className="space-y-4">
                                        <div className="relative">
                                            <input 
                                                type="text"
                                                value={settings.nexudus_product_id_a3bw}
                                                onChange={(e) => setSettings({...settings, nexudus_product_id_a3bw: e.target.value})}
                                                placeholder="ID Producto"
                                                className="w-full h-14 px-6 rounded-2xl bg-emerald-500/5 dark:bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-bold focus:ring-2 focus:ring-emerald-500/20 outline-none"
                                            />
                                            <span className="absolute left-6 -top-2 px-2 bg-white dark:bg-[#1a1818] text-[8px] font-black uppercase tracking-widest text-emerald-500">ID B/N</span>
                                        </div>
                                        <div className="relative">
                                            <input 
                                                type="text"
                                                value={settings.nexudus_product_id_a3color}
                                                onChange={(e) => setSettings({...settings, nexudus_product_id_a3color: e.target.value})}
                                                placeholder="ID Producto"
                                                className="w-full h-14 px-6 rounded-2xl bg-indigo-500/5 dark:bg-indigo-500/10 border border-indigo-500/20 text-indigo-600 dark:text-indigo-400 font-bold focus:ring-2 focus:ring-indigo-500/20 outline-none"
                                            />
                                            <span className="absolute left-6 -top-2 px-2 bg-white dark:bg-[#1a1818] text-[8px] font-black uppercase tracking-widest text-indigo-500">ID Color</span>
                                        </div>
                                    </div>
                                </div>

                                {/* A3/SRA3 (Sin Papel) Mapping */}
                                <div className="space-y-4">
                                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-white/20">
                                        F. A3 / SRA3 (Sin papel)
                                    </p>
                                    <div className="space-y-4">
                                        <div className="relative">
                                            <input 
                                                type="text"
                                                value={settings.nexudus_product_id_sra3bw}
                                                onChange={(e) => setSettings({...settings, nexudus_product_id_sra3bw: e.target.value})}
                                                placeholder="ID Producto"
                                                className="w-full h-14 px-6 rounded-2xl bg-emerald-500/5 dark:bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-bold focus:ring-2 focus:ring-emerald-500/20 outline-none"
                                            />
                                            <span className="absolute left-6 -top-2 px-2 bg-white dark:bg-[#1a1818] text-[8px] font-black uppercase tracking-widest text-emerald-500">ID B/N</span>
                                        </div>
                                        <div className="relative">
                                            <input 
                                                type="text"
                                                value={settings.nexudus_product_id_sra3color}
                                                onChange={(e) => setSettings({...settings, nexudus_product_id_sra3color: e.target.value})}
                                                placeholder="ID Producto"
                                                className="w-full h-14 px-6 rounded-2xl bg-indigo-500/5 dark:bg-indigo-500/10 border border-indigo-500/20 text-indigo-600 dark:text-indigo-400 font-bold focus:ring-2 focus:ring-indigo-500/20 outline-none"
                                            />
                                            <span className="absolute left-6 -top-2 px-2 bg-white dark:bg-[#1a1818] text-[8px] font-black uppercase tracking-widest text-indigo-500">ID Color</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>


                        {/* Divider */}
                        <div className="h-px w-full bg-slate-100 dark:bg-white/5" />

                        {/* Billing Section */}
                        <div className="space-y-6">
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-xl bg-slate-100 dark:bg-white/5 text-slate-400">
                                    <Calendar size={18} />
                                </div>
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

                        {/* Auto Billing Automation Section */}
                        <div className="space-y-8">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-500 border border-indigo-500/20">
                                        <Timer size={18} />
                                    </div>
                                    <h3 className="text-lg font-black text-slate-800 dark:text-white tracking-tight">Auto Facturación Mensual</h3>
                                </div>
                                
                                <button 
                                    type="button"
                                    onClick={() => setSettings({...settings, auto_billing_enabled: !settings.auto_billing_enabled})}
                                    className={`flex items-center gap-2 px-4 py-2 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all ${
                                        settings.auto_billing_enabled 
                                        ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20" 
                                        : "bg-slate-100 dark:bg-white/5 text-slate-400 border border-transparent"
                                    }`}
                                >
                                    {settings.auto_billing_enabled ? <ToggleRight size={20} /> : <ToggleLeft size={20} />}
                                    {settings.auto_billing_enabled ? "Servicio Activo" : "Servicio Desactivado"}
                                </button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-white/20 ml-2">Día de Ejecución</label>
                                    <select 
                                        value={settings.auto_billing_day}
                                        onChange={(e) => setSettings({...settings, auto_billing_day: e.target.value})}
                                        className="w-full h-16 px-6 rounded-2xl bg-slate-50 dark:bg-black/20 border border-slate-100 dark:border-white/5 text-slate-700 dark:text-white font-bold focus:ring-2 focus:ring-indigo-500/20 outline-none appearance-none"
                                    >
                                        {Array.from({ length: 28 }, (_, i) => i + 1).map(day => (
                                            <option key={day} value={day} className="bg-white dark:bg-[#1a1818]">Día {day} de cada mes</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-white/20 ml-2">Hora de Ejecución (24h)</label>
                                    <input 
                                        type="time"
                                        value={settings.auto_billing_time}
                                        onChange={(e) => setSettings({...settings, auto_billing_time: e.target.value})}
                                        className="w-full h-16 px-6 rounded-2xl bg-slate-50 dark:bg-black/20 border border-slate-100 dark:border-white/5 text-slate-700 dark:text-white font-bold focus:ring-2 focus:ring-indigo-500/20 outline-none"
                                    />
                                </div>
                            </div>
                            
                            <div className="p-6 rounded-[2rem] bg-indigo-500/5 border border-indigo-500/10">
                                <div className="flex gap-4">
                                    <div className="mt-1 text-indigo-500"><Info size={20} /></div>
                                    <div className="space-y-1">
                                        <p className="text-sm font-bold text-slate-700 dark:text-white/80">Lógica de Automatización</p>
                                        <p className="text-xs text-slate-500 dark:text-white/40 leading-relaxed italic">
                                            Cuando el servicio está activo, Magma sincronizará automáticamente los contadores de la impresora, 
                                            generará las facturas locales y publicará los borradores en Nexudus el día y hora indicados.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Divider */}
                        <div className="h-px w-full bg-slate-100 dark:bg-white/5" />

                        {/* Auto Sync Automation Section */}
                        <div className="space-y-8">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 rounded-xl bg-orange-500/10 text-orange-500 border border-orange-500/20">
                                        <Timer size={18} />
                                    </div>
                                    <h3 className="text-lg font-black text-slate-800 dark:text-white tracking-tight">Sincronización de Contadores</h3>
                                </div>
                                
                                <button 
                                    type="button"
                                    onClick={() => setSettings({...settings, auto_sync_enabled: !settings.auto_sync_enabled})}
                                    className={`flex items-center gap-2 px-4 py-2 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all ${
                                        settings.auto_sync_enabled 
                                        ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20" 
                                        : "bg-slate-100 dark:bg-white/5 text-slate-400 border border-transparent"
                                    }`}
                                >
                                    {settings.auto_sync_enabled ? <ToggleRight size={20} /> : <ToggleLeft size={20} />}
                                    {settings.auto_sync_enabled ? "Sincronización Activa" : "Sincronización Manual"}
                                </button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-white/20 ml-2">Frecuencia</label>
                                    <select 
                                        value={settings.auto_sync_frequency}
                                        onChange={(e) => setSettings({...settings, auto_sync_frequency: e.target.value})}
                                        className="w-full h-16 px-6 rounded-2xl bg-slate-50 dark:bg-black/20 border border-slate-100 dark:border-white/5 text-slate-700 dark:text-white font-bold focus:ring-2 focus:ring-orange-500/20 outline-none appearance-none"
                                    >
                                        <option value="daily" className="bg-white dark:bg-[#1a1818]">Diaria</option>
                                        <option value="weekly" className="bg-white dark:bg-[#1a1818]">Semanal</option>
                                    </select>
                                </div>

                                {settings.auto_sync_frequency === 'weekly' && (
                                    <div className="space-y-2 animate-in fade-in zoom-in-95 duration-200">
                                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-white/20 ml-2">Día de la Semana</label>
                                        <select 
                                            value={settings.auto_sync_day}
                                            onChange={(e) => setSettings({...settings, auto_sync_day: e.target.value})}
                                            className="w-full h-16 px-6 rounded-2xl bg-slate-50 dark:bg-black/20 border border-slate-100 dark:border-white/5 text-slate-700 dark:text-white font-bold focus:ring-2 focus:ring-orange-500/20 outline-none appearance-none"
                                        >
                                            <option value="1" className="bg-white dark:bg-[#1a1818]">Lunes</option>
                                            <option value="2" className="bg-white dark:bg-[#1a1818]">Martes</option>
                                            <option value="3" className="bg-white dark:bg-[#1a1818]">Miércoles</option>
                                            <option value="4" className="bg-white dark:bg-[#1a1818]">Jueves</option>
                                            <option value="5" className="bg-white dark:bg-[#1a1818]">Viernes</option>
                                            <option value="6" className="bg-white dark:bg-[#1a1818]">Sábado</option>
                                            <option value="7" className="bg-white dark:bg-[#1a1818]">Domingo</option>
                                        </select>
                                    </div>
                                )}

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-white/20 ml-2">Hora de Inicio</label>
                                    <input 
                                        type="time"
                                        value={settings.auto_sync_time}
                                        onChange={(e) => setSettings({...settings, auto_sync_time: e.target.value})}
                                        className="w-full h-16 px-6 rounded-2xl bg-slate-50 dark:bg-black/20 border border-slate-100 dark:border-white/5 text-slate-700 dark:text-white font-bold focus:ring-2 focus:ring-orange-500/20 outline-none"
                                    />
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

            {/* Audit Logs Section */}
            <div className="pt-10 border-t border-slate-100 dark:border-white/5">
                <AutoBillingLogs />
            </div>
        </div>
    );
};
