"use client";

import i18next from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './locales/en.json';
import ur from './locales/ur.json';

i18next
  .use(initReactI18next)
  .init({
    resources: {
      english: { translation: en },
      urdu: { translation: ur }
    },
    lng: 'english', // default language
    fallbackLng: 'english',
    interpolation: {
      escapeValue: false // react already safes from xss
    }
  });

export default i18next;
