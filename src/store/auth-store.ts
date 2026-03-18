import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface User {
  id: string;
  email: string;
  name?: string;
  role: "admin" | "client";
  created_at: string;
  updated_at: string;
  locked?: boolean;
  first_name?: string;
  last_name?: string;
  company?: string;
  title?: string;
}

interface AuthState {
  user: User | null;
  mustChangePassword: boolean;
  setUser: (user: User | null) => void;
  setMustChangePassword: (mustChangePassword: boolean) => void;
  signOut: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      mustChangePassword: false,
      setUser: (user) => set({ user }),
      setMustChangePassword: (mustChangePassword) =>
        set({ mustChangePassword }),
      signOut: () => set({ user: null, mustChangePassword: false }),
    }),
    {
      name: "auth-storage-v4",
      partialize: (state) => ({
        mustChangePassword: state.mustChangePassword,
        user: state.user,
      }),
    }
  )
);
