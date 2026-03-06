import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    ActivityIndicator,
    FlatList,
    TouchableOpacity,
    useWindowDimensions,
    NativeSyntheticEvent,
    NativeScrollEvent,
    Alert,
    Linking,
    Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Menu, Search, MessageCircle, ChevronLeft, ChevronRight } from 'lucide-react-native';
import {
    useTrendingQuery,
    useNowPlayingQuery,
    useTopRatedQuery,
} from '../hooks/useTMDB';
import { MediaCard } from '../components/MediaCard';
import { Movie, TVShow } from '../types/tmdb';
import { getImageUrl, tmdbApi } from '../api/tmdb';
import { getFanartLogoUrl } from '../api/fanart';
import { getMediaTitle, getMediaType, getMediaYear } from '../utils/media';

const MOODS = ['Exciting', 'Relaxing', 'Dark', 'Romantic', 'Comedy'];

type HeroMedia = Movie | TVShow;

const MediaRail = ({
    title,
    data,
    isLoading,
    onNavigate,
}: {
    title: string;
    data: any[];
    isLoading: boolean;
    onNavigate: (item: Movie | TVShow) => void;
}) => {
    if (isLoading) {
        return (
            <View style={styles.railContainer}>
                <View style={styles.railHeader}>
                    <Text style={styles.railTitle}>{title}</Text>
                </View>
                <ActivityIndicator size="small" color="#ffffff" style={styles.loader} />
            </View>
        );
    }

    if (!data || data.length === 0) return null;

    return (
        <View style={styles.railContainer}>
            <View style={styles.railHeader}>
                <Text style={styles.railTitle}>{title}</Text>
                <TouchableOpacity activeOpacity={0.8}>
                    <Text style={styles.seeAll}>See All</Text>
                </TouchableOpacity>
            </View>
            <FlatList
                horizontal
                showsHorizontalScrollIndicator={false}
                data={data}
                keyExtractor={(item) => item.id.toString()}
                renderItem={({ item }) => <MediaCard item={item} onPress={onNavigate} />}
                contentContainerStyle={styles.railList}
            />
        </View>
    );
};

