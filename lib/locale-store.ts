import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type AdminLocale = 'en' | 'ru' | 'uz';

export const LOCALES: { value: AdminLocale; label: string }[] = [
  { value: 'en', label: 'English' },
  { value: 'ru', label: 'Русский' },
  { value: 'uz', label: "O'zbek" },
];

interface LocaleState {
  locale: AdminLocale;
  setLocale: (locale: AdminLocale) => void;
}

export const useLocaleStore = create<LocaleState>()(
  persist(
    (set) => ({
      locale: 'en',
      setLocale: (locale) => set({ locale }),
    }),
    { name: 'admin-locale' }
  )
);
