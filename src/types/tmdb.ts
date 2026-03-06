export interface TMDBResponse<T> {
    page: number;
    results: T[];
    total_pages: number;
    total_results: number;
}

export interface TMDBVideo {
    id: string;
    key: string;
    name: string;
    site: string;
    type: string;
    official: boolean;
}

export interface MediaBase {
    id: number;
    adult: boolean;
    backdrop_path: string | null;
    genre_ids: number[];
    original_language: string;
    original_title?: string;
    overview: string;
    popularity: number;
    poster_path: string | null;
    vote_average: number;
    vote_count: number;
}

export interface Movie extends MediaBase {
    media_type: 'movie';
    title: string;
    release_date: string;
    video: boolean;
}

export interface TVShow extends MediaBase {
    media_type: 'tv';
    name: string;
    original_name: string;
    first_air_date: string;
    origin_country: string[];
}

export interface Person {
    id: number;
    media_type: 'person';
    name: string;
    original_name: string;
    adult: boolean;
    popularity: number;
    gender: number;
    known_for_department: string;
    profile_path: string | null;
    known_for: (Movie | TVShow)[];
}

export type MultiSearchResult = Movie | TVShow | Person;
