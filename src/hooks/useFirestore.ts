import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { convexApi } from '../api/convex';
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

export const useHistory = () => {
    const { user, token } = useAuth();

    return useQuery({
        queryKey: ['history', user?.uid],
        queryFn: () => convexApi.getHistory(token!),
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
