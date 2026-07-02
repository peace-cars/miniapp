import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import enTranslations from './locales/en.json';
import amTranslations from './locales/am.json';

// Configure standard resources
const resources = {
  en: {
    translation: enTranslations,
  },
  am: {
    translation: amTranslations,
  },
};

i18n
  // detect user language from browser or localStorage
  // learn more: https://github.com/i18next/i18next-browser-languageDetector
  .use(LanguageDetector)
  // pass the i18n instance to react-i18next.
  .use(initReactI18next)
  // init i18next
  // for all options read: https://www.i18next.com/overview/configuration-options
  .init({
    resources,
    fallbackLng: 'en',
    
    // We use context and variables natively in i18next
    // Context example: t('friend', { context: 'male' }) looks for 'friend_male'
    
    interpolation: {
      escapeValue: false, // not needed for react as it escapes by default
    },
    
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'], // cache user language on
    }
  });

export default i18n;
