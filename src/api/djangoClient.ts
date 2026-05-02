/**
 * Django API Client for Vibeo Mobile.
 * Handles DRF Token Authentication and protected API requests.
 */
import AsyncStorage from "@react-native-async-storage/async-storage";
import { HistoryItem, WatchlistItem } from "../types/user";

const rawBaseUrl = process.env.EXPO_PUBLIC_API_BASE_URL || "http://127.0.0.1:8000/api/v1";
const BASE_URL = rawBaseUrl.replace(/\/+$/, "");
const AUTH_URL = `${BASE_URL}/auth`;
const DJANGO_TOKEN_KEY = "django_auth_token";

type DjangoWatchlistItem = {
    id: number;
    tmdb_id: number;
    title?: string | null;
    name?: string | null;
    poster_path?: string | null;
    media_type?: "movie" | "tv";
    status?: WatchlistItem["status"] | "dropped";
    added_at?: string;
};

type DjangoHistoryItem = {
    id: number;
    tmdb_id: number;
    title?: string | null;
    name?: string | null;
    poster_path?: string | null;
    media_type?: "movie" | "tv";
    watched_at?: string;
};

const parseResponse = async (response: Response) => {
    const text = await response.text();
    let data: any = null;

    try {
        data = text ? JSON.parse(text) : null;
    } catch {
        throw new Error(`Invalid API response (status ${response.status})`);
    }

    if (!response.ok) {
        const firstError = data && typeof data === "object" ? Object.values(data).flat()[0] : null;
        throw new Error(
            data?.error ||
            data?.detail ||
            (typeof firstError === "string" ? firstError : null) ||
            `Request failed (${response.status})`,
        );
    }

    return data;
};

const normalizePaginated = (data: any) => data?.results || (Array.isArray(data) ? data : []);

const toWatchlistItem = (item: DjangoWatchlistItem): WatchlistItem => ({
    mediaId: Number(item.tmdb_id),
    mediaType: item.media_type === "tv" ? "tv" : "movie",
    title: item.title || item.name || "Untitled",
    posterPath: item.poster_path || null,
    status: item.status === "dropped" ? "on_hold" : (item.status || "planning"),
    addedAt: item.added_at ? Date.parse(item.added_at) : Date.now(),
});

const toHistoryItem = (item: DjangoHistoryItem): HistoryItem => ({
    mediaId: Number(item.tmdb_id),
    mediaType: item.media_type === "tv" ? "tv" : "movie",
    title: item.title || item.name || "Untitled",
    posterPath: item.poster_path || null,
    lastWatchedAt: item.watched_at ? Date.parse(item.watched_at) : Date.now(),
});

const toDjangoWatchlistPayload = (item: WatchlistItem) => ({
    tmdb_id: Number(item.mediaId),
    media_type: item.mediaType,
    title: item.mediaType === "movie" ? item.title : null,
    name: item.mediaType === "tv" ? item.title : null,
    poster_path: item.posterPath || null,
    status: item.status,
});

const toDjangoHistoryPayload = (item: HistoryItem) => ({
    tmdb_id: Number(item.mediaId),
    media_type: item.mediaType,
    title: item.mediaType === "movie" ? item.title : null,
    name: item.mediaType === "tv" ? item.title : null,
    poster_path: item.posterPath || null,
});

export const storeDjangoToken = async (token: string) => {
    await AsyncStorage.setItem(DJANGO_TOKEN_KEY, token);
};

export const getDjangoToken = async (): Promise<string | null> => {
    return await AsyncStorage.getItem(DJANGO_TOKEN_KEY);
};

export const clearDjangoToken = async () => {
    await AsyncStorage.removeItem(DJANGO_TOKEN_KEY);
};

const authHeaders = async (): Promise<Record<string, string>> => {
    const token = await getDjangoToken();
    if (!token) throw new Error("Unauthorized. Please log in again.");
    return {
        "Content-Type": "application/json",
        Authorization: `Token ${token}`,
    };
};

