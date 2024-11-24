import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';

interface Localization {
  locale: string;
  setLocale: (locale: string) => void;
}

export function useLocalization(): Localization {
  const { locale, push, pathname } = useRouter();
  const [currentLocale, setCurrentLocale] = useState(locale || 'en');

  useEffect(() => {
    if (locale !== currentLocale) {
      push(pathname, pathname, { locale: currentLocale });
    }
  }, [currentLocale, locale, pathname, push]);

  const setLocale = (locale: string) => {
    setCurrentLocale(locale);
  };

  return { locale: currentLocale, setLocale };
}
