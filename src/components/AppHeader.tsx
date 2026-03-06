import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft, Menu, Search } from 'lucide-react-native';

type AppHeaderProps = {
    title?: string;
    showBrand?: boolean;
    showBack?: boolean;
    onBackPress?: () => void;
    backLabel?: string;
    showSearch?: boolean;
    showMenu?: boolean;
    withBorder?: boolean;
    transparent?: boolean;
    topInset?: boolean;
    style?: ViewStyle;
};

export const AppHeader = ({
    title,
    showBrand = true,
    showBack = false,
    onBackPress,
    backLabel = 'Back',
    showSearch = true,
    showMenu = true,
    withBorder = false,
    transparent = false,
    topInset = true,
    style,
}: AppHeaderProps) => {
    const insets = useSafeAreaInsets();

    return (
        <View
            style={[
                styles.container,
                {
                    paddingTop: topInset ? insets.top + 4 : 8,
                    borderBottomWidth: withBorder ? 1 : 0,
                    backgroundColor: transparent ? 'transparent' : '#14040f',
                },
                style,
            ]}
        >
            <View style={styles.row}>
                <View style={styles.left}>
                    {showBack ? (
                        <TouchableOpacity style={styles.backButton} onPress={onBackPress} activeOpacity={0.85}>
                            <ArrowLeft color="#f0e6ee" size={16} />
                            <Text style={styles.backText}>{backLabel}</Text>
                        </TouchableOpacity>
                    ) : showBrand ? (
                        <Text style={styles.brand}>Vibeo</Text>
                    ) : title ? (
                        <Text style={styles.title}>{title}</Text>
                    ) : null}
                </View>

                {title && showBrand ? <Text style={styles.title}>{title}</Text> : null}

                <View style={styles.right}>
                    {showSearch ? <Search color="#b4a2b2" size={18} /> : null}
                    {showMenu ? <Menu color="#f0e7ee" size={26} /> : null}
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        paddingHorizontal: 16,
        paddingBottom: 10,
        borderBottomColor: '#351325',
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        minHeight: 34,
    },
    left: {
        flexDirection: 'row',
        alignItems: 'center',
        minWidth: 84,
    },
    right: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 18,
        minWidth: 84,
        justifyContent: 'flex-end',
    },
    brand: {
        color: '#ff4f74',
        fontSize: 15,
        fontWeight: '800',
    },
    title: {
        color: '#f6edf1',
        fontSize: 18,
        fontWeight: '800',
    },
    backButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        borderRadius: 999,
        borderWidth: 1,
        borderColor: '#4a2538',
        backgroundColor: 'rgba(33, 14, 26, 0.8)',
        paddingHorizontal: 10,
        paddingVertical: 7,
    },
    backText: {
        color: '#f0e6ee',
        fontWeight: '700',
        fontSize: 13,
    },
});
