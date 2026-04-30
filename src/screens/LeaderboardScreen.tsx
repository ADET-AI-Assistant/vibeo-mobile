import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    Image,
    ActivityIndicator,
    Animated,
} from 'react-native';
import { Trophy, Flame, Play, RefreshCcw, CheckCircle } from 'lucide-react-native';
import { fetchLeaderboard, syncUserStats } from '../api/djangoClient';
import { useAuth } from '../store/AuthContext';
import { useHistory } from '../hooks/useFirestore';
import { AppHeader } from '../components/AppHeader';

const AvatarImage = ({ url, username, style }: { url?: string, username: string, style: any }) => {
    const defaultSrc = `https://ui-avatars.com/api/?name=${encodeURIComponent(username)}&background=random&color=fff`;
    const [hasError, setHasError] = useState(false);

    // Reset error state if the URL or username changes (e.g. from list re-renders)
    useEffect(() => {
        setHasError(false);
    }, [url, username]);

    const imgSrc = (url && !hasError) ? url : defaultSrc;

    return (
        <Image 
            source={{ uri: imgSrc }} 
            style={style}
            onError={() => setHasError(true)}
        />
    );
};

const LeaderboardScreen = () => {
    const [stats, setStats] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [syncing, setSyncing] = useState(false);
    const [syncSuccess, setSyncSuccess] = useState(false);
    const [view, setView] = useState<'streak' | 'watchtime'>('streak');

    const { user } = useAuth();
    const { data: history } = useHistory();

    const loadLeaderboard = async () => {
        setLoading(true);
        try {
            const data = await fetchLeaderboard();
            const rankings = data?.results || (Array.isArray(data) ? data : []);
            setStats(rankings);
        } catch (err) {
            console.error("Failed to load leaderboard:", err);
        }
        setLoading(false);
    };

    useEffect(() => {
        loadLeaderboard();
    }, []);

    const handleManualSync = async () => {
        if (!user) return;
        setSyncing(true);
        setSyncSuccess(false);

        try {
            await loadLeaderboard();
            setSyncSuccess(true);
            setTimeout(() => setSyncSuccess(false), 3000);
        } catch (err) {
            console.error('Manual sync failed:', err);
        } finally {
            setSyncing(false);
        }
    };

    const formatTime = (seconds: number) => {
        const hrs = Math.floor(seconds / 3600);
        const mins = Math.floor((seconds % 3600) / 60);
        if (hrs > 0) return `${hrs}h ${mins}m`;
        return `${mins}m`;
    };

    const sortedStats = [...stats].sort((a, b) => {
        if (view === 'streak') return b.current_streak - a.current_streak;
        return b.total_watch_time - a.total_watch_time;
    });

    const podiums = sortedStats.slice(0, 3);
    const list = sortedStats.slice(3);

    return (
        <View style={styles.container}>
            <AppHeader />
            <ScrollView
                contentContainerStyle={styles.contentContainer}
                showsVerticalScrollIndicator={false}
            >
                <View style={styles.header}>
                    <View style={styles.titleSection}>
                        <Trophy color="#fbbf24" size={32} style={styles.trophyIcon} />
                        <Text style={styles.title}>Global Hall of Vibe</Text>
                        <Text style={styles.subtitle}>The top 50 most active Vibeo viewers</Text>
                    </View>
                </View>

                <View style={styles.controls}>
                    <View style={styles.tabControls}>
                        <TouchableOpacity
                            style={[styles.controlBtn, view === 'streak' && styles.controlBtnActive]}
                            onPress={() => setView('streak')}
                        >
                            <Flame size={16} color={view === 'streak' ? '#000' : '#827285'} />
                            <Text style={[styles.controlBtnText, view === 'streak' && styles.controlBtnTextActive]}>
                                Top Streaks
                            </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.controlBtn, view === 'watchtime' && styles.controlBtnActive]}
                            onPress={() => setView('watchtime')}
                        >
                            <Play size={16} color={view === 'watchtime' ? '#000' : '#827285'} />
                            <Text style={[styles.controlBtnText, view === 'watchtime' && styles.controlBtnTextActive]}>
                                Watch Time
                            </Text>
                        </TouchableOpacity>
                    </View>

                    <TouchableOpacity
                        style={[
                            styles.syncBtn,
                            syncSuccess && styles.syncBtnSuccess
                        ]}
                        onPress={handleManualSync}
                        disabled={syncing}
                    >
                        {syncSuccess ? (
                            <CheckCircle size={16} color="#4ade80" />
                        ) : (
                            <RefreshCcw size={16} color={syncSuccess ? "#4ade80" : "#818cf8"} />
                        )}
                        <Text style={[
                            styles.syncBtnText,
                            syncSuccess && styles.syncBtnTextSuccess
                        ]}>
                            {syncing ? 'Syncing...' : syncSuccess ? 'Synced!' : 'Sync My Stats'}
                        </Text>
                    </TouchableOpacity>
                </View>

                {loading ? (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color="#fff" />
                        <Text style={styles.loadingText}>Calculating rankings...</Text>
                    </View>
                ) : stats.length === 0 ? (
                    <View style={styles.emptyContainer}>
                        <Flame size={48} color="#827285" />
                        <Text style={styles.emptyText}>No active users yet. Be the first to bridge your stats!</Text>
                        <TouchableOpacity style={styles.emptySyncBtn} onPress={handleManualSync}>
                            <Text style={styles.emptySyncBtnText}>Initialize My Stats</Text>
                        </TouchableOpacity>
                    </View>
                ) : (
                    <View style={styles.content}>
                        {/* Podium Section */}
                        <View style={styles.podiumSection}>
                            {/* 2nd Place */}
                            {podiums[1] && (
                                <View style={[styles.podiumItem, styles.second]}>
                                    <View style={styles.avatarWrapper}>
                                        <AvatarImage
                                            url={podiums[1].avatar_url}
                                            username={podiums[1].username}
                                            style={[styles.avatarImg, styles.avatarSilver]}
                                        />
                                        <View style={[styles.rankBadge, styles.bgSilver]}>
                                            <Text style={styles.rankBadgeText}>2</Text>
                                        </View>
                                    </View>
                                    <View style={styles.userInfo}>
                                        <Text style={styles.username} numberOfLines={1}>{podiums[1].username}</Text>
                                        <Text style={styles.statLine}>
                                            {view === 'streak' ? `${podiums[1].current_streak} days` : formatTime(podiums[1].total_watch_time)}
                                        </Text>
                                    </View>
                                    <View style={[styles.pillar, styles.pillarSilver]} />
                                </View>
                            )}

                            {/* 1st Place */}
                            {podiums[0] && (
                                <View style={[styles.podiumItem, styles.first]}>
                                    <Text style={styles.crown}>👑</Text>
                                    <View style={styles.avatarWrapperFirst}>
                                        <AvatarImage
                                            url={podiums[0].avatar_url}
                                            username={podiums[0].username}
                                            style={[styles.avatarImgFirst, styles.avatarGold]}
                                        />
                                        <View style={[styles.rankBadgeFirst, styles.bgGold]}>
                                            <Text style={styles.rankBadgeTextFirst}>1</Text>
                                        </View>
                                    </View>
                                    <View style={styles.userInfo}>
                                        <Text style={styles.username} numberOfLines={1}>{podiums[0].username}</Text>
                                        <Text style={[styles.statLine, styles.highlightColor]}>
                                            {view === 'streak' ? `${podiums[0].current_streak} days` : formatTime(podiums[0].total_watch_time)}
                                        </Text>
                                    </View>
                                    <View style={[styles.pillar, styles.pillarGold]} />
                                </View>
                            )}

                            {/* 3rd Place */}
                            {podiums[2] && (
                                <View style={[styles.podiumItem, styles.third]}>
                                    <View style={styles.avatarWrapper}>
                                        <AvatarImage
                                            url={podiums[2].avatar_url}
                                            username={podiums[2].username}
                                            style={[styles.avatarImg, styles.avatarBronze]}
                                        />
                                        <View style={[styles.rankBadge, styles.bgBronze]}>
                                            <Text style={styles.rankBadgeText}>3</Text>
                                        </View>
                                    </View>
                                    <View style={styles.userInfo}>
                                        <Text style={styles.username} numberOfLines={1}>{podiums[2].username}</Text>
                                        <Text style={styles.statLine}>
                                            {view === 'streak' ? `${podiums[2].current_streak} days` : formatTime(podiums[2].total_watch_time)}
                                        </Text>
                                    </View>
                                    <View style={[styles.pillar, styles.pillarBronze]} />
                                </View>
                            )}
                        </View>

                        {/* List Section */}
                        {list.length > 0 && (
                            <View style={styles.listContainer}>
                                {list.map((u, index) => (
                                    <View key={u.firebase_uid || `rank-${index}`} style={styles.listItem}>
                                        <Text style={styles.listRankNum}>{index + 4}</Text>
                                        <AvatarImage
                                            url={u.avatar_url}
                                            username={u.username}
                                            style={styles.listAvatar}
                                        />
                                        <Text style={styles.listUsername} numberOfLines={1}>{u.username}</Text>
                                        <View style={styles.listStatValue}>
                                            {view === 'streak' ? (
                                                <>
                                                    <Flame size={14} color="#f97316" />
                                                    <Text style={styles.listStatNum}>{u.current_streak}</Text>
                                                </>
                                            ) : (
                                                <>
                                                    <Play size={14} color="#22c55e" />
                                                    <Text style={styles.listStatNum}>{formatTime(u.total_watch_time)}</Text>
                                                </>
                                            )}
                                        </View>
                                    </View>
                                ))}
                            </View>
                        )}
                    </View>
                )}
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#13030d',
    },
    contentContainer: {
        paddingBottom: 100,
    },
    header: {
        paddingHorizontal: 20,
        paddingTop: 10,
        marginBottom: 25,
    },
    titleSection: {
        alignItems: 'center',
        marginTop: 10,
    },
    trophyIcon: {
        marginBottom: 8,
    },
    title: {
        fontSize: 28,
        fontWeight: '800',
        color: '#fff',
        marginBottom: 5,
        textAlign: 'center',
    },
    subtitle: {
        color: '#827285',
        fontSize: 14,
        textAlign: 'center',
    },
    controls: {
        paddingHorizontal: 20,
        marginBottom: 35,
        alignItems: 'center',
    },
    tabControls: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 20,
    },
    controlBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#3a1b2c',
        backgroundColor: '#1e0d19',
        gap: 8,
    },
    controlBtnActive: {
        backgroundColor: '#fff',
        borderColor: '#fff',
    },
    controlBtnText: {
        color: '#827285',
        fontWeight: '600',
        fontSize: 14,
    },
    controlBtnTextActive: {
        color: '#000',
    },
    syncBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderRadius: 24,
        borderWidth: 1,
        borderColor: 'rgba(99, 102, 241, 0.3)',
        backgroundColor: 'rgba(99, 102, 241, 0.1)',
        gap: 8,
    },
    syncBtnSuccess: {
        borderColor: 'rgba(34, 197, 94, 0.3)',
        backgroundColor: 'rgba(34, 197, 94, 0.1)',
    },
    syncBtnText: {
        color: '#818cf8',
        fontWeight: '700',
        fontSize: 14,
    },
    syncBtnTextSuccess: {
        color: '#4ade80',
    },
    loadingContainer: {
        alignItems: 'center',
        paddingTop: 50,
    },
    loadingText: {
        color: '#fff',
        marginTop: 15,
        fontSize: 16,
    },
    emptyContainer: {
        alignItems: 'center',
        paddingHorizontal: 30,
        paddingTop: 30,
        backgroundColor: 'rgba(255, 255, 255, 0.02)',
        marginHorizontal: 20,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#3a1b2c',
        borderStyle: 'dashed',
        paddingBottom: 40,
    },
    emptyText: {
        color: '#827285',
        fontSize: 14,
        textAlign: 'center',
        marginTop: 15,
        marginBottom: 20,
        lineHeight: 22,
    },
    emptySyncBtn: {
        backgroundColor: '#fff',
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 12,
    },
    emptySyncBtnText: {
        color: '#000',
        fontWeight: '800',
        fontSize: 14,
    },
    content: {
        paddingHorizontal: 15,
    },
    podiumSection: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'flex-end',
        gap: 12,
        marginBottom: 40,
    },
    podiumItem: {
        alignItems: 'center',
    },
    first: {
        width: 120,
    },
    second: {
        width: 100,
    },
    third: {
        width: 100,
    },
    avatarWrapper: {
        position: 'relative',
        marginBottom: 8,
    },
    avatarWrapperFirst: {
        position: 'relative',
        marginBottom: 8,
    },
    avatarImg: {
        width: 65,
        height: 65,
        borderRadius: 33,
        borderWidth: 2,
    },
    avatarImgFirst: {
        width: 85,
        height: 85,
        borderRadius: 43,
        borderWidth: 2,
    },
    avatarGold: { borderColor: '#fbbf24' },
    avatarSilver: { borderColor: '#94a3b8' },
    avatarBronze: { borderColor: '#b45309' },
    rankBadge: {
        position: 'absolute',
        bottom: -4,
        right: -4,
        width: 24,
        height: 24,
        borderRadius: 12,
        borderWidth: 1.5,
        borderColor: '#13030d',
        justifyContent: 'center',
        alignItems: 'center',
    },
    rankBadgeFirst: {
        position: 'absolute',
        bottom: -4,
        right: -4,
        width: 28,
        height: 28,
        borderRadius: 14,
        borderWidth: 1.5,
        borderColor: '#13030d',
        justifyContent: 'center',
        alignItems: 'center',
    },
    bgGold: { backgroundColor: '#fbbf24' },
    bgSilver: { backgroundColor: '#94a3b8' },
    bgBronze: { backgroundColor: '#b45309' },
    rankBadgeText: {
        color: '#fff',
        fontWeight: '800',
        fontSize: 12,
    },
    rankBadgeTextFirst: {
        color: '#000',
        fontWeight: '800',
        fontSize: 14,
    },
    crown: {
        position: 'absolute',
        top: -24,
        fontSize: 22,
        left: '50%',
        transform: [{ translateX: -11 }, { rotate: '-10deg' }],
        zIndex: 10,
    },
    userInfo: {
        alignItems: 'center',
        marginBottom: 8,
        width: '100%',
    },
    username: {
        color: '#fff',
        fontWeight: '700',
        fontSize: 14,
        marginBottom: 2,
        textAlign: 'center',
        paddingHorizontal: 2,
    },
    statLine: {
        color: '#827285',
        fontSize: 12,
    },
    highlightColor: {
        color: '#fbbf24',
        fontWeight: '700',
    },
    pillar: {
        width: '100%',
        borderTopLeftRadius: 12,
        borderTopRightRadius: 12,
        borderTopWidth: 1,
        borderLeftWidth: 1,
        borderRightWidth: 1,
    },
    pillarGold: {
        height: 120,
        backgroundColor: 'rgba(251, 191, 36, 0.15)',
        borderColor: 'rgba(251, 191, 36, 0.3)',
    },
    pillarSilver: {
        height: 80,
        backgroundColor: 'rgba(148, 163, 184, 0.15)',
        borderColor: 'rgba(148, 163, 184, 0.3)',
    },
    pillarBronze: {
        height: 50,
        backgroundColor: 'rgba(180, 83, 9, 0.15)',
        borderColor: 'rgba(180, 83, 9, 0.3)',
    },
    listContainer: {
        backgroundColor: '#1a0814',
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#3a1b2c',
        overflow: 'hidden',
    },
    listItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 14,
        paddingHorizontal: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#2d1522',
    },
    listRankNum: {
        width: 25,
        color: '#827285',
        fontWeight: '700',
        fontSize: 14,
    },
    listAvatar: {
        width: 36,
        height: 36,
        borderRadius: 18,
        borderWidth: 1,
        borderColor: '#3a1b2c',
        marginRight: 12,
    },
    listUsername: {
        flex: 1,
        color: '#fff',
        fontSize: 14,
        fontWeight: '600',
    },
    listStatValue: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    listStatNum: {
        color: '#fff',
        fontWeight: '700',
        fontSize: 14,
    }
});

export default LeaderboardScreen;
