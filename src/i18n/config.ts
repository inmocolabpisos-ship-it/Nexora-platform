import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    fallbackLng: 'es',
    debug: false,
    resources: {
      es: {
        translation: {
          welcome: 'Bienvenido a NEXURA',
        },
      },
      en: {
        translation: {
          welcome: 'Welcome to NEXURA',
        },
      },
    },
  });

export default i18n;
