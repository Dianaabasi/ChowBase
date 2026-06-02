import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface User {
  id: string;
  email?: string;
  is_pro: boolean;
  username?: string | null;
  has_onboarded?: boolean;
}

interface AuthStore {
  user: User | null;
  isProUser: boolean;
  setUser: (user: User) => void;
  clearUser: () => void;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      user: null,
      isProUser: false,
      setUser: (user) => set({ user, isProUser: user.is_pro }),
      clearUser: () => set({ user: null, isProUser: false }),
    }),
    { 
      name: "chowbase-auth",
      storage: createJSONStorage(() => AsyncStorage)
    },
  ),
);
