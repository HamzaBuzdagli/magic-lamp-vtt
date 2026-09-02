import { useGameStore } from './useGameStore';
import { translations, type Language } from '../locales/translations';

export function useTranslation(): {
  t: (key: string, params?: Record<string, string | number>, defaultText?: string) => string;
  language: Language;
  setLanguage: (lang: Language) => void;
} {
  const { language, setLanguage } = useGameStore();

  const t = (key: string, params?: Record<string, string | number>, defaultText?: string): string => {
    const langDict = translations[language] || translations['tr'];
    let text = langDict[key] || translations['tr'][key] || defaultText || key;

    if (params) {
      Object.entries(params).forEach(([paramKey, paramVal]) => {
        text = text.replace(new RegExp(`\\{${paramKey}\\}`, 'g'), String(paramVal));
      });
    }

    return text;
  };

  return { t, language, setLanguage };
}
