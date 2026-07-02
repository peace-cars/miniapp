import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number | null | undefined, currency = 'ETB'): string {
  if (amount == null) return `0 ${currency}`;
  return `${Number(amount).toLocaleString('en-US')} ${currency}`;
}
