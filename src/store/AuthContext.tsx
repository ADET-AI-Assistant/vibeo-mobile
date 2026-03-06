import React, { createContext, useContext, useEffect, useState } from 'react';
import { AppUser, convexApi } from '../api/convex';

interface AuthContextType {
    user: AppUser | null;
    token: string | null;
    loading: boolean;
    login: (email: string, password: string) => Promise<void>;
    register: (email: string, password: string, name?: string) => Promise<void>;
    logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    token: null,
    loading: true,
    login: async () => {},
    register: async () => {},
    logout: async () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<AppUser | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const bootstrap = async () => {
            try {
                const session = await convexApi.getStoredSession();
                if (session) {
                    setUser(session.user);
                    setToken(session.token);
                }
            } finally {
                setLoading(false);
            }
        };

        bootstrap();
    }, []);

    const login = async (email: string, password: string) => {
        const session = await convexApi.login(email, password);
        setUser(session.user);
        setToken(session.token);
    };

    const register = async (email: string, password: string, name?: string) => {
        const session = await convexApi.register(email, password, name);
        setUser(session.user);
        setToken(session.token);
    };

    const logout = async () => {
        if (token) {
            await convexApi.logout(token);
        } else {
            await convexApi.clearSession();
        }
        setUser(null);
        setToken(null);
    };

    return (
        <AuthContext.Provider value={{ user, token, loading, login, register, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
