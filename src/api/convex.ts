import AsyncStorage from '@react-native-async-storage/async-storage';
import { HistoryItem, UserProfile, WatchlistItem } from '../types/user';

const SESSION_KEY = '@vibeo_convex_session';

const requireEnv = (key: 'EXPO_PUBLIC_CONVEX_URL' | 'EXPO_PUBLIC_CONVEX_HTTP_ACTIONS_URL') => {
    const value = process.env[key];
    if (!value) {
        throw new Error(`${key} is not configured. Add it to your .env file.`);
    }
    return value;
};

const CONVEX_URL = requireEnv('EXPO_PUBLIC_CONVEX_URL');
const CONVEX_HTTP_ACTIONS_URL = requireEnv('EXPO_PUBLIC_CONVEX_HTTP_ACTIONS_URL');

type ConvexUser = {
    id?: string;
    uid?: string;
    _id?: string;
    email?: string | null;
    name?: string | null;
};

export type AppUser = {
    uid: string;
    email: string | null;
    name?: string | null;
};

export type AuthSession = {
    token: string;
    user: AppUser;
};

const getBaseUrl = () => CONVEX_HTTP_ACTIONS_URL.replace(/\/+$/, '');

const toAppUser = (user: ConvexUser): AppUser => ({
    uid: user.id || user.uid || user._id || 'unknown_user',
    email: user.email ?? null,
    name: user.name ?? null,
});

const parseAuthSession = (payload: any): AuthSession => {
    const token = payload?.token || payload?.sessionToken || payload?.authToken;
    const user = payload?.user || payload?.account || payload?.profile;

    if (!token || !user) {
        throw new Error('Invalid auth response from Convex');
    }

    return {
        token,
        user: toAppUser(user),
    };
};

const request = async <T>(
    path: string,
    options: { method?: 'GET' | 'POST' | 'DELETE'; token?: string; body?: unknown } = {},
): Promise<T> => {
    const { method = 'POST', token, body } = options;
    const response = await fetch(`${getBaseUrl()}${path}`, {
        method,
        headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: body !== undefined ? JSON.stringify(body) : undefined,
    });

    const text = await response.text();
    let data: any = null;
    try {
        data = text ? JSON.parse(text) : null;
    } catch {
        data = { error: text };
    }

    if (!response.ok) {
        throw new Error(data?.error || data?.message || `Convex request failed (${response.status})`);
    }

    return data as T;
};

export const convexApi = {
    deploymentUrl: CONVEX_URL,
    httpActionsUrl: CONVEX_HTTP_ACTIONS_URL,

    getStoredSession: async (): Promise<AuthSession | null> => {
        const raw = await AsyncStorage.getItem(SESSION_KEY);
        return raw ? (JSON.parse(raw) as AuthSession) : null;
    },

    saveSession: async (session: AuthSession) => {
        await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(session));
    },

    clearSession: async () => {
        await AsyncStorage.removeItem(SESSION_KEY);
    },

    login: async (email: string, password: string): Promise<AuthSession> => {
        const payload = await request<any>('/auth/login', { body: { email, password } });
        const session = parseAuthSession(payload);
        await convexApi.saveSession(session);
        return session;
    },

    register: async (email: string, password: string, name?: string): Promise<AuthSession> => {
        const payload = await request<any>('/auth/register', { body: { email, password, name } });
        const session = parseAuthSession(payload);
        await convexApi.saveSession(session);
        return session;
    },

    logout: async (token: string) => {
        try {
            await request('/auth/logout', { token, body: {} });
        } catch {
            // Ignore server logout failures; clear local session regardless.
        } finally {
            await convexApi.clearSession();
        }
    },

    getProfile: async (token: string, _user: AppUser): Promise<UserProfile | null> => {
        return request<UserProfile | null>('/profile', { method: 'GET', token });
    },

    getWatchlist: async (token: string): Promise<WatchlistItem[]> => {
        return request<WatchlistItem[]>('/watchlist', { method: 'GET', token });
    },

    addToWatchlist: async (token: string, item: WatchlistItem): Promise<void> => {
        await request('/watchlist/add', { token, body: item });
    },

    removeFromWatchlist: async (token: string, mediaId: number): Promise<void> => {
        await request('/watchlist/remove', { token, body: { mediaId } });
    },

    getHistory: async (token: string): Promise<HistoryItem[]> => {
        return request<HistoryItem[]>('/history', { method: 'GET', token });
    },

    updateHistory: async (token: string, item: HistoryItem): Promise<void> => {
        await request('/history/upsert', { token, body: item });
    },
};
