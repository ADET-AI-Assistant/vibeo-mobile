import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, StyleSheet, FlatList, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useMultiSearch } from '../hooks/useTMDB';
import { MediaCard } from '../components/MediaCard';

// Hook to debounce search input
function useDebounce<T>(value: T, delay: number): T {
    const [debouncedValue, setDebouncedValue] = useState<T>(value);
    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);
        return () => clearTimeout(handler);
    }, [value, delay]);
    return debouncedValue;
}

const SearchScreen = () => {
    const insets = useSafeAreaInsets();
    const navigation = useNavigation<any>();
    const [query, setQuery] = useState('');
    const debouncedQuery = useDebounce(query, 500);

    const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } = useMultiSearch(debouncedQuery);

    const results = data?.pages.flatMap(page => page.results) || [];

    // Filter out people or items without a poster
    const mediaResults = results.filter(item =>
        (item.media_type === 'movie' || item.media_type === 'tv') && item.poster_path
    ) as any[];

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            <View style={styles.searchHeader}>
                <TextInput
                    style={styles.searchInput}
                    placeholder="Search movies, TV shows..."
                    placeholderTextColor="#888"
                    value={query}
                    onChangeText={setQuery}
                    clearButtonMode="while-editing"
                />
            </View>

            {isLoading ? (
                <View style={styles.centerContainer}>
                    <ActivityIndicator size="large" color="#fff" />
                </View>
            ) : query.length > 2 && mediaResults.length === 0 ? (
                <View style={styles.centerContainer}>
                    <Text style={styles.emptyText}>No results found for "{query}"</Text>
                </View>
            ) : (
                <FlatList
                    data={mediaResults}
                    keyExtractor={(item) => item.id.toString()}
                    numColumns={3}
                    contentContainerStyle={styles.gridContainer}
                    columnWrapperStyle={styles.columnWrapper}
                    renderItem={({ item }) => (
                        <MediaCard
                            item={item}
                            onPress={(selected) => navigation.navigate('Detail', { item: selected })}
                            width={110}
                            height={165}
                        />
                    )}
                    onEndReached={() => {
                        if (hasNextPage) {
                            fetchNextPage();
                        }
                    }}
                    onEndReachedThreshold={0.5}
                    ListFooterComponent={
                        isFetchingNextPage ? <ActivityIndicator color="#fff" style={{ marginVertical: 20 }} /> : null
                    }
                />
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#121212',
    },
    searchHeader: {
        paddingHorizontal: 16,
        paddingVertical: 12,
    },
    searchInput: {
        backgroundColor: '#222',
        color: '#fff',
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
    },
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyText: {
        color: '#888',
        fontSize: 16,
    },
    gridContainer: {
        paddingHorizontal: 12,
        paddingBottom: 40,
    },
    columnWrapper: {
        justifyContent: 'space-between',
        marginBottom: 16,
    },
});

export default SearchScreen;
