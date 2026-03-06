import React, { useState } from 'react';
import { View, StyleSheet, ActivityIndicator, TouchableOpacity, Text } from 'react-native';
import { WebView } from 'react-native-webview';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Movie, TVShow } from '../types/tmdb';
import * as ScreenOrientation from 'expo-screen-orientation';
import { useUpdateHistory } from '../hooks/useFirestore';
import { HistoryItem } from '../types/user';

const PlayScreen = ({ route, navigation }: any) => {
    const { item, season = 1, episode = 1 } = route.params as { item: Movie | TVShow, season?: number, episode?: number };
    const insets = useSafeAreaInsets();
    const [isLoading, setIsLoading] = useState(true);
    const updateHistory = useUpdateHistory();

    const title = item.media_type === 'movie' ? (item as Movie).title : (item as TVShow).name;

    React.useEffect(() => {
        // Record that user played this item
        const historyItem: HistoryItem = {
            mediaId: item.id,
            mediaType: item.media_type,
            title: title || 'Unknown',
            posterPath: item.poster_path,
            lastWatchedAt: Date.now(),
            season,
            episode,
        };
        updateHistory.mutate(historyItem);
    }, []);

    const getProviderUrl = () => {
        if (item.media_type === 'movie') {
            return `https://player.videasy.net/movie/${item.id}`;
        }
        return `https://player.videasy.net/tv/${item.id}/${season}/${episode}`;
    };

    const handleBack = async () => {
        await ScreenOrientation.unlockAsync();
        navigation.goBack();
    };

    return (
        <View style={styles.container}>
            <View style={[styles.header, { paddingTop: insets.top }]}>
                <TouchableOpacity onPress={handleBack} style={styles.backButton}>
                    <Text style={styles.backButtonText}>Done</Text>
                </TouchableOpacity>
                <Text style={styles.title} numberOfLines={1}>
                    {title}
                </Text>
            </View>

            <View style={styles.webviewContainer}>
                {isLoading && (
                    <View style={styles.loadingOverlay}>
                        <ActivityIndicator size="large" color="#e50914" />
                        <Text style={styles.loadingText}>Loading Player...</Text>
                    </View>
                )}
                <WebView
                    source={{ uri: getProviderUrl() }}
                    style={styles.webview}
                    allowsFullscreenVideo
                    javaScriptEnabled
                    domStorageEnabled
                    onLoadEnd={() => setIsLoading(false)}
                    onError={(e) => console.error("WebView Error: ", e.nativeEvent)}
                />
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingBottom: 10,
        backgroundColor: '#121212',
    },
    backButton: {
        paddingVertical: 8,
        paddingHorizontal: 16,
        backgroundColor: '#333',
        borderRadius: 20,
        marginRight: 16,
    },
    backButtonText: {
        color: '#fff',
        fontWeight: 'bold',
    },
    title: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
        flex: 1,
    },
    webviewContainer: {
        flex: 1,
        backgroundColor: '#000',
    },
    webview: {
        flex: 1,
        backgroundColor: 'transparent',
    },
    loadingOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: '#000',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 10,
    },
    loadingText: {
        color: '#888',
        marginTop: 12,
        fontSize: 14,
    },
});

export default PlayScreen;