export const djangoLogin = async (username: string, password: string) => {
    const response = await fetch(`${AUTH_URL}/login/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
    });

    const data = await parseResponse(response);
    await storeDjangoToken(data.token);
    if (__DEV__) console.log("Django token stored:", `${data.token?.slice(0, 10)}...`);
    return data;
};

export const djangoRegister = async (
    email: string,
    password: string,
    username: string,
    _name?: string,
) => {
    const response = await fetch(`${AUTH_URL}/register/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, email, password }),
    });

    const data = await parseResponse(response);
    await storeDjangoToken(data.token);
    if (__DEV__) console.log("Django token stored:", `${data.token?.slice(0, 10)}...`);
    return data;
};

export const fetchWatchlist = async (): Promise<WatchlistItem[]> => {
    const headers = await authHeaders();
    const response = await fetch(`${BASE_URL}/watchlist/`, { headers });
    const data = normalizePaginated(await parseResponse(response));
    return data.map(toWatchlistItem);
};

export const addToWatchlist = async (item: WatchlistItem) => {
    const headers = await authHeaders();
    const response = await fetch(`${BASE_URL}/watchlist/`, {
        method: "POST",
        headers,
        body: JSON.stringify(toDjangoWatchlistPayload(item)),
    });

    return toWatchlistItem(await parseResponse(response));
};

export const updateWatchlistStatus = async (mediaId: number, status: WatchlistItem["status"]) => {
    const headers = await authHeaders();
    const rawItems = normalizePaginated(
        await parseResponse(await fetch(`${BASE_URL}/watchlist/`, { headers })),
    ) as DjangoWatchlistItem[];
    const existing = rawItems.find((item) => Number(item.tmdb_id) === Number(mediaId));

    if (!existing) throw new Error("Watchlist item not found.");

    const response = await fetch(`${BASE_URL}/watchlist/${existing.id}/`, {
        method: "PATCH",
        headers,
        body: JSON.stringify({ status }),
    });

    return toWatchlistItem(await parseResponse(response));
};

export const removeFromWatchlist = async (mediaId: number) => {
    const headers = await authHeaders();
    const rawItems = normalizePaginated(
        await parseResponse(await fetch(`${BASE_URL}/watchlist/`, { headers })),
    ) as DjangoWatchlistItem[];
    const existing = rawItems.find((item) => Number(item.tmdb_id) === Number(mediaId));

    if (!existing) return;

    const response = await fetch(`${BASE_URL}/watchlist/${existing.id}/`, {
        method: "DELETE",
        headers,
    });
    await parseResponse(response);
};

export const fetchHistory = async (): Promise<HistoryItem[]> => {
    const headers = await authHeaders();
    const response = await fetch(`${BASE_URL}/history/`, { headers });
    const data = normalizePaginated(await parseResponse(response));
    return data.map(toHistoryItem);
};

export const updateHistory = async (item: HistoryItem) => {
    const headers = await authHeaders();
    const response = await fetch(`${BASE_URL}/history/`, {
        method: "POST",
        headers,
        body: JSON.stringify(toDjangoHistoryPayload(item)),
    });

    return toHistoryItem(await parseResponse(response));
};

export const syncUserStats = async (stats: any) => {
    try {
        const response = await fetch(`${BASE_URL}/sync-stats/`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                firebase_uid: stats.uid,
                username: stats.displayName || stats.email?.split("@")[0] || stats.name || "User",
                avatar_url: stats.photoURL || "",
                total_watch_time: stats.totalWatchTime || 0,
                current_streak: stats.streakData?.current || 0,
                highest_streak: stats.streakData?.highest || 0,
            }),
        });

        return await parseResponse(response);
    } catch (error) {
        console.error("Django Sync Error:", error);
        return null;
    }
};

export const fetchLeaderboard = async () => {
    try {
        const response = await fetch(`${BASE_URL}/leaderboard/`);
        return await parseResponse(response);
    } catch (error) {
        console.error("Leaderboard Fetch Error:", error);
        return [];
    }
};

