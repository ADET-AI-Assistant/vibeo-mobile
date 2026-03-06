import { tmdbApi } from './tmdb';

const FANART_API_KEY = process.env.EXPO_PUBLIC_FANART_API_KEY;
const FANART_BASE_URL = 'https://webservice.fanart.tv/v3';

type FanartLogoItem = {
    url: string;
    lang?: string;
    likes?: string;
};

type FanartResponse = {
    movielogo?: FanartLogoItem[];
    hdmovielogo?: FanartLogoItem[];
    tvlogo?: FanartLogoItem[];
    hdtvlogo?: FanartLogoItem[];
};

const pickBestLogo = (logos: FanartLogoItem[] = []) => {
    if (!logos.length) return null;

    const english = logos.find((logo) => logo.lang === 'en');
    if (english) return english.url;

    const neutral = logos.find((logo) => !logo.lang || logo.lang === '00');
    if (neutral) return neutral.url;

    return logos[0].url;
};

export const getFanartLogoUrl = async (mediaType: 'movie' | 'tv', mediaId: number) => {
    if (!FANART_API_KEY) return null;

    const endpoint = mediaType === 'movie' ? 'movies' : 'tv';
    let fanartId: string | number = mediaId;

    if (mediaType === 'tv') {
        try {
            const externalIds = await tmdbApi.getTVExternalIds(mediaId);
            if (!externalIds.tvdb_id) {
                return null;
            }
            fanartId = externalIds.tvdb_id;
        } catch {
            return null;
        }
    }

    const response = await fetch(`${FANART_BASE_URL}/${endpoint}/${fanartId}?api_key=${FANART_API_KEY}`);

    if (!response.ok) {
        return null;
    }

    const data = (await response.json()) as FanartResponse;

    if (mediaType === 'movie') {
        return pickBestLogo(data.hdmovielogo) || pickBestLogo(data.movielogo);
    }

    return pickBestLogo(data.hdtvlogo) || pickBestLogo(data.tvlogo);
};