const HomeScreen = () => {
    const insets = useSafeAreaInsets();
    const navigation = useNavigation<any>();
    const { width } = useWindowDimensions();
    const heroListRef = useRef<FlatList<HeroMedia>>(null);

    const trending = useTrendingQuery();
    const nowPlaying = useNowPlayingQuery();
    const topRated = useTopRatedQuery();

    const [activeHeroIndex, setActiveHeroIndex] = useState(0);
    const [trailerKeys, setTrailerKeys] = useState<Record<number, string | null>>({});
    const [heroLogoMap, setHeroLogoMap] = useState<Record<number, string | null>>({});

    const heroItems = useMemo(
        () =>
            ((trending.data?.pages[0]?.results || []) as HeroMedia[])
                .filter((item) => (getMediaType(item) === 'movie' || getMediaType(item) === 'tv') && item.backdrop_path)
                .slice(0, 6),
        [trending.data],
    );

    useEffect(() => {
        let cancelled = false;

        const loadTrailers = async () => {
            if (heroItems.length === 0) {
                setTrailerKeys({});
                return;
            }

            const trailerEntries = await Promise.all(
                heroItems.map(async (item) => {
                    try {
                        const payload = await tmdbApi.getVideos(getMediaType(item), item.id);
                        const trailer =
                            payload.results.find((video) => video.site === 'YouTube' && video.type === 'Trailer' && video.official) ||
                            payload.results.find((video) => video.site === 'YouTube' && video.type === 'Trailer') ||
                            payload.results.find((video) => video.site === 'YouTube');

                        return [item.id, trailer?.key ?? null] as const;
                    } catch {
                        return [item.id, null] as const;
                    }
                }),
            );

            if (!cancelled) {
                setTrailerKeys(Object.fromEntries(trailerEntries));
            }
        };

        loadTrailers();

        return () => {
            cancelled = true;
        };
    }, [heroItems]);

    useEffect(() => {
        setActiveHeroIndex(0);
    }, [heroItems.length]);

    useEffect(() => {
        let cancelled = false;

        const loadHeroLogos = async () => {
            if (heroItems.length === 0) {
                setHeroLogoMap({});
                return;
            }

            const logoEntries = await Promise.all(
                heroItems.map(async (item) => {
                    try {
                        const logoUrl = await getFanartLogoUrl(getMediaType(item), item.id);
                        return [item.id, logoUrl] as const;
                    } catch {
                        return [item.id, null] as const;
                    }
                }),
            );

            if (!cancelled) {
                setHeroLogoMap(Object.fromEntries(logoEntries));
            }
        };

        loadHeroLogos();

        return () => {
            cancelled = true;
        };
    }, [heroItems]);

    const handleCardPress = (item: Movie | TVShow) => {
        navigation.navigate('Detail', { item });
    };

    const handleHeroScrollEnd = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
        const offsetX = event.nativeEvent.contentOffset.x;
        const index = Math.round(offsetX / width);
        setActiveHeroIndex(index);
    };

    const moveHero = (direction: -1 | 1) => {
        if (!heroItems.length) return;

        const nextIndex = Math.max(0, Math.min(heroItems.length - 1, activeHeroIndex + direction));
        heroListRef.current?.scrollToIndex({ index: nextIndex, animated: true });
        setActiveHeroIndex(nextIndex);
    };

    const openTrailer = async (item: HeroMedia) => {
        const trailerKey = trailerKeys[item.id];

        if (!trailerKey) {
            Alert.alert('Trailer unavailable', 'No trailer found for this title yet.');
            return;
        }

        await Linking.openURL(`https://www.youtube.com/watch?v=${trailerKey}`);
    };

    const heroCardWidth = width;

    return (
        <ScrollView
            style={styles.container}
            contentContainerStyle={[styles.contentContainer, { paddingTop: insets.top }]}
            showsVerticalScrollIndicator={false}
        >
            <View style={styles.header}>
                <Text style={styles.brand}>Vibeo</Text>
                <View style={styles.headerActions}>
                    <Search color="#b4a2b2" size={20} />
                    <Menu color="#f0e7ee" size={26} />
                </View>
            </View>

            {heroItems.length > 0 ? (
                <View style={styles.heroCarouselWrap}>
                    <FlatList
                        ref={heroListRef}
                        data={heroItems}
                        horizontal
                        pagingEnabled
                        showsHorizontalScrollIndicator={false}
                        keyExtractor={(item) => item.id.toString()}
                        renderItem={({ item, index }) => {
                            const trailerKey = trailerKeys[item.id];
                            const backdropUrl = getImageUrl(item.backdrop_path, 'original');
                            const logoUrl = heroLogoMap[item.id];

                            return (
                                <View style={[styles.heroSlide, { width: heroCardWidth }]}>
                                    <TouchableOpacity
                                        activeOpacity={0.95}
                                        style={styles.heroCard}
                                        onPress={() => handleCardPress(item)}
                                    >
                                        <View style={styles.heroMediaFallback}>
                                            {backdropUrl ? <Image source={{ uri: backdropUrl }} style={styles.heroMedia} /> : null}
                                        </View>

                                        <View style={styles.heroShadeStrong} />
                                        <View style={styles.heroShadeSoft} />

                                        <View style={styles.heroBody}>
                                            {logoUrl ? (
                                                <Image source={{ uri: logoUrl }} style={styles.heroTitleLogo} resizeMode="contain" />
                                            ) : (
                                                <Text style={styles.heroTitle}>{getMediaTitle(item)}</Text>
                                            )}
                                            <Text style={styles.heroMeta}>
                                                {getMediaYear(item)} {item.vote_average.toFixed(1)} {getMediaType(item) === 'movie' ? 'HD' : 'SERIES'}
                                            </Text>
                                            <Text style={styles.heroOverview} numberOfLines={3}>
                                                {item.overview || 'No overview available.'}
                                            </Text>

                                            <View style={styles.heroCtas}>
                                                <TouchableOpacity
                                                    style={styles.watchNowButton}
                                                    onPress={() => navigation.navigate('Play', { item, season: 1, episode: 1 })}
                                                >
                                                    <Text style={styles.watchNowText}>Watch Now</Text>
                                                </TouchableOpacity>
                                                <TouchableOpacity
                                                    style={styles.secondaryButton}
                                                    onPress={() => openTrailer(item)}
                                                >
                                                    <Text style={styles.secondaryText}>Trailer</Text>
                                                </TouchableOpacity>
                                                <TouchableOpacity
                                                    style={styles.secondaryButton}
                                                    onPress={() => handleCardPress(item)}
                                                >
                                                    <Text style={styles.secondaryText}>Details</Text>
                                                </TouchableOpacity>
                                            </View>
                                        </View>
                                    </TouchableOpacity>
                                </View>
                            );
                        }}
                        onMomentumScrollEnd={handleHeroScrollEnd}
                    />

                    <View style={styles.heroFooterRow}>
                        <View style={styles.dotRow}>
                            {heroItems.map((item, index) => (
                                <View
                                    key={item.id}
                                    style={[styles.dot, index === activeHeroIndex ? styles.dotActive : undefined]}
                                />
                            ))}
                        </View>
                        <View style={styles.heroArrowRow}>
                            <TouchableOpacity
                                style={styles.arrowButton}
                                onPress={() => moveHero(-1)}
                                disabled={activeHeroIndex === 0}
                            >
                                <ChevronLeft color="#e8deea" size={18} />
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={styles.arrowButton}
                                onPress={() => moveHero(1)}
                                disabled={activeHeroIndex >= heroItems.length - 1}
                            >
                                <ChevronRight color="#e8deea" size={18} />
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            ) : (
                <View style={styles.heroLoaderWrap}>
                    <ActivityIndicator color="#fff" />
                </View>
            )}

            <View style={styles.moodsBlock}>
                <Text style={styles.moodsTitle}>HOW ARE YOU FEELING TODAY?</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.moodList}>
                    {MOODS.map((mood) => (
                        <TouchableOpacity key={mood} style={styles.moodPill} activeOpacity={0.85}>
                            <Text style={styles.moodText}>{mood}</Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>

            <MediaRail
                title="Trending This Week"
                data={trending.data?.pages[0]?.results || []}
                isLoading={trending.isLoading}
                onNavigate={handleCardPress}
            />

            <MediaRail
                title="Now Playing in Theaters"
                data={nowPlaying.data?.pages[0]?.results || []}
                isLoading={nowPlaying.isLoading}
                onNavigate={handleCardPress}
            />

            <MediaRail
                title="Top Rated of All Time"
                data={topRated.data?.pages[0]?.results || []}
                isLoading={topRated.isLoading}
                onNavigate={handleCardPress}
            />

            <TouchableOpacity style={styles.fab} activeOpacity={0.9}>
                <MessageCircle color="#ffd3e4" size={22} />
            </TouchableOpacity>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#12030d',
    },
    contentContainer: {
        paddingBottom: 104,
    },
    header: {
        paddingHorizontal: 18,
        paddingBottom: 10,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    brand: {
        color: '#ff4f74',
        fontSize: 31 / 2,
        fontWeight: '800',
    },
    headerActions: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 18,
    },
    heroCarouselWrap: {
        marginBottom: 8,
    },
    heroSlide: {
        paddingHorizontal: 14,
    },
    heroCard: {
        borderRadius: 20,
        overflow: 'hidden',
        backgroundColor: '#1d0f19',
        height: 470,
        justifyContent: 'flex-end',
    },
    heroMedia: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: '#12030d',
    },
    heroMediaFallback: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: '#12030d',
    },
    heroShadeStrong: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(8, 2, 8, 0.57)',
    },
    heroShadeSoft: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(89, 4, 31, 0.28)',
    },
    heroBody: {
        paddingHorizontal: 16,
        paddingBottom: 18,
        paddingTop: 90,
    },
    heroTitle: {
        color: '#fff',
        fontSize: 46 / 2,
        fontWeight: '900',
        marginBottom: 8,
    },
    heroTitleLogo: {
        width: '88%',
        height: 72,
        marginBottom: 8,
    },
    heroMeta: {
        color: '#d5c5d0',
        fontSize: 14,
        marginBottom: 8,
    },
    heroOverview: {
        color: '#ddd1d9',
        fontSize: 17,
        lineHeight: 22,
    },
    heroCtas: {
        marginTop: 16,
        flexDirection: 'row',
        gap: 10,
    },
    watchNowButton: {
        backgroundColor: '#ff2d61',
        borderRadius: 26,
        paddingHorizontal: 18,
        paddingVertical: 12,
    },
    watchNowText: {
        color: '#fff',
        fontWeight: '800',
        fontSize: 15,
    },
    secondaryButton: {
        borderColor: 'rgba(255, 255, 255, 0.35)',
        borderWidth: 1,
        borderRadius: 24,
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: 'rgba(19, 14, 20, 0.55)',
    },
    secondaryText: {
        color: '#f5edf2',
        fontWeight: '700',
        fontSize: 14,
    },
    heroFooterRow: {
        marginTop: -4,
        paddingHorizontal: 20,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    dotRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 7,
    },
    dot: {
        width: 7,
        height: 7,
        borderRadius: 4,
        backgroundColor: 'rgba(229, 214, 223, 0.35)',
    },
    dotActive: {
        width: 22,
        borderRadius: 6,
        backgroundColor: '#ff4f79',
    },
    heroArrowRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    arrowButton: {
        width: 42,
        height: 42,
        borderRadius: 21,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.25)',
        backgroundColor: 'rgba(18, 10, 18, 0.75)',
    },
    heroLoaderWrap: {
        marginHorizontal: 14,
        minHeight: 470,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#271824',
    },
    moodsBlock: {
        marginTop: 16,
        paddingVertical: 18,
        backgroundColor: '#1a0714',
    },
    moodsTitle: {
        color: '#8f7487',
        fontSize: 22 / 2,
        fontWeight: '800',
        letterSpacing: 0.8,
        paddingHorizontal: 16,
        marginBottom: 12,
    },
    moodList: {
        paddingHorizontal: 16,
        gap: 10,
    },
    moodPill: {
        backgroundColor: '#5a314b',
        borderRadius: 999,
        paddingHorizontal: 16,
        paddingVertical: 10,
    },
    moodText: {
        color: '#f2e8ef',
        fontWeight: '700',
        fontSize: 14,
    },
    railContainer: {
        marginTop: 22,
    },
    railHeader: {
        paddingHorizontal: 14,
        marginBottom: 12,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    railTitle: {
        color: '#f4edf2',
        fontSize: 36 / 2,
        fontWeight: '800',
    },
    seeAll: {
        color: '#ff6388',
        fontWeight: '700',
        fontSize: 14,
    },
    railList: {
        paddingHorizontal: 14,
    },
    loader: {
        alignSelf: 'flex-start',
        marginLeft: 14,
    },
    fab: {
        position: 'absolute',
        right: 18,
        bottom: 24,
        width: 58,
        height: 58,
        borderRadius: 29,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#ff3f75',
        borderWidth: 2,
        borderColor: '#ff7397',
    },
});

export default HomeScreen;
