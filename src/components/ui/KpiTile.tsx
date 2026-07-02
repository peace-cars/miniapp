import React from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { TrendingUp, TrendingDown } from 'lucide-react';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface KpiTileProps extends React.HTMLAttributes<HTMLDivElement> {
  label: string;
  value: string | number;
  delta?: number;
  deltaType?: 'increase' | 'decrease' | 'neutral';
  icon?: React.ReactNode;
  color?: string;
}

export const KpiTile = React.forwardRef<HTMLDivElement, KpiTileProps>(
  ({ className, label, value, delta, deltaType, icon, color = 'indigo', ...props }, ref) => {
    const colorClasses = {
      indigo: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
      emerald: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
      amber: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
      rose: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
    };

    const deltaColor = deltaType === 'increase' ? 'text-emerald-400' : deltaType === 'decrease' ? 'text-rose-400' : 'text-slate-500';

    return (
      <div
        ref={ref}
        className={cn(
          'neo-card/40 backdrop-blur-md border border-white/5 p-6 rounded-3xl shadow-xl hover:bg-white/[0.02] transition-all group overflow-hidden relative animate-in fade-in zoom-in-95 duration-500',
          className
        )}
        {...props}
      >
        <div className="flex items-center justify-between relative z-10">
          <div className="space-y-1">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{label}</p>
            <div className="flex items-center gap-3">
              <h4 className="text-2xl font-bold text-white tracking-tight">{value}</h4>
              {delta !== undefined && (
                <div className={cn('text-[10px] font-bold flex items-center gap-1 mt-1 font-mono', deltaColor)}>
                  {deltaType === 'increase' ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                  {delta}%
                </div>
              )}
            </div>
          </div>
          {icon && (
            <div className={cn('w-12 h-12 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110 border', colorClasses[color as keyof typeof colorClasses])}>
              {icon}
            </div>
          )}
        </div>
        
        {/* Subtle accent glow */}
        <div className={cn('absolute -bottom-6 -right-6 w-24 h-24 blur-[80px] opacity-10 rounded-full', `bg-${color}-500`)} />
      </div>
    );
  }
);

KpiTile.displayName = 'KpiTile';
