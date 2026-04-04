import { ChevronLeft, ChevronRight, MoreHorizontal } from 'lucide-react';

interface PaginationProps {
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
    totalRecords?: number;
    limit?: number;
}

/**
 * Premium Pagination Component
 * 
 * Supports spillover logic for large page counts and matches Magma aesthetics.
 */
export const Pagination = ({ currentPage, totalPages, onPageChange, totalRecords, limit }: PaginationProps) => {
    const range = (start: number, end: number) => Array.from({ length: end - start + 1 }, (_, i) => start + i);

    const getPageNumbers = () => {
        const totalNumbers = 5;
        const totalBlocks = totalNumbers + 2;

        if (totalPages > totalBlocks) {
            const startPage = Math.max(2, currentPage - 2);
            const endPage = Math.min(totalPages - 1, currentPage + 2);
            let pages: (number | string)[] = range(startPage, endPage);

            const hasLeftSpill = startPage > 2;
            const hasRightSpill = (totalPages - endPage) > 1;

            if (hasLeftSpill) pages = [1, '...', ...pages];
            else pages = [1, ...pages];

            if (hasRightSpill) pages = [...pages, '...', totalPages];
            else pages = [...pages, totalPages];

            return pages;
        }

        return range(1, totalPages);
    };

    if (totalPages <= 1) return null;

    return (
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 py-8">
            {totalRecords !== undefined && limit !== undefined ? (
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-white/20">
                    Mostrando <span className="text-indigo-500">{(currentPage - 1) * limit + 1}</span> a <span className="text-indigo-500">{Math.min(currentPage * limit, totalRecords)}</span> de <span className="text-indigo-500">{totalRecords}</span> registros
                </p>
            ) : (
                <div />
            )}

            <div className="flex items-center gap-2">
                <button
                    onClick={() => onPageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="p-3 rounded-2xl bg-white dark:bg-white/5 border border-slate-200 dark:border-white/5 text-slate-500 dark:text-white/40 disabled:opacity-30 hover:text-indigo-500 hover:border-indigo-500/30 transition-all shadow-sm"
                >
                    <ChevronLeft size={18} />
                </button>

                {getPageNumbers().map((page, index) => (
                    typeof page === 'string' ? (
                        <div key={index} className="px-2 text-slate-300 dark:text-white/10">
                            <MoreHorizontal size={14} />
                        </div>
                    ) : (
                        <button
                            key={index}
                            onClick={() => onPageChange(page)}
                            className={`min-w-[44px] h-[44px] rounded-2xl font-black text-sm transition-all ${
                                currentPage === page
                                    ? "bg-indigo-500 text-white shadow-lg shadow-indigo-500/20"
                                    : "bg-white dark:bg-white/5 border border-slate-200 dark:border-white/5 text-slate-500 dark:text-white/40 hover:text-indigo-500 hover:bg-slate-50"
                            }`}
                        >
                            {page}
                        </button>
                    )
                ))}

                <button
                    onClick={() => onPageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="p-3 rounded-2xl bg-white dark:bg-white/5 border border-slate-200 dark:border-white/5 text-slate-500 dark:text-white/40 disabled:opacity-30 hover:text-indigo-500 hover:border-indigo-500/30 transition-all shadow-sm"
                >
                    <ChevronRight size={18} />
                </button>
            </div>
        </div>
    );
};
