import { TMDBResponse, Movie, TVShow, MultiSearchResult, TMDBVideo } from '../types/tmdb';

const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const TMDB_API_KEY = process.env.EXPO_PUBLIC_TMDB_API_KEY;

const fetchFromTMDB = async <T>(endpoint: string, params: Record<string, string> = {}): Promise<T> => {
    const queryParams = new URLSearchParams({
        api_key: TMDB_API_KEY || '',
        ...params,
    });

    const response = await fetch(`${TMDB_BASE_URL}${endpoint}?${queryParams}`);

    if (!response.ok) {
        throw new Error(`Failed to fetch from TMDB: ${response.statusText}`);
    }

    return response.json();
};

export const tmdbApi = {
    getTrending: (page = 1) =>
        fetchFromTMDB<TMDBResponse<Movie | TVShow>>('/trending/all/week', { page: page.toString() }),

    getNowPlayingMovies: (page = 1) =>
        fetchFromTMDB<TMDBResponse<Movie>>('/movie/now_playing', { page: page.toString() }),

    getTopRatedMovies: (page = 1) =>
        fetchFromTMDB<TMDBResponse<Movie>>('/movie/top_rated', { page: page.toString() }),

    getPopularMovies: (page = 1) =>
        fetchFromTMDB<TMDBResponse<Movie>>('/movie/popular', { page: page.toString() }),

    getUpcomingMovies: (page = 1) =>
        fetchFromTMDB<TMDBResponse<Movie>>('/movie/upcoming', { page: page.toString() }),

    multiSearch: (query: string, page = 1) =>
        fetchFromTMDB<TMDBResponse<MultiSearchResult>>('/search/multi', { query, page: page.toString() }),

    discoverMovies: (params: Record<string, string>) =>
        fetchFromTMDB<TMDBResponse<Movie>>('/discover/movie', params),

    discoverTV: (params: Record<string, string>) =>
        fetchFromTMDB<TMDBResponse<TVShow>>('/discover/tv', params),

    getGenres: async (type: 'movie' | 'tv') => {
        return fetchFromTMDB<{ genres: { id: number; name: string }[] }>(`/genre/${type}/list`);
    },

    getVideos: (type: 'movie' | 'tv', id: number) =>
        fetchFromTMDB<{ id: number; results: TMDBVideo[] }>(`/${type}/${id}/videos`),

    getTVExternalIds: (id: number) =>
        fetchFromTMDB<{ id: number; tvdb_id: number | null; imdb_id: string | null }>(`/tv/${id}/external_ids`),
};

export const getImageUrl = (path: string | null, size: 'w200' | 'w500' | 'original' = 'w500') => {
    if (!path) return null;
    return `https://image.tmdb.org/t/p/${size}${path}`;
};
