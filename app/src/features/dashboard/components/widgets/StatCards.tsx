export const StatCards = ({ currentMonth, ytdTotalPages }: { currentMonth: { pages: number }; ytdTotalPages: number }) => {
    return (
        <div className="flex flex-col gap-6 h-full">
            {/* Current Month Card */}
            <div className="flex-1 p-8 bg-white dark:bg-[#1a1818] rounded-[2.5rem] border border-slate-200 dark:border-white/5 shadow-2xl shadow-indigo-500/10 relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-white/30 mb-8">Consumo Mes Actual</h3>
                <div className="text-5xl font-black text-slate-800 dark:text-white tracking-tighter">
                    {currentMonth.pages}
                </div>
                <div className="text-[10px] font-black text-indigo-500 dark:text-indigo-400 mt-2 uppercase tracking-widest">
                    Páginas impresas
                </div>
                {/* Decorative element mimicking the mockup rings */}
                <div className="absolute -bottom-4 -right-4 w-32 h-32 rounded-full border-[6px] border-indigo-500/10 dark:border-indigo-500/20 group-hover:scale-110 transition-transform duration-700" />
                <div className="absolute -bottom-2 -right-2 w-20 h-20 rounded-full border-[6px] border-pink-500/10 dark:border-pink-500/20 group-hover:-rotate-12 transition-transform duration-700" />
            </div>

            {/* YTD Total Card */}
            <div className="flex-1 p-8 bg-white dark:bg-[#1a1818] rounded-[2.5rem] border border-slate-200 dark:border-white/5 shadow-2xl shadow-[#f15a24]/10 relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-br from-[#f15a24]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-white/30 mb-8">Acumulado Anual</h3>
                <div className="text-5xl font-black text-slate-800 dark:text-white tracking-tighter">
                    {ytdTotalPages}
                </div>
                <div className="text-[10px] font-black text-[#f15a24] dark:text-[#f15a24] mt-2 uppercase tracking-widest">
                    Total Acumulado
                </div>
                {/* Decorative mini wave mimicking the mockup */}
                <div className="mt-8 flex items-end gap-1.5 h-10 opacity-30 group-hover:opacity-60 transition-opacity duration-500">
                    {[3, 5, 4, 7, 5, 8, 4, 6, 9].map((h, i) => (
                        <div key={i} className="flex-1 bg-gradient-to-t from-[#f15a24] to-[#fbc02d] rounded-t-sm" style={{ height: `${h * 10}%` }} />
                    ))}
                </div>
            </div>
        </div>
    );
};
