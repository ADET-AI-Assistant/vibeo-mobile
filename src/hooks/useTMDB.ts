import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { tmdbApi } from '../api/tmdb';

export const useTrendingQuery = () => {
    return useInfiniteQuery({
        queryKey: ['trending'],
        queryFn: ({ pageParam = 1 }) => tmdbApi.getTrending(pageParam),
        initialPageParam: 1,
        getNextPageParam: (lastPage) =>
            lastPage.page < lastPage.total_pages ? lastPage.page + 1 : undefined,
    });
};

export const useNowPlayingQuery = () => {
    return useInfiniteQuery({
        queryKey: ['now_playing'],
        queryFn: ({ pageParam = 1 }) => tmdbApi.getNowPlayingMovies(pageParam),
        initialPageParam: 1,
        getNextPageParam: (lastPage) =>
            lastPage.page < lastPage.total_pages ? lastPage.page + 1 : undefined,
    });
};

export const useTopRatedQuery = () => {
    return useInfiniteQuery({
        queryKey: ['top_rated'],
        queryFn: ({ pageParam = 1 }) => tmdbApi.getTopRatedMovies(pageParam),
        initialPageParam: 1,
        getNextPageParam: (lastPage) =>
            lastPage.page < lastPage.total_pages ? lastPage.page + 1 : undefined,
    });
};

export const usePopularQuery = () => {
    return useInfiniteQuery({
        queryKey: ['popular'],
        queryFn: ({ pageParam = 1 }) => tmdbApi.getPopularMovies(pageParam),
        initialPageParam: 1,
        getNextPageParam: (lastPage) =>
            lastPage.page < lastPage.total_pages ? lastPage.page + 1 : undefined,
    });
};

export const useUpcomingQuery = () => {
    return useInfiniteQuery({
        queryKey: ['upcoming'],
        queryFn: ({ pageParam = 1 }) => tmdbApi.getUpcomingMovies(pageParam),
        initialPageParam: 1,
        getNextPageParam: (lastPage) =>
            lastPage.page < lastPage.total_pages ? lastPage.page + 1 : undefined,
    });
};

export const useMultiSearch = (query: string) => {
    return useInfiniteQuery({
        queryKey: ['search', 'multi', query],
        queryFn: ({ pageParam = 1 }) => tmdbApi.multiSearch(query, pageParam),
        initialPageParam: 1,
        getNextPageParam: (lastPage) =>
            lastPage.page < lastPage.total_pages ? lastPage.page + 1 : undefined,
        enabled: query.length > 2, // Only fetch when query is > 2 characters
    });
};

export const useMovieGenresQuery = () => {
    return useQuery({
        queryKey: ['genres', 'movie'],
        queryFn: () => tmdbApi.getGenres('movie'),
        staleTime: 1000 * 60 * 60,
    });
};
