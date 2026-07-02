import React, { createContext, useContext, useState, useEffect } from 'react';

type Language = 'EN' | 'AM';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const translations: Record<Language, Record<string, string>> = {
  EN: {
    'nav.home': 'Home',
    'nav.store': 'Store',
    'nav.valuation': 'Valuation',
    'nav.support': 'Support',
    'hero.title': 'The new standard in automotive.',
    'hero.subtitle': 'Direct access to Ethiopia\'s most exclusive inventory.',
    'cta.shop': 'Shop the collection',
    'cta.valuation': 'Get a valuation',
    'filter.title': 'The Collection.',
    'filter.refine': 'Refine Results',
    'filter.price': 'Price Range',
    'card.details': 'View Details',
    'card.inquiry': 'Inquiry',
    'detail.inquire': 'Contact an Advisor',
    'detail.telegram': 'Inquire on Telegram',
    'detail.finance': 'Finance with CBE',
  },
  AM: {
    'nav.home': 'መነሻ',
    'nav.store': 'መኪናዎች',
    'nav.valuation': 'ግምገማ',
    'nav.support': 'እርዳታ',
    'hero.title': 'አዲሱ የአውቶሞቲቭ ደረጃ።',
    'hero.subtitle': 'በኢትዮጵያ ውስጥ ያሉ ምርጥ መኪናዎችን እዚህ ያግኙ።',
    'cta.shop': 'መኪናዎችን ይመልከቱ',
    'cta.valuation': 'ዋጋ ይገምቱ',
    'filter.title': 'ስብስቦች።',
    'filter.refine': 'ውጤቶችን አጣራ',
    'filter.price': 'የዋጋ መጠን',
    'card.details': 'ዝርዝር ይመልከቱ',
    'card.inquiry': 'ጥያቄ',
    'detail.inquire': 'አማካሪ ያግኙ',
    'detail.telegram': 'በቴሌግራም ይጠይቁ',
    'detail.finance': 'በኢትዮጵያ ንግድ ባንክ ፋይናንስ',
  }
};

export const LanguageContext = createContext<LanguageContextType>({
  language: 'EN',
  setLanguage: () => {},
  t: (key: string) => `[CTX] ${key}`,
});

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguage] = useState<Language>(() => {
    return (localStorage.getItem('peacecars_lang') as Language) || 'EN';
  });

  useEffect(() => {
    localStorage.setItem('peacecars_lang', language);
  }, [language]);

  const t = (key: string) => {
    const k = key.trim();
    return translations[language][k] || translations['EN'][k] || k;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export const useLanguage = () => useContext(LanguageContext);
