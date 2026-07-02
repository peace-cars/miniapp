import React from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface PageHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  icon?: React.ReactNode;
}

export const PageHeader = React.forwardRef<HTMLDivElement, PageHeaderProps>(
  ({ className, title, subtitle, actions, icon, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10 animate-in fade-in slide-in-from-top-4 duration-700',
          className
        )}
        {...props}
      >
        <div className="flex items-start gap-5">
          {icon && (
            <div className="w-14 h-14 bg-indigo-600 rounded-2xl text-white shadow-xl flex items-center justify-center shrink-0">
              {icon}
            </div>
          )}
          <div className="space-y-1">
            <h1 className="text-3xl font-bold text-white tracking-tight leading-tight">{title}</h1>
            {subtitle && <p className="text-sm text-slate-500 font-medium max-w-xl leading-relaxed">{subtitle}</p>}
          </div>
        </div>
        {actions && (
          <div className="flex items-center gap-3 shrink-0">
            {actions}
          </div>
        )}
      </div>
    );
  }
);

PageHeader.displayName = 'PageHeader';
