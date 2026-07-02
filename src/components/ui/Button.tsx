import React from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg' | 'icon';
  loading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', loading, children, ...props }, ref) => {
    const variants = {
      primary: 'bg-[#0071e3] text-[#FFFFFF] hover:bg-[#0077ed] active:brightness-90',
      secondary: 'bg-[#f5f5f7] text-[#1d1d1f] hover:bg-[#e8e8ed] active:bg-[#d2d2d7]',
      outline: 'bg-transparent border border-[#0071e3] text-[#0071e3] hover:bg-[#0071e3] hover:text-[#FFFFFF]',
      ghost: 'bg-transparent text-[#0066cc] hover:underline px-0',
      danger: 'bg-red-500 text-[#FFFFFF] hover:bg-red-600 active:brightness-90',
    };

    const sizes = {
      sm: 'px-3 py-1 text-sm rounded-full',
      md: 'px-6 py-3 text-base rounded-full',
      lg: 'px-8 py-4 text-xl rounded-full',
      icon: 'p-3 rounded-full',
    };

    return (
      <button
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center font-medium transition-all focus:outline-none focus:ring-4 focus:ring-blue-500/20 disabled:opacity-50 disabled:pointer-events-none gap-2',
          variants[variant],
          sizes[size],
          className
        )}
        disabled={loading || props.disabled}
        {...props}
      >
        {loading && <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />}
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
