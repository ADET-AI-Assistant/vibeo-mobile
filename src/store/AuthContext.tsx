import React, { createContext, useContext, useEffect, useState } from "react";
import { AppUser, convexApi } from "../api/convex";
import {
  djangoLogin,
  djangoRegister,
  getDjangoToken,
  clearDjangoToken,
} from "../api/djangoClient";

interface AuthContextType {
  user: AppUser | null;
  token: string | null;
  djangoToken: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (
    email: string,
    password: string,
    username: string,
    name?: string,
  ) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  token: null,
  djangoToken: null,
  loading: true,
  login: async () => {},
  register: async () => {},
  logout: async () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<AppUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [djangoToken, setDjangoToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const bootstrap = async () => {
      try {
        const session = await convexApi.getStoredSession();
        if (session) {
          setUser(session.user);
          setToken(session.token);
        }
        const storedDjangoToken = await getDjangoToken();
        if (storedDjangoToken) setDjangoToken(storedDjangoToken);
      } finally {
        setLoading(false);
      }
    };
    bootstrap();
  }, []);

  // email → Convex, derived username → Django
  const login = async (email: string, password: string) => {
    // Django uses username derived from email
    try {
      const username = email.includes("@") ? email.split("@")[0] : email;
      const djangoData = await djangoLogin(username, password);
      setDjangoToken(djangoData.token);
    } catch (e) {
      if (__DEV__) console.warn("Django login failed (non-blocking):", e);
    }

    // Convex uses email — this is the primary auth
    const convexSession = await convexApi.login(email, password);
    setUser(convexSession.user);
    setToken(convexSession.token);
  };

  // Register: Django gets username explicitly, Convex gets email
  const register = async (
    email: string,
    password: string,
    username: string,
    name?: string,
  ) => {
    // Django registration — non-blocking
    try {
      const djangoData = await djangoRegister(email, password, username, name);
      setDjangoToken(djangoData.token);
    } catch (e) {
      if (__DEV__) console.warn("Django register failed (non-blocking):", e);
    }

    // Convex registration — primary, this must succeed
    const convexSession = await convexApi.register(email, password, name);
    setUser(convexSession.user);
    setToken(convexSession.token);
  };

  const logout = async () => {
    await Promise.all([
      token ? convexApi.logout(token) : convexApi.clearSession(),
      clearDjangoToken(),
    ]);
    setUser(null);
    setToken(null);
    setDjangoToken(null);
  };

  return (
    <AuthContext.Provider
      value={{ user, token, djangoToken, loading, login, register, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
