import React from 'react';

interface BrandLogoProps {
  className?: string;
  showText?: boolean;
  color?: string;
}

/**
 * BrandLogo Component
 * 
 * High-quality SVG recreation of the Magma Espacio official branding.
 * Stylized "M" mountain/volcano isotipo.
 */
export const BrandLogo: React.FC<BrandLogoProps> = ({ 
  className = "w-10 h-10", 
  showText = true,
  color = "currentColor" 
}) => {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {/* Isotipo: The "M" / Mountain */}
      <svg
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="h-full"
      >
        <path
          d="M10 80 L50 20 L90 80 H70 L50 50 L30 80 H10Z"
          fill={color}
        />
      </svg>

      {/* Logotipo: Typography */}
      {showText && (
        <div className="flex flex-col leading-none">
          <span className="text-xl font-black tracking-tighter uppercase whitespace-nowrap">
            Magma
          </span>
          <span className="text-[10px] font-light tracking-[0.2em] uppercase opacity-70">
            Espacio
          </span>
        </div>
      )}
    </div>
  );
};
