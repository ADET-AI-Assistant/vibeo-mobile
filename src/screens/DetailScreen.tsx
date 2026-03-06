import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Image,
    ScrollView,
    TouchableOpacity,
    ImageBackground,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft, MessageCircle } from 'lucide-react-native';
import { getImageUrl } from '../api/tmdb';
import { getFanartLogoUrl } from '../api/fanart';
import { useAddToWatchlist, useRemoveFromWatchlist, useWatchlist } from '../hooks/useFirestore';
import { WatchlistItem } from '../types/user';
import { getMediaTitle, getMediaType, getMediaYear } from '../utils/media';

const DetailScreen = ({ route, navigation }: any) => {
    const { item } = route.params;
    const insets = useSafeAreaInsets();

    const title = getMediaTitle(item);
    const year = getMediaYear(item);
    const backdropUrl = getImageUrl(item.backdrop_path, 'original');
    const posterUrl = getImageUrl(item.poster_path, 'w500');
    const [titleLogoUrl, setTitleLogoUrl] = useState<string | null>(null);

    const { data: watchlist } = useWatchlist();
    const addToWatchlist = useAddToWatchlist();
    const removeFromWatchlist = useRemoveFromWatchlist();

    const isWatchlisted = watchlist?.some((w) => w.mediaId === item.id);

    useEffect(() => {
        let cancelled = false;

        const loadLogo = async () => {
            try {
                const logoUrl = await getFanartLogoUrl(getMediaType(item), item.id);
                if (!cancelled) {
                    setTitleLogoUrl(logoUrl);
                }
            } catch {
                if (!cancelled) {
                    setTitleLogoUrl(null);
                }
            }
        };

        loadLogo();

        return () => {
            cancelled = true;
        };
    }, [item]);

    const toggleWatchlist = () => {
        if (isWatchlisted) {
            removeFromWatchlist.mutate(item.id);
        } else {
            const watchlistItem: WatchlistItem = {
                mediaId: item.id,
                mediaType: getMediaType(item),
                title,
                posterPath: item.poster_path,
                status: 'planning',
                addedAt: Date.now(),
            };
            addToWatchlist.mutate(watchlistItem);
        }
    };

    return (
        <ScrollView style={styles.container} bounces={false} showsVerticalScrollIndicator={false}>
            <View style={styles.heroContainer}>
                <ImageBackground
                    source={backdropUrl ? { uri: backdropUrl } : undefined}
                    style={styles.backdrop}
                    imageStyle={styles.backdropImage}
                >
                    <View style={styles.heroOverlayStrong} />
                    <View style={styles.heroOverlaySoft} />

                    <TouchableOpacity
                        style={[styles.backButton, { top: insets.top + 8 }]}
                        onPress={() => navigation.goBack()}
                        activeOpacity={0.85}
                    >
                        <ArrowLeft color="#f7eff4" size={18} />
                        <Text style={styles.backButtonText}>Back</Text>
                    </TouchableOpacity>

                    {posterUrl ? <Image source={{ uri: posterUrl }} style={styles.floatingPoster} /> : null}
                </ImageBackground>
            </View>

            <View style={styles.contentContainer}>
                {titleLogoUrl ? (
                    <Image source={{ uri: titleLogoUrl }} style={styles.titleLogo} resizeMode="contain" />
                ) : (
                    <Text style={styles.title}>{title}</Text>
                )}
                <Text style={styles.metaText}>
                    {year}   {item.vote_average.toFixed(1)}   {getMediaType(item) === 'movie' ? 'PG-13' : 'TV'}   HD
                </Text>

                <View style={styles.tagRow}>
                    <View style={styles.tag}><Text style={styles.tagText}>{getMediaType(item) === 'movie' ? 'Movie' : 'Series'}</Text></View>
                    <View style={styles.tag}><Text style={styles.tagText}>Trending</Text></View>
                    <View style={styles.tag}><Text style={styles.tagText}>Mystery</Text></View>
                </View>

                <Text style={styles.overview}>{item.overview || 'No overview available.'}</Text>

                <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Popularity:</Text>
                    <Text style={styles.infoValue}>{Math.round(item.popularity || 0).toLocaleString()}</Text>
                </View>
                <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Votes:</Text>
                    <Text style={styles.infoValue}>{(item.vote_count || 0).toLocaleString()}</Text>
                </View>

                <TouchableOpacity
                    style={styles.playButton}
                    onPress={() => navigation.navigate('Play', { item, season: 1, episode: 1 })}
                    activeOpacity={0.85}
                >
                    <Text style={styles.playButtonText}>Play</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.watchButton} onPress={toggleWatchlist} activeOpacity={0.85}>
                    <Text style={styles.watchButtonText}>{isWatchlisted ? 'In Watchlist' : 'Add to Watchlist'}</Text>
                </TouchableOpacity>
            </View>

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
    heroContainer: {
        height: 465,
    },
    backdrop: {
        flex: 1,
        justifyContent: 'flex-end',
        alignItems: 'center',
    },
    backdropImage: {
        resizeMode: 'cover',
    },
    heroOverlayStrong: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(7, 3, 9, 0.68)',
    },
    heroOverlaySoft: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(60, 5, 45, 0.18)',
    },
    backButton: {
        position: 'absolute',
        left: 16,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: 'rgba(20, 13, 24, 0.74)',
    },
    backButtonText: {
        color: '#f7eff4',
        fontWeight: '700',
    },
    floatingPoster: {
        width: 142,
        height: 213,
        borderRadius: 16,
        marginBottom: 28,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.22)',
    },
    contentContainer: {
        marginTop: -8,
        paddingHorizontal: 18,
        paddingBottom: 120,
    },
    title: {
        color: '#fff',
        fontSize: 40 / 2,
        fontWeight: '900',
        textAlign: 'center',
        marginBottom: 8,
    },
    titleLogo: {
        alignSelf: 'center',
        width: '86%',
        height: 86,
        marginBottom: 8,
    },
    metaText: {
        color: '#d8c6d2',
        textAlign: 'center',
        fontSize: 14,
        marginBottom: 14,
    },
    tagRow: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 8,
        flexWrap: 'wrap',
        marginBottom: 16,
    },
    tag: {
        backgroundColor: 'rgba(53, 32, 51, 0.8)',
        borderWidth: 1,
        borderColor: '#5b3f57',
        borderRadius: 999,
        paddingHorizontal: 12,
        paddingVertical: 7,
    },
    tagText: {
        color: '#f2e8ef',
        fontWeight: '700',
        fontSize: 13,
    },
    overview: {
        color: '#e7dae4',
        lineHeight: 26 / 2,
        fontSize: 17 / 2,
        textAlign: 'center',
        marginBottom: 16,
    },
    infoRow: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 6,
        marginBottom: 6,
    },
    infoLabel: {
        color: '#f6ecf2',
        fontWeight: '800',
    },
    infoValue: {
        color: '#ccb7c7',
        fontWeight: '600',
    },
    playButton: {
        marginTop: 18,
        borderRadius: 14,
        paddingVertical: 13,
        alignItems: 'center',
        backgroundColor: '#ff3c73',
    },
    playButtonText: {
        color: '#fff',
        fontWeight: '800',
        fontSize: 16,
    },
    watchButton: {
        marginTop: 10,
        borderRadius: 14,
        paddingVertical: 13,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#5b3f57',
        backgroundColor: '#231120',
    },
    watchButtonText: {
        color: '#f7edf3',
        fontWeight: '800',
        fontSize: 15,
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

export default DetailScreen;
