import React from 'react';
import { InvoiceCard } from './InvoiceCard';

interface InvoicesGridProps {
    data: any[];
    onView: (id: string) => void;
    onDelete: (id: string) => void;
}

/**
 * InvoicesGrid Component
 * 
 * Grid container for InvoiceCard items.
 */
export const InvoicesGrid: React.FC<InvoicesGridProps> = ({ data, onView, onDelete }) => {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {data.map((invoice) => (
                <InvoiceCard 
                    key={invoice.id} 
                    invoice={invoice} 
                    onView={onView} 
                    onDelete={onDelete} 
                />
            ))}
        </div>
    );
};
