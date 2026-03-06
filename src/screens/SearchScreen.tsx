import React, { useMemo, useState } from 'react';
import {
    View,
    Text,
    TextInput,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    ActivityIndicator,
    Image,
} from 'react-native';
import { SendHorizontal, Sparkles } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { AppHeader } from '../components/AppHeader';
import { getVibeyRecommendations, VibeyRecommendation } from '../api/vibey';
import { getImageUrl, tmdbApi } from '../api/tmdb';
import { Movie, TVShow } from '../types/tmdb';
import { getMediaTitle, getMediaType, getMediaYear } from '../utils/media';

type ResolvedRecommendation = {
    item: Movie | TVShow;
    reason: string;
};

const VibeyScreen = () => {
    const navigation = useNavigation<any>();
    const [prompt, setPrompt] = useState('');
    const [loading, setLoading] = useState(false);
    const [errorText, setErrorText] = useState('');
    const [sourceLabel, setSourceLabel] = useState<string | null>(null);
    const [results, setResults] = useState<ResolvedRecommendation[]>([]);

    const quickPrompts = useMemo(
        () => [
            'Surprise me!',
            'Trending sci-fi',
            'Top horror',
            'Hidden gems',
            'Feel-good',
            '90s classics',
            'Mind-benders',
            'Date night',
        ],
        [],
    );

    const resolveRecommendations = async (entries: VibeyRecommendation[]) => {
        const resolved: ResolvedRecommendation[] = [];

        for (const entry of entries) {
            try {
                const queryVariants = [
                    entry.year ? `${entry.title} ${entry.year}` : entry.title,
                    entry.title,
                    entry.title.replace(/\banimes?\b/gi, '').trim(),
                ].filter((query, idx, arr) => query.length > 0 && arr.indexOf(query) === idx);

                let picked: (Movie | TVShow) | null = null;

                for (const query of queryVariants) {
                    const payload = await tmdbApi.multiSearch(query, 1);
                    const mediaItems = payload.results.filter(
                        (result: any) => result.media_type === 'movie' || result.media_type === 'tv',
                    ) as (Movie | TVShow)[];

                    if (!mediaItems.length) {
                        continue;
                    }

                    const byType = mediaItems.filter((item) =>
                        entry.mediaType ? item.media_type === entry.mediaType : true,
                    );
                    const candidatePool = byType.length ? byType : mediaItems;

                    const withPoster = candidatePool.find((item) => !!item.poster_path);
                    picked = withPoster || candidatePool[0] || null;
                    if (picked) break;
                }

                if (!picked) {
                    continue;
                }

                resolved.push({
                    item: picked,
                    reason: entry.reason,
                });
            } catch {
                continue;
            }
        }

        return resolved;
    };

    const onAskVibey = async (textOverride?: string) => {
        const rawPrompt = (textOverride ?? prompt).trim();
        if (!rawPrompt || loading) return;

        setLoading(true);
        setErrorText('');

        try {
            const response = await getVibeyRecommendations(rawPrompt);
            setSourceLabel(response.source === 'groq' ? 'Groq' : 'Hugging Face');

            const resolved = await resolveRecommendations(response.recommendations);
            if (!resolved.length) {
                setErrorText('No matching titles found. Try a more specific prompt.');
            }
            setResults(resolved);
            setPrompt(rawPrompt);
        } catch (error: any) {
            setErrorText(error?.message || 'Vibey could not fetch recommendations right now.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <AppHeader />

            <View style={styles.main}>
                <ScrollView contentContainerStyle={styles.contentContainer} showsVerticalScrollIndicator={false}>
                    {results.length === 0 ? (
                        <View style={styles.hero}>
                            <View style={styles.sparkleBubble}>
                                <Sparkles color="#fff6fa" size={34} />
                            </View>
                            <Text style={styles.title}>What would you like to watch?</Text>
                            <Text style={styles.subtitle}>
                                Ask Vibey for recommendations, discover hidden gems, or tell me what mood you're in.
                            </Text>

                            <View style={styles.promptWrap}>
                                {quickPrompts.map((item) => (
                                    <TouchableOpacity
                                        key={item}
                                        style={styles.promptChip}
                                        activeOpacity={0.86}
                                        onPress={() => {
                                            setPrompt(item);
                                            void onAskVibey(item);
                                        }}
                                    >
                                        <Text style={styles.promptText}>{item}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>
                    ) : (
                        <View style={styles.resultsBlock}>
                            <Text style={styles.resultsTitle}>Vibey Picks</Text>
                            {sourceLabel ? <Text style={styles.resultsMeta}>Source: {sourceLabel}</Text> : null}
                            {results.map((result) => {
                                const item = result.item;
                                const title = getMediaTitle(item);
                                const year = getMediaYear(item);
                                const poster = getImageUrl(item.poster_path, 'w500');

                                return (
                                    <View key={`${item.id}-${item.media_type}`} style={styles.card}>
                                        {poster ? <Image source={{ uri: poster }} style={styles.cardPoster} /> : <View style={styles.posterFallback} />}
                                        <View style={styles.cardBody}>
                                            <Text style={styles.cardTitle} numberOfLines={2}>
                                                {title}
                                            </Text>
                                            <Text style={styles.cardMeta}>
                                                {year} - {item.vote_average.toFixed(1)} - {getMediaType(item).toUpperCase()}
                                            </Text>
                                            <Text style={styles.cardReason} numberOfLines={3}>
                                                {result.reason}
                                            </Text>

                                            <View style={styles.cardActions}>
                                                <TouchableOpacity
                                                    style={styles.detailsButton}
                                                    onPress={() => navigation.navigate('Detail', { item })}
                                                >
                                                    <Text style={styles.detailsText}>Details</Text>
                                                </TouchableOpacity>
                                                <TouchableOpacity
                                                    style={styles.watchButton}
                                                    onPress={() =>
                                                        navigation.navigate('Play', {
                                                            item: Object.assign({}, item, { media_type: getMediaType(item) }),
                                                            season: 1,
                                                            episode: 1,
                                                        })
                                                    }
                                                >
                                                    <Text style={styles.watchText}>Watch</Text>
                                                </TouchableOpacity>
                                            </View>
                                        </View>
                                    </View>
                                );
                            })}
                        </View>
                    )}

                    {loading ? (
                        <View style={styles.loadingWrap}>
                            <ActivityIndicator color="#ff4f79" />
                            <Text style={styles.loadingText}>Vibey is thinking...</Text>
                        </View>
                    ) : null}

                    {errorText ? <Text style={styles.errorText}>{errorText}</Text> : null}
                </ScrollView>

                <View style={styles.bottomDock}>
                    <View style={styles.inputWrap}>
                        <TextInput
                            style={styles.input}
                            placeholder="Ask Vibey anything about movies..."
                            placeholderTextColor="#8e7487"
                            value={prompt}
                            onChangeText={setPrompt}
                            onSubmitEditing={() => void onAskVibey()}
                            returnKeyType="send"
                        />
                        <TouchableOpacity style={styles.sendButton} activeOpacity={0.86} onPress={() => void onAskVibey()}>
                            <SendHorizontal color="#ffdce8" size={18} />
                        </TouchableOpacity>
                    </View>
                    <Text style={styles.disclaimer}>Vibey can make mistakes. Verify movie info on TMDB.</Text>
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#14040f',
    },
    main: {
        flex: 1,
    },
    contentContainer: {
        flexGrow: 1,
        paddingHorizontal: 14,
        paddingTop: 10,
        paddingBottom: 22,
    },
    hero: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 12,
        paddingTop: 58,
    },
    sparkleBubble: {
        width: 108,
        height: 108,
        borderRadius: 54,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#ff4a77',
        marginBottom: 26,
    },
    title: {
        color: '#f6edf1',
        fontSize: 20,
        fontWeight: '800',
        textAlign: 'center',
    },
    subtitle: {
        color: '#9e8496',
        textAlign: 'center',
        marginTop: 14,
        fontSize: 15,
        lineHeight: 22,
    },
    promptWrap: {
        marginTop: 24,
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'center',
        gap: 10,
    },
    promptChip: {
        borderRadius: 999,
        borderWidth: 1,
        borderColor: '#553245',
        backgroundColor: '#2a1321',
        paddingHorizontal: 14,
        paddingVertical: 9,
    },
    promptText: {
        color: '#ecdde6',
        fontWeight: '700',
        fontSize: 13,
    },
    resultsBlock: {
        paddingTop: 8,
        gap: 12,
    },
    resultsTitle: {
        color: '#f6edf1',
        fontSize: 18,
        fontWeight: '800',
    },
    resultsMeta: {
        color: '#8f7788',
        marginTop: -4,
        marginBottom: 2,
        fontSize: 12,
    },
    card: {
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#4f273a',
        backgroundColor: '#22101c',
        padding: 10,
        flexDirection: 'row',
        gap: 10,
    },
    cardPoster: {
        width: 90,
        height: 136,
        borderRadius: 10,
        backgroundColor: '#301929',
    },
    posterFallback: {
        width: 90,
        height: 136,
        borderRadius: 10,
        backgroundColor: '#301929',
    },
    cardBody: {
        flex: 1,
    },
    cardTitle: {
        color: '#fff3f8',
        fontWeight: '800',
        fontSize: 16,
    },
    cardMeta: {
        color: '#ad93a4',
        fontSize: 12,
        marginTop: 5,
    },
    cardReason: {
        color: '#deccda',
        fontSize: 13,
        marginTop: 8,
        lineHeight: 18,
    },
    cardActions: {
        marginTop: 10,
        flexDirection: 'row',
        gap: 8,
    },
    detailsButton: {
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#614052',
        backgroundColor: '#2d1624',
        paddingHorizontal: 12,
        paddingVertical: 9,
    },
    detailsText: {
        color: '#f3e8ef',
        fontWeight: '700',
        fontSize: 13,
    },
    watchButton: {
        borderRadius: 10,
        backgroundColor: '#ff2d61',
        paddingHorizontal: 14,
        paddingVertical: 9,
    },
    watchText: {
        color: '#fff',
        fontWeight: '800',
        fontSize: 13,
    },
    loadingWrap: {
        marginTop: 14,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    loadingText: {
        color: '#b89fb0',
        fontSize: 13,
    },
    errorText: {
        marginTop: 12,
        color: '#ff9fba',
        fontSize: 13,
    },
    bottomDock: {
        borderTopWidth: 1,
        borderTopColor: '#351325',
        paddingTop: 12,
        paddingHorizontal: 14,
        paddingBottom: 10,
        backgroundColor: '#14040f',
    },
    inputWrap: {
        backgroundColor: '#2a1321',
        borderColor: '#553245',
        borderWidth: 1,
        borderRadius: 18,
        paddingVertical: 6,
        paddingHorizontal: 12,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    input: {
        flex: 1,
        color: '#f6edf1',
        fontSize: 17,
        paddingVertical: 8,
    },
    sendButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#7e223f',
        alignItems: 'center',
        justifyContent: 'center',
    },
    disclaimer: {
        color: '#7f6678',
        fontSize: 13,
        textAlign: 'center',
        marginTop: 9,
    },
});

export default VibeyScreen;
