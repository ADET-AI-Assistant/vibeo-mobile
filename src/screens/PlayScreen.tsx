import React, { useState } from 'react';
import { View, StyleSheet, ActivityIndicator, TouchableOpacity, Text } from 'react-native';
import { WebView } from 'react-native-webview';
import { Movie, TVShow } from '../types/tmdb';
import * as ScreenOrientation from 'expo-screen-orientation';
import { useUpdateHistory } from '../hooks/useFirestore';
import { HistoryItem } from '../types/user';
import { AppHeader } from '../components/AppHeader';

const PlayScreen = ({ route, navigation }: any) => {
    const { item, season = 1, episode = 1 } = route.params as { item: Movie | TVShow, season?: number, episode?: number };
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
            <AppHeader
                title={title || 'Player'}
                showBrand={false}
                showBack
                backLabel="Done"
                onBackPress={handleBack}
                showSearch={false}
                showMenu={false}
                style={styles.header}
            />

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
        backgroundColor: '#121212',
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
