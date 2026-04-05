import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { BarChart3 } from 'lucide-react';

interface ChartProps {
    data: { month: string; total: number }[];
}

export const YTDExpenseChart = ({ data }: ChartProps) => {
    // Transforming data to properly show currencies
    const formattedData = data.map(d => ({
        ...d,
        displayTotal: `$${d.total.toFixed(2)}`
    }));

    return (
        <div className="p-10 bg-white dark:bg-[#1a1818] rounded-[2.5rem] border border-slate-200 dark:border-white/5 shadow-2xl shadow-indigo-500/10">
            <div className="flex items-center gap-3 mb-8">
                <div className="p-2 rounded-xl bg-slate-100 dark:bg-white/5 text-slate-400">
                    <BarChart3 size={18} />
                </div>
                <div>
                    <h2 className="text-lg font-black text-slate-800 dark:text-white tracking-tight">Evolución de Gasto - {new Date().getFullYear()}</h2>
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-white/20 mt-1">Desglose Mensual</p>
                </div>
            </div>
            
            <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={formattedData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#94a3b830" vertical={false} />
                        <XAxis 
                            dataKey="month" 
                            axisLine={false} 
                            tickLine={false} 
                            tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 700 }}
                            dy={10}
                        />
                        <YAxis 
                            axisLine={false} 
                            tickLine={false} 
                            tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 700 }}
                            tickFormatter={(value) => `$${value}`}
                        />
                        <Tooltip 
                            cursor={{ fill: 'rgba(99, 102, 241, 0.05)' }}
                            contentStyle={{ 
                                backgroundColor: 'rgba(26, 24, 24, 0.9)', 
                                border: '1px solid rgba(255,255,255,0.1)',
                                borderRadius: '16px',
                                padding: '12px 16px',
                                boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
                                color: '#fff'
                            }}
                            itemStyle={{ color: '#fff', fontWeight: '900', fontSize: '1.25rem' }}
                            formatter={(value: any) => [`$${Number(value).toFixed(2)}`, 'Gasto']}
                            labelStyle={{ color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.1em', fontSize: '10px', fontWeight: '900', marginBottom: '8px' }}
                        />
                        <defs>
                            <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#4f46e5" stopOpacity={0.9}/>
                                <stop offset="100%" stopColor="#ec4899" stopOpacity={0.9}/>
                            </linearGradient>
                        </defs>
                        <Bar 
                            dataKey="total" 
                            fill="url(#colorTotal)" 
                            radius={[8, 8, 0, 0]} 
                            barSize={32}
                            animationDuration={1500}
                        />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};
