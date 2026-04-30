import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { convexApi } from '../api/convex';
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
    const { user, token } = useAuth();

    return useQuery({
        queryKey: ['watchlist', user?.uid],
        queryFn: () => convexApi.getWatchlist(token!),
        enabled: !!user && !!token,
    });
};

export const useAddToWatchlist = () => {
    const { user, token } = useAuth();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (item: WatchlistItem) => convexApi.addToWatchlist(token!, item),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['watchlist', user?.uid] });
        },
    });
};

export const useRemoveFromWatchlist = () => {
    const { user, token } = useAuth();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (mediaId: number) => convexApi.removeFromWatchlist(token!, mediaId),
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
    const { user, token } = useAuth();

    return useQuery({
        queryKey: ['history', user?.uid],
        queryFn: async () => {
            const items = await convexApi.getHistory(token!);
            return enrichHistoryPosters(items);
        },
        enabled: !!user && !!token,
    });
};

export const useUpdateHistory = () => {
    const { user, token } = useAuth();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (item: HistoryItem) => convexApi.updateHistory(token!, item),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['history', user?.uid] });
        },
    });
};
