/**
 * Django API Client for Vibeo Mobile
 * Handles DRF Token Authentication and all protected API requests.
 */
import AsyncStorage from "@react-native-async-storage/async-storage";

const BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL!;
const AUTH_URL = `${BASE_URL}/auth`;
const DJANGO_TOKEN_KEY = "django_auth_token";

// ─── Token Storage Helpers ────────────────────────────────────────────────────

export const storeDjangoToken = async (token: string) => {
    await AsyncStorage.setItem(DJANGO_TOKEN_KEY, token);
};

export const getDjangoToken = async (): Promise<string | null> => {
    return await AsyncStorage.getItem(DJANGO_TOKEN_KEY);
};

export const clearDjangoToken = async () => {
    await AsyncStorage.removeItem(DJANGO_TOKEN_KEY);
};

// ─── Auth Header Builder ──────────────────────────────────────────────────────

const authHeaders = async (): Promise<Record<string, string>> => {
    const token = await getDjangoToken();
    if (!token) throw new Error("No Django auth token found. Please log in.");
    return {
        "Content-Type": "application/json",
        Authorization: `Token ${token}`,
    };
};

// ─── Authentication ───────────────────────────────────────────────────────────

export const djangoLogin = async (username: string, password: string) => {
    const response = await fetch(`${AUTH_URL}/login/`, {
        method: "POST",
        headers: { "Content-Type": "application/json; charset=utf-8" },
        body: JSON.stringify({ username, password }),
    });

    const text = await response.text();
    let data: any = {};
    try {
        data = JSON.parse(text);
    } catch {
        throw new Error(`Login failed (status ${response.status})`);
    }

    if (!response.ok) {
        throw new Error(data?.error || "Login failed.");
    }

    await storeDjangoToken(data.token);
    if (__DEV__)
        console.log("✅ Django token stored:", data.token?.slice(0, 10) + "...");
    return data;
};

export const djangoRegister = async (
    email: string,
    password: string,
    username: string,
    name?: string,
) => {
    const response = await fetch(`${AUTH_URL}/register/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            username,
            email,
            password,
            ...(name ? { first_name: name } : {}),
        }),
    });

    const text = await response.text();
    let data: any = {};
    try {
        data = JSON.parse(text);
    } catch {
        throw new Error(`Registration failed (status ${response.status})`);
    }

    if (!response.ok) {
        const firstError = Object.values(data)?.[0];
        throw new Error(
            Array.isArray(firstError)
                ? (firstError[0] as string)
                : "Registration failed.",
        );
    }

    await storeDjangoToken(data.token);
    if (__DEV__)
        console.log("✅ Django token stored:", data.token?.slice(0, 10) + "...");
    return data;
};

// ─── Protected Requests ───────────────────────────────────────────────────────

export const fetchWatchlist = async () => {
    const headers = await authHeaders();
    const response = await fetch(`${BASE_URL}/watchlist/`, { headers });

    if (response.status === 401)
        throw new Error("Unauthorized. Please log in again.");
    if (!response.ok) throw new Error("Failed to fetch watchlist.");

    return await response.json();
};

export const addToWatchlist = async (item: {
    tmdb_id: number;
    media_type: "movie" | "tv";
    title: string;
    poster_path?: string;
}) => {
    const headers = await authHeaders();
    const response = await fetch(`${BASE_URL}/watchlist/`, {
        method: "POST",
        headers,
        body: JSON.stringify(item),
    });

    if (response.status === 401)
        throw new Error("Unauthorized. Please log in again.");
    if (!response.ok) throw new Error("Failed to add to watchlist.");

    return await response.json();
};

export const removeFromWatchlist = async (id: number) => {
    const headers = await authHeaders();
    const response = await fetch(`${BASE_URL}/watchlist/${id}/`, {
        method: "DELETE",
        headers,
    });

    if (response.status === 401)
        throw new Error("Unauthorized. Please log in again.");
    if (!response.ok) throw new Error("Failed to remove from watchlist.");
};

// ─── Public Endpoints ─────────────────────────────────────────────────────────

export const syncUserStats = async (stats: any) => {
    try {
        const response = await fetch(`${BASE_URL}/sync-stats/`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                firebase_uid: stats.uid,
                username: stats.displayName || stats.email?.split("@")[0] || "User",
                avatar_url: stats.photoURL || "",
                total_watch_time: stats.totalWatchTime || 0,
                current_streak: stats.streakData?.current || 0,
                highest_streak: stats.streakData?.highest || 0,
            }),
        });

        if (!response.ok) throw new Error(`Sync failed: ${response.statusText}`);
        return await response.json();
    } catch (error) {
        console.error("Django Sync Error:", error);
        return null;
    }
};

export const fetchLeaderboard = async () => {
    try {
        const response = await fetch(`${BASE_URL}/leaderboard/`);
        if (!response.ok) throw new Error(`Fetch failed: ${response.statusText}`);
        return await response.json();
    } catch (error) {
        console.error("Leaderboard Fetch Error:", error);
        return [];
    }
};
