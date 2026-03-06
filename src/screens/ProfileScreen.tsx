import React, { useMemo, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    Image,
    ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Menu, Search, MessageCircle } from 'lucide-react-native';
import { useAuth } from '../store/AuthContext';
import { useWatchlist, useHistory } from '../hooks/useFirestore';
import { getImageUrl } from '../api/tmdb';

type LibraryTab = 'all' | 'watching' | 'planning' | 'completed' | 'on_hold';

const ProfileScreen = ({ navigation }: any) => {
    const { user, logout } = useAuth();
    const insets = useSafeAreaInsets();
    const [activeTab, setActiveTab] = useState<LibraryTab>('all');

    const { data: watchlist, isLoading: loadingWatchlist } = useWatchlist();
    const { data: history, isLoading: loadingHistory } = useHistory();

    const totalMinutes = Math.max(1, (history?.length || 0) * 3);
    const joinedLabel = useMemo(
        () =>
            new Intl.DateTimeFormat('en-US', {
                month: 'short',
                year: 'numeric',
            }).format(new Date()),
        [],
    );

    const displayName =
        user?.name?.trim() ||
        user?.email?.split('@')[0]?.replace(/[^a-zA-Z0-9]/g, ' ')?.trim() ||
        'Vibeo User';

    const initials = displayName.charAt(0).toUpperCase();

    const watchlistItems = watchlist || [];
    const historyItems = history || [];

    const statusCounts = {
        watching: watchlistItems.filter((i) => i.status === 'watching').length,
        planning: watchlistItems.filter((i) => i.status === 'planning').length,
        completed: watchlistItems.filter((i) => i.status === 'completed').length,
        on_hold: watchlistItems.filter((i) => i.status === 'on_hold').length,
    };

    const filteredLibrary =
        activeTab === 'all' ? watchlistItems : watchlistItems.filter((item) => item.status === activeTab);

    const renderPosterCard = (item: any) => (
        <TouchableOpacity
            key={`poster-${item.mediaId}`}
            style={styles.posterCard}
            activeOpacity={0.85}
            onPress={() =>
                navigation.navigate('Detail', {
                    item: {
                        ...item,
                        id: item.mediaId,
                        media_type: item.mediaType,
                    },
                })
            }
        >
            <Image source={{ uri: getImageUrl(item.posterPath, 'w500') || '' }} style={styles.posterImage} />
            <Text style={styles.posterTitle} numberOfLines={1}>
                {item.title}
            </Text>
            <Text style={styles.posterSubtitle}>{item.mediaType === 'movie' ? 'Movie' : 'Series'}</Text>
        </TouchableOpacity>
    );

    return (
        <ScrollView
            style={styles.container}
            contentContainerStyle={[styles.contentContainer, { paddingTop: insets.top + 6 }]}
            showsVerticalScrollIndicator={false}
        >
            <View style={styles.topBar}>
                <Text style={styles.brand}>Vibeo</Text>
                <View style={styles.topActions}>
                    <Search color="#bda9b7" size={20} />
                    <Menu color="#f2eaf0" size={24} />
                </View>
            </View>

            <View style={styles.profileCard}>
                <View style={styles.avatarOuter}>
                    <View style={styles.avatarInner}>
                        <Text style={styles.avatarText}>{initials}</Text>
                    </View>
                </View>

                <Text style={styles.profileGreeting}>Hi, <Text style={styles.profileName}>{displayName}</Text></Text>
                <Text style={styles.profileSubcopy}>Welcome back to your hub</Text>

                <View style={styles.profileDivider} />

                <View style={styles.profileStatsRow}>
                    <View>
                        <Text style={styles.profileStatLabel}>TIME WATCHED</Text>
                        <Text style={styles.profileStatValue}>{totalMinutes} minutes</Text>
                    </View>
                    <View>
                        <Text style={styles.profileStatLabel}>JOINED</Text>
                        <Text style={styles.profileStatValue}>{joinedLabel}</Text>
                    </View>
                </View>
            </View>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Continue Watching</Text>
                {loadingHistory ? (
                    <ActivityIndicator color="#fff" style={{ marginVertical: 14 }} />
                ) : historyItems.length > 0 ? (
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.posterRail}>
                        {historyItems.slice(0, 12).map(renderPosterCard)}
                    </ScrollView>
                ) : (
                    <Text style={styles.emptyText}>No watch history yet.</Text>
                )}
            </View>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>My Library</Text>
                <Text style={styles.libraryCount}>{watchlistItems.length} ITEMS</Text>

                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
                    {[
                        { key: 'all', label: 'All', count: watchlistItems.length },
                        { key: 'watching', label: 'Watching', count: statusCounts.watching },
                        { key: 'planning', label: 'Planning to Watch', count: statusCounts.planning },
                        { key: 'completed', label: 'Completed', count: statusCounts.completed },
                        { key: 'on_hold', label: 'On Hold', count: statusCounts.on_hold },
                    ].map((tab) => {
                        const isActive = activeTab === tab.key;
                        return (
                            <TouchableOpacity
                                key={tab.key}
                                style={[styles.filterChip, isActive && styles.filterChipActive]}
                                onPress={() => setActiveTab(tab.key as LibraryTab)}
                                activeOpacity={0.85}
                            >
                                <Text style={[styles.filterChipText, isActive && styles.filterChipTextActive]}>{tab.label}</Text>
                                <View style={[styles.countBadge, isActive && styles.countBadgeActive]}>
                                    <Text style={[styles.countBadgeText, isActive && styles.countBadgeTextActive]}>{tab.count}</Text>
                                </View>
                            </TouchableOpacity>
                        );
                    })}
                </ScrollView>

                {loadingWatchlist ? (
                    <ActivityIndicator color="#fff" style={{ marginVertical: 20 }} />
                ) : filteredLibrary.length > 0 ? (
                    <View style={styles.grid}>
                        {filteredLibrary.map((item) => (
                            <View key={`library-${item.mediaId}`} style={styles.gridItem}>
                                {renderPosterCard(item)}
                            </View>
                        ))}
                    </View>
                ) : (
                    <Text style={styles.emptyText}>No items in this bucket yet.</Text>
                )}
            </View>

            <TouchableOpacity style={styles.signOutBtn} onPress={logout}>
                <Text style={styles.signOutText}>Sign Out</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.fab} activeOpacity={0.9}>
                <MessageCircle color="#ffd3e4" size={22} />
            </TouchableOpacity>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#13030d',
    },
    contentContainer: {
        paddingBottom: 120,
    },
    topBar: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingBottom: 14,
        borderBottomWidth: 1,
        borderBottomColor: '#2f1122',
    },
    brand: {
        color: '#ff4f79',
        fontSize: 30 / 2,
        fontWeight: '900',
    },
    topActions: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
    },
    profileCard: {
        marginHorizontal: 16,
        marginTop: 20,
        borderRadius: 28,
        paddingVertical: 24,
        paddingHorizontal: 22,
        borderWidth: 1,
        borderColor: '#3d1c30',
        backgroundColor: '#1c0d18',
        alignItems: 'center',
    },
    avatarOuter: {
        width: 106,
        height: 106,
        borderRadius: 53,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 64, 122, 0.22)',
        marginBottom: 14,
    },
    avatarInner: {
        width: 90,
        height: 90,
        borderRadius: 45,
        backgroundColor: '#f77f00',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#2d101f',
    },
    avatarText: {
        color: '#fff',
        fontSize: 46 / 2,
        fontWeight: '800',
    },
    profileGreeting: {
        color: '#fff',
        fontSize: 46 / 2,
        fontWeight: '800',
    },
    profileName: {
        color: '#ff9db8',
    },
    profileSubcopy: {
        marginTop: 8,
        color: '#827285',
        fontSize: 33 / 3,
    },
    profileDivider: {
        marginTop: 24,
        marginBottom: 18,
        width: '100%',
        borderBottomWidth: 1,
        borderBottomColor: '#341628',
    },
    profileStatsRow: {
        width: '100%',
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    profileStatLabel: {
        color: '#726477',
        fontSize: 11,
        fontWeight: '800',
        letterSpacing: 0.4,
    },
    profileStatValue: {
        color: '#fff',
        fontSize: 31 / 2,
        fontWeight: '800',
        marginTop: 6,
    },
    section: {
        marginTop: 22,
    },
    sectionTitle: {
        color: '#fff',
        fontSize: 36 / 2,
        fontWeight: '800',
        marginBottom: 10,
        paddingHorizontal: 16,
    },
    posterRail: {
        paddingHorizontal: 16,
    },
    posterCard: {
        width: 114,
        marginRight: 10,
    },
    posterImage: {
        width: 114,
        height: 168,
        borderRadius: 12,
        backgroundColor: '#281321',
        marginBottom: 7,
    },
    posterTitle: {
        color: '#f8eff4',
        fontWeight: '700',
        fontSize: 12,
    },
    posterSubtitle: {
        color: '#8e7d91',
        fontSize: 11,
        marginTop: 1,
    },
    libraryCount: {
        color: '#837485',
        fontSize: 12,
        fontWeight: '700',
        marginTop: -6,
        marginBottom: 12,
        paddingHorizontal: 16,
    },
    filterRow: {
        paddingHorizontal: 16,
        gap: 8,
    },
    filterChip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#3a1b2c',
        backgroundColor: '#1e0d19',
    },
    filterChipActive: {
        backgroundColor: '#ff3f75',
        borderColor: '#ff5f8d',
    },
    filterChipText: {
        color: '#bba7b7',
        fontSize: 12,
        fontWeight: '700',
    },
    filterChipTextActive: {
        color: '#fff',
    },
    countBadge: {
        borderRadius: 999,
        backgroundColor: '#2f1a28',
        paddingHorizontal: 8,
        paddingVertical: 2,
    },
    countBadgeActive: {
        backgroundColor: 'rgba(255,255,255,0.25)',
    },
    countBadgeText: {
        color: '#baa7b7',
        fontSize: 11,
        fontWeight: '800',
    },
    countBadgeTextActive: {
        color: '#fff',
    },
    grid: {
        marginTop: 14,
        flexDirection: 'row',
        flexWrap: 'wrap',
        paddingHorizontal: 12,
    },
    gridItem: {
        width: '50%',
        paddingHorizontal: 4,
        marginBottom: 12,
    },
    emptyText: {
        color: '#7d6f80',
        fontStyle: 'italic',
        paddingHorizontal: 16,
    },
    signOutBtn: {
        marginTop: 18,
        marginHorizontal: 16,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: '#5a3a4e',
        backgroundColor: '#2a1220',
        alignItems: 'center',
        paddingVertical: 12,
    },
    signOutText: {
        color: '#ffeaf2',
        fontWeight: '800',
        fontSize: 14,
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

export default ProfileScreen;
