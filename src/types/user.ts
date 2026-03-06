import { Movie, TVShow } from './tmdb';

export type WatchStatus = 'watching' | 'completed' | 'planning' | 'on_hold';

export interface WatchlistItem {
    mediaId: number;
    mediaType: 'movie' | 'tv';
    title: string;
    posterPath: string | null;
    status: WatchStatus;
    addedAt: number; // Unix timestamp
}

export interface HistoryItem {
    mediaId: number;
    mediaType: 'movie' | 'tv';
    title: string;
    posterPath: string | null;
    lastWatchedAt: number; // Unix timestamp
    season?: number;
    episode?: number;
}

export interface UserProfile {
    uid: string;
    email: string | null;
    onboarded: boolean;
    totalWatchTime: number; // in seconds
    favoriteMovies: Partial<Movie>[];
}
