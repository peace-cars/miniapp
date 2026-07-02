import React from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface CommonProps {
  label?: string;
  error?: string;
  className?: string;
}

interface TextFieldProps extends React.InputHTMLAttributes<HTMLInputElement>, CommonProps {
  icon?: React.ReactNode;
}

export const TextField = React.forwardRef<HTMLInputElement, TextFieldProps>(
  ({ label, error, icon, className, ...props }, ref) => {
    return (
      <div className={cn("space-y-1.5 w-full", className)}>
        {label && (
          <label
            className="text-xs font-semibold ml-1 tracking-tight"
            style={{ color: 'var(--color-text-secondary)' }}
          >
            {label}
          </label>
        )}
        <div className="relative group/field">
          {icon && (
            <div
              className="absolute left-5 top-1/2 -translate-y-1/2 transition-colors group-focus-within/field:text-accent"
              style={{ color: 'var(--color-text-muted)' }}
            >
              {icon}
            </div>
          )}
          <input
            ref={ref}
            className={cn(
              "w-full neo-inset rounded-xl py-3 px-5 text-sm font-medium focus:outline-none focus:ring-4 transition-all",
              "placeholder:opacity-40",
              icon && "pl-14",
              error && "ring-2 ring-red-500/30",
            )}
            style={{
              color: 'var(--color-text-primary)',
            }}
            {...props}
          />
        </div>
        {error && <p className="text-[10px] text-red-500 font-medium ml-1 tracking-tight">{error}</p>}
      </div>
    );
  }
);

interface TextAreaFieldProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement>, CommonProps {}

export const TextAreaField = React.forwardRef<HTMLTextAreaElement, TextAreaFieldProps>(
  ({ label, error, className, ...props }, ref) => {
    return (
      <div className={cn("space-y-1.5 w-full", className)}>
        {label && (
          <label
            className="text-xs font-semibold ml-1 tracking-tight"
            style={{ color: 'var(--color-text-secondary)' }}
          >
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          className={cn(
            "w-full neo-inset rounded-xl py-3 px-5 text-sm font-medium focus:outline-none focus:ring-4 transition-all min-h-[100px] resize-none",
            "placeholder:opacity-40",
            error && "ring-2 ring-red-500/30",
          )}
          style={{
            color: 'var(--color-text-primary)',
          }}
          {...props}
        />
        {error && <p className="text-[10px] text-red-500 font-medium ml-1 tracking-tight">{error}</p>}
      </div>
    );
  }
);

interface SelectFieldProps extends React.SelectHTMLAttributes<HTMLSelectElement>, CommonProps {
  options: { value: string; label: string }[];
}

export const SelectField = React.forwardRef<HTMLSelectElement, SelectFieldProps>(
  ({ label, error, options, className, ...props }, ref) => {
    return (
      <div className={cn("space-y-1.5 w-full", className)}>
        {label && (
          <label
            className="text-xs font-semibold ml-1 tracking-tight"
            style={{ color: 'var(--color-text-secondary)' }}
          >
            {label}
          </label>
        )}
        <div className="relative group/field">
          <select
            ref={ref}
            className={cn(
              "w-full neo-inset rounded-xl py-3 px-5 text-sm font-medium focus:outline-none focus:ring-4 transition-all appearance-none cursor-pointer",
              error && "ring-2 ring-red-500/30",
            )}
            style={{
              color: 'var(--color-text-primary)',
            }}
            {...props}
          >
            {options.map((opt) => (
              <option key={opt.value} value={opt.value} style={{ background: 'var(--color-bg-secondary)' }}>
                {opt.label}
              </option>
            ))}
          </select>
          <div
            className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none transition-colors"
            style={{ color: 'var(--color-text-muted)' }}
          >
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
          </div>
        </div>
        {error && <p className="text-[10px] text-red-500 font-medium ml-1 tracking-tight">{error}</p>}
      </div>
    );
  }
);

TextField.displayName = 'TextField';
TextAreaField.displayName = 'TextAreaField';
SelectField.displayName = 'SelectField';
