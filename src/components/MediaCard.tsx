import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';
import { Movie, TVShow } from '../types/tmdb';
import { getImageUrl } from '../api/tmdb';
import { getMediaTitle, getMediaType, getMediaYear } from '../utils/media';

interface MediaCardProps {
    item: Movie | TVShow;
    onPress: (item: Movie | TVShow) => void;
    width?: number;
    height?: number;
    showSubtitle?: boolean;
}

export const MediaCard: React.FC<MediaCardProps> = ({
    item,
    onPress,
    width = 126,
    height = 188,
    showSubtitle = true,
}) => {
    const title = getMediaTitle(item);
    const imageUrl = getImageUrl(item.poster_path, 'w500');
    const mediaType = getMediaType(item);

    return (
        <TouchableOpacity
            style={[styles.container, { width }]}
            onPress={() => onPress(item)}
            activeOpacity={0.82}
        >
            <View style={[styles.imageContainer, { width, height }]}>
                {imageUrl ? (
                    <Image source={{ uri: imageUrl }} style={styles.image} resizeMode="cover" />
                ) : (
                    <View style={[styles.image, styles.placeholder]}>
                        <Text style={styles.placeholderText}>NO IMAGE</Text>
                    </View>
                )}
                <View style={styles.ratingBadge}>
                    <Text style={styles.ratingText}>{item.vote_average.toFixed(1)}</Text>
                </View>
            </View>

            <Text style={styles.title} numberOfLines={1}>
                {title}
            </Text>

            {showSubtitle ? (
                <Text style={styles.subtitle}>
                    {getMediaYear(item)}  {mediaType === 'movie' ? 'Movie' : 'Series'}
                </Text>
            ) : null}
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    container: {
        marginRight: 14,
    },
    imageContainer: {
        borderRadius: 14,
        overflow: 'hidden',
        backgroundColor: '#2a1a27',
        marginBottom: 10,
    },
    image: {
        width: '100%',
        height: '100%',
    },
    placeholder: {
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#382434',
    },
    placeholderText: {
        color: '#bda2bc',
        fontSize: 10,
        fontWeight: '700',
        letterSpacing: 0.8,
    },
    ratingBadge: {
        position: 'absolute',
        top: 8,
        right: 8,
        borderRadius: 10,
        paddingHorizontal: 8,
        paddingVertical: 4,
        backgroundColor: '#f7a51a',
    },
    ratingText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: '800',
    },
    title: {
        color: '#f2e8ef',
        fontSize: 29 / 2,
        fontWeight: '700',
    },
    subtitle: {
        marginTop: 2,
        color: '#a48c9e',
        fontSize: 12,
    },
});
