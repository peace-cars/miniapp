import React from 'react';
import { cn } from '../../lib/utils';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'primary' | 'outline' | 'warning' | 'info';
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({ 
  children, 
  variant = 'default',
  className 
}) => {
  const variants = {
    default: 'bg-zinc-100 text-zinc-600 border-zinc-200',
    primary: 'bg-zinc-900 text-white border-zinc-800',
    outline: 'bg-transparent border-zinc-200 text-zinc-600',
    warning: 'bg-amber-50 text-amber-600 border-amber-200',
    info: 'bg-blue-50 text-blue-600 border-blue-200'
  };

  return (
    <span className={cn(
      "px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border",
      variants[variant],
      className
    )}>
      {children}
    </span>
  );
};
