import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { ChevronDown } from 'lucide-react-native';
import { useInfiniteQuery } from '@tanstack/react-query';
import { useMovieGenresQuery } from '../hooks/useTMDB';
import { useNavigation } from '@react-navigation/native';
import { MediaCard } from '../components/MediaCard';
import { Movie, TVShow } from '../types/tmdb';
import { AppHeader } from '../components/AppHeader';
import { tmdbApi } from '../api/tmdb';

type SortKey = 'popular' | 'top_rated' | 'now_playing' | 'upcoming' | 'trending';

const SORT_OPTIONS: { key: SortKey; label: string }[] = [
    { key: 'popular', label: 'Popular' },
    { key: 'top_rated', label: 'Top Rated' },
    { key: 'now_playing', label: 'Now Playing' },
    { key: 'upcoming', label: 'Upcoming' },
    { key: 'trending', label: 'Trending' },
];

const BrowseScreen = () => {
    const navigation = useNavigation<any>();
    const [sortKey, setSortKey] = useState<SortKey>('popular');
    const [genreId, setGenreId] = useState<number | null>(null);
    const [sortOpen, setSortOpen] = useState(false);
    const [genresOpen, setGenresOpen] = useState(false);

    const activeQuery = useInfiniteQuery({
        queryKey: ['browse', sortKey],
        queryFn: ({ pageParam = 1 }) => {
            if (sortKey === 'top_rated') return tmdbApi.getTopRatedMovies(pageParam);
            if (sortKey === 'now_playing') return tmdbApi.getNowPlayingMovies(pageParam);
            if (sortKey === 'upcoming') return tmdbApi.getUpcomingMovies(pageParam);
            if (sortKey === 'trending') return tmdbApi.getTrending(pageParam);
            return tmdbApi.getPopularMovies(pageParam);
        },
        initialPageParam: 1,
        getNextPageParam: (lastPage) =>
            lastPage.page < lastPage.total_pages ? lastPage.page + 1 : undefined,
    });
    const movieGenres = useMovieGenresQuery();

    const genres = useMemo(
        () => [{ id: 0, name: 'All Genres' }, ...(movieGenres.data?.genres || [])],
        [movieGenres.data?.genres],
    );

    const allItems = useMemo(() => {
        const list = activeQuery.data?.pages.flatMap((page) => page.results) || [];
        return list as (Movie | TVShow)[];
    }, [activeQuery.data?.pages]);

    const gridData = useMemo(() => {
        if (!genreId) return allItems;
        return allItems.filter((item) => item.genre_ids?.includes(genreId));
    }, [allItems, genreId]);

    const onNavigate = (item: Movie | TVShow) => {
        navigation.navigate('Detail', { item });
    };

    const onEndReached = () => {
        if (activeQuery.hasNextPage && !activeQuery.isFetchingNextPage) {
            activeQuery.fetchNextPage();
        }
    };

    const activeSort = SORT_OPTIONS.find((option) => option.key === sortKey);
    const activeGenre = genres.find((item) => item.id === (genreId || 0));

    return (
        <View style={styles.container}>
            <AppHeader />

            <View style={styles.filterWrap}>
                <View style={styles.filterRow}>
                    <TouchableOpacity
                        style={[styles.filterPill, sortOpen && styles.filterPillActive]}
                        activeOpacity={0.85}
                        onPress={() => {
                            setSortOpen((prev) => !prev);
                            setGenresOpen(false);
                        }}
                    >
                        <Text style={styles.filterText}>{activeSort?.label || 'Popular'}</Text>
                        <ChevronDown color="#d3becd" size={14} />
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.filterPill, genresOpen && styles.filterPillActive]}
                        activeOpacity={0.85}
                        onPress={() => {
                            setGenresOpen((prev) => !prev);
                            setSortOpen(false);
                        }}
                    >
                        <Text style={styles.filterText}>{activeGenre?.name || 'All Genres'}</Text>
                        <ChevronDown color="#d3becd" size={14} />
                    </TouchableOpacity>
                </View>

                {sortOpen ? (
                    <View style={[styles.dropdownMenu, styles.sortMenu]}>
                        {SORT_OPTIONS.map((option) => {
                            const isActive = option.key === sortKey;
                            return (
                                <TouchableOpacity
                                    key={option.key}
                                    style={[styles.menuItem, isActive && styles.menuItemActive]}
                                    activeOpacity={0.85}
                                    onPress={() => {
                                        setSortKey(option.key);
                                        setSortOpen(false);
                                    }}
                                >
                                    <Text style={[styles.menuItemText, isActive && styles.menuItemTextActive]}>{option.label}</Text>
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                ) : null}

                {genresOpen ? (
                    <View style={[styles.dropdownMenu, styles.genreMenu]}>
                        {genres.map((genre) => {
                            const isActive = (genreId || 0) === genre.id;
                            return (
                                <TouchableOpacity
                                    key={genre.id}
                                    style={[styles.menuItem, isActive && styles.menuItemActive]}
                                    activeOpacity={0.85}
                                    onPress={() => {
                                        setGenreId(genre.id === 0 ? null : genre.id);
                                        setGenresOpen(false);
                                    }}
                                >
                                    <Text style={[styles.menuItemText, isActive && styles.menuItemTextActive]}>{genre.name}</Text>
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                ) : null}
            </View>

            {activeQuery.isLoading ? (
                <View style={styles.loaderWrap}>
                    <ActivityIndicator color="#fff" />
                </View>
            ) : (
                <FlatList
                    data={gridData}
                    keyExtractor={(item) => `${item.id}-${item.media_type || 'movie'}`}
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
                    onEndReached={onEndReached}
                    onEndReachedThreshold={0.45}
                    ListFooterComponent={
                        activeQuery.isFetchingNextPage ? (
                            <ActivityIndicator color="#fff" style={styles.listLoader} />
                        ) : null
                    }
                />
            )}

        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#1b0613',
    },
    filterWrap: {
        zIndex: 20,
        paddingHorizontal: 14,
        paddingBottom: 8,
    },
    filterRow: {
        flexDirection: 'row',
        gap: 10,
        paddingBottom: 8,
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
    filterPillActive: {
        borderColor: '#f7c24f',
        backgroundColor: '#341927',
    },
    filterText: {
        color: '#f2e8ef',
        fontWeight: '700',
        fontSize: 14,
    },
    dropdownMenu: {
        position: 'absolute',
        top: 48,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#5a2f45',
        backgroundColor: '#2a1321',
        overflow: 'hidden',
        zIndex: 30,
        minWidth: 182,
    },
    sortMenu: {
        left: 14,
    },
    genreMenu: {
        left: 142,
    },
    menuItem: {
        paddingHorizontal: 14,
        paddingVertical: 12,
    },
    menuItemActive: {
        backgroundColor: '#eb1e56',
    },
    menuItemText: {
        color: '#9e8ca0',
        fontSize: 29 / 2,
        fontWeight: '600',
    },
    menuItemTextActive: {
        color: '#fff',
        fontWeight: '800',
    },
    loaderWrap: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    gridContainer: {
        paddingHorizontal: 10,
        paddingTop: 6,
        paddingBottom: 90,
    },
    columnWrapper: {
        justifyContent: 'space-between',
        marginBottom: 10,
    },
    listLoader: {
        marginVertical: 18,
    },
});

export default BrowseScreen;
