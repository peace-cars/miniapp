import React from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface SectionCardProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string;
  subtitle?: string;
  action?: React.ReactNode;
  footer?: React.ReactNode;
}

export const SectionCard = React.forwardRef<HTMLDivElement, SectionCardProps>(
  ({ className, title, subtitle, action, footer, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'neo-card/60 backdrop-blur-md border border-black/5 rounded-3xl overflow-hidden shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-500',
          className
        )}
        {...props}
      >
        {(title || action) && (
          <div className="px-8 py-6 border-b border-black/5 flex items-center justify-between bg-black/[0.02]">
            <div className="space-y-1">
              {title && <h3 className="text-sm font-bold text-slate-900 tracking-tight uppercase tracking-widest">{title}</h3>}
              {subtitle && <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{subtitle}</p>}
            </div>
            {action && <div className="flex items-center gap-3">{action}</div>}
          </div>
        )}
        <div className="p-8">
          {children}
        </div>
        {footer && (
          <div className="px-8 py-5 border-t border-black/5 bg-black/[0.01]">
            {footer}
          </div>
        )}
      </div>
    );
  }
);

SectionCard.displayName = 'SectionCard';
