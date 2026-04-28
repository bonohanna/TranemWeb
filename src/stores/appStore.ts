import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

type Language = 'ar' | 'en'

interface AppState {
  language: Language
  setLanguage: (language: Language) => void
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      language: 'ar',
      setLanguage: (language) => set({ language }),
    }),
    {
      name: 'tranem-web-ui',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ language: state.language }),
    },
  ),
)
