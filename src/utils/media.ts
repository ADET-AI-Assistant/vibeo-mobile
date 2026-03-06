export type MediaLike = {
    media_type?: 'movie' | 'tv';
    title?: string;
    name?: string;
    release_date?: string;
    first_air_date?: string;
};

export const getMediaType = (item: MediaLike): 'movie' | 'tv' => {
    if (item.media_type === 'movie' || item.media_type === 'tv') {
        return item.media_type;
    }

    return item.title ? 'movie' : 'tv';
};

export const getMediaTitle = (item: MediaLike) => item.title || item.name || 'Untitled';

export const getMediaReleaseDate = (item: MediaLike) => item.release_date || item.first_air_date || '';

export const getMediaYear = (item: MediaLike) => {
    const releaseDate = getMediaReleaseDate(item);
    return releaseDate ? releaseDate.substring(0, 4) : 'Unknown';
};
