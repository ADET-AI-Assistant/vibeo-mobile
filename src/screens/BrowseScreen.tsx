import React, { useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronDown, MessageCircle } from 'lucide-react-native';
import { useTrendingQuery, usePopularQuery } from '../hooks/useTMDB';
import { useNavigation } from '@react-navigation/native';
import { MediaCard } from '../components/MediaCard';
import { Movie, TVShow } from '../types/tmdb';

const BrowseScreen = () => {
    const insets = useSafeAreaInsets();
    const navigation = useNavigation<any>();

    const trending = useTrendingQuery();
    const popular = usePopularQuery();

    const gridData = useMemo(() => {
        const trendingItems = trending.data?.pages[0]?.results || [];
        const popularItems = popular.data?.pages[0]?.results || [];
        return [...trendingItems, ...popularItems].slice(0, 20);
    }, [trending.data, popular.data]);

    const onNavigate = (item: Movie | TVShow) => {
        navigation.navigate('Detail', { item });
    };

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}> 
            <View style={styles.filterRow}>
                <TouchableOpacity style={styles.filterPill} activeOpacity={0.85}>
                    <Text style={styles.filterText}>Trending</Text>
                    <ChevronDown color="#d3becd" size={14} />
                </TouchableOpacity>
                <TouchableOpacity style={styles.filterPill} activeOpacity={0.85}>
                    <Text style={styles.filterText}>All Genres</Text>
                    <ChevronDown color="#d3becd" size={14} />
                </TouchableOpacity>
            </View>

            <FlatList
                data={gridData}
                keyExtractor={(item) => item.id.toString()}
                numColumns={2}
                contentContainerStyle={styles.gridContainer}
                columnWrapperStyle={styles.columnWrapper}
                showsVerticalScrollIndicator={false}
                renderItem={({ item }) => (
                    <MediaCard
                        item={item}
                        onPress={onNavigate}
                        width={176}
                        height={263}
                        showSubtitle={false}
                    />
                )}
            />

            <TouchableOpacity style={styles.fab} activeOpacity={0.9}>
                <MessageCircle color="#ffd3e4" size={22} />
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#1b0613',
    },
    filterRow: {
        flexDirection: 'row',
        gap: 10,
        paddingHorizontal: 14,
        paddingBottom: 12,
    },
    filterPill: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#472435',
        backgroundColor: '#2a1120',
    },
    filterText: {
        color: '#f2e8ef',
        fontWeight: '700',
        fontSize: 18 / 2,
    },
    gridContainer: {
        paddingHorizontal: 10,
        paddingBottom: 90,
    },
    columnWrapper: {
        justifyContent: 'space-between',
        marginBottom: 10,
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

export default BrowseScreen;
