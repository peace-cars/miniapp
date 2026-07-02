import React from 'react';
import { useTranslation } from 'react-i18next';
import { Globe } from 'lucide-react';
import { cn } from '../../lib/utils';

export function LanguageSwitcher({ className }: { className?: string }) {
  const { i18n, t } = useTranslation();

  const handleLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    i18n.changeLanguage(e.target.value);
  };

  return (
    <div className={cn("relative inline-flex items-center", className)}>
      <Globe 
        size={18} 
        className="absolute left-3 pointer-events-none" 
        style={{ color: 'var(--color-text-secondary)' }} 
      />
      <select
        value={i18n.resolvedLanguage || 'en'}
        onChange={handleLanguageChange}
        className="appearance-none bg-transparent py-2 pl-9 pr-8 rounded-full outline-none text-sm font-medium transition-all duration-200 cursor-pointer"
        style={{
          color: 'var(--color-text-primary)',
          border: '1px solid var(--color-border)',
          background: 'var(--color-bg-elevated)'
        }}
      >
        <option value="en">{t('language.en', 'English')}</option>
        <option value="am">{t('language.am', 'አማርኛ')}</option>
      </select>
      <div 
        className="absolute right-3 pointer-events-none opacity-50"
        style={{ color: 'var(--color-text-primary)' }}
      >
        <svg width="10" height="6" viewBox="0 0 10 6" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>
    </div>
  );
}
