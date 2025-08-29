import { create } from 'zustand';

type AuthState = {
  token?: string;
  user?: { id: string; name: string; email: string };
  login: (token: string, user: AuthState['user']) => void;
  logout: () => void;
};

export const useAuthStore = create<AuthState>((set) => ({
  token: undefined,
  user: undefined,
  login: (token, user) => set({ token, user }),
  logout: () => set({ token: undefined, user: undefined }),
}));
