import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { authService, type Session } from "@/services/authService";
import type { User } from "@/types";

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<User>;
  loginAsAdmin: () => Promise<User>;
  register: (input: { fullName: string; phone: string; email: string; password: string }) => Promise<User>;
  logout: () => Promise<void>;
  updateProfile: (patch: Partial<Pick<User, "fullName" | "phone" | "email">>) => Promise<User>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    authService.getSession().then((s) => {
      if (!active) return;
      setSession(s);
      setLoading(false);
    });
    return () => {
      active = false;
    };
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const s = await authService.login(email, password);
    setSession(s);
    return s.user;
  }, []);

  const loginAsAdmin = useCallback(async () => {
    const s = await authService.loginAsAdmin();
    setSession(s);
    return s.user;
  }, []);

  const register = useCallback(
    async (input: { fullName: string; phone: string; email: string; password: string }) => {
      const s = await authService.register(input);
      setSession(s);
      return s.user;
    },
    [],
  );

  const logout = useCallback(async () => {
    await authService.logout();
    setSession(null);
  }, []);

  const updateProfile = useCallback(
    async (patch: Partial<Pick<User, "fullName" | "phone" | "email">>) => {
      const user = await authService.updateProfile(patch);
      setSession((prev) => (prev ? { ...prev, user } : prev));
      return user;
    },
    [],
  );

  return (
    <AuthContext.Provider
      value={{
        user: session?.user ?? null,
        loading,
        login,
        loginAsAdmin,
        register,
        logout,
        updateProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
