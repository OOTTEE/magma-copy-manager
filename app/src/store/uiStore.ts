import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface UIState {
  isSidebarCollapsed: boolean;
  isDarkMode: boolean;
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  toggleDarkMode: () => void;
}

/**
 * UIStore
 * 
 * Manages the layout and theme state.
 * Syncs the 'dark' class with the document root for Tailwind support.
 */
export const useUIStore = create<UIState>()(
  persist(
    (set, get) => ({
      isSidebarCollapsed: false,
      isDarkMode: false,
      toggleSidebar: () => set({ isSidebarCollapsed: !get().isSidebarCollapsed }),
      setSidebarCollapsed: (collapsed) => set({ isSidebarCollapsed: collapsed }),
      toggleDarkMode: () => {
        const newDarkMode = !get().isDarkMode;
        set({ isDarkMode: newDarkMode });
        if (newDarkMode) {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
      },
    }),
    {
      name: 'magma-ui-storage',
      onRehydrateStorage: () => (state) => {
        // Apply dark mode on load
        if (state?.isDarkMode) {
          document.documentElement.classList.add('dark');
        }
      },
    }
  )
);
