import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { convexApi } from '../api/convex';
import {
    addToWatchlist as djangoAddToWatchlist,
    fetchHistory as djangoFetchHistory,
    fetchWatchlist as djangoFetchWatchlist,
    removeFromWatchlist as djangoRemoveFromWatchlist,
    updateHistory as djangoUpdateHistory,
} from '../api/djangoClient';
import { tmdbApi } from '../api/tmdb';
import { useAuth } from '../store/AuthContext';
import { WatchlistItem, HistoryItem } from '../types/user';

export const useProfile = () => {
    const { user, token } = useAuth();

    return useQuery({
        queryKey: ['profile', user?.uid],
        queryFn: () => convexApi.getProfile(token!, user!),
        enabled: !!user && !!token,
    });
};

export const useWatchlist = () => {
    const { user, token, djangoToken } = useAuth();

    return useQuery({
        queryKey: ['watchlist', user?.uid],
        queryFn: () => djangoToken ? djangoFetchWatchlist() : convexApi.getWatchlist(token!),
        enabled: !!user && (!!djangoToken || !!token),
    });
};

export const useAddToWatchlist = () => {
    const { user, token, djangoToken } = useAuth();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (item: WatchlistItem) => {
            if (djangoToken) {
                await djangoAddToWatchlist(item);
                return;
            }
            return convexApi.addToWatchlist(token!, item);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['watchlist', user?.uid] });
        },
    });
};

export const useRemoveFromWatchlist = () => {
    const { user, token, djangoToken } = useAuth();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (mediaId: number) => djangoToken ? djangoRemoveFromWatchlist(mediaId) : convexApi.removeFromWatchlist(token!, mediaId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['watchlist', user?.uid] });
        },
    });
};

const enrichHistoryPosters = async (items: HistoryItem[]): Promise<HistoryItem[]> => {
    const enriched = await Promise.all(
        items.map(async (item) => {
            if (item.posterPath) return item;
            try {
                const details = await tmdbApi.getDetails(item.mediaType, item.mediaId);
                return { ...item, posterPath: details.poster_path };
            } catch {
                return item;
            }
        })
    );
    return enriched;
};

export const useHistory = () => {
    const { user, token, djangoToken } = useAuth();

    return useQuery({
        queryKey: ['history', user?.uid],
        queryFn: async () => {
            const items = djangoToken ? await djangoFetchHistory() : await convexApi.getHistory(token!);
            return enrichHistoryPosters(items);
        },
        enabled: !!user && (!!djangoToken || !!token),
    });
};

export const useUpdateHistory = () => {
    const { user, token, djangoToken } = useAuth();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (item: HistoryItem) => {
            if (djangoToken) {
                await djangoUpdateHistory(item);
                return;
            }
            return convexApi.updateHistory(token!, item);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['history', user?.uid] });
        },
    });
};
