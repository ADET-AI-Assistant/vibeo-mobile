import React from 'react';
import { View, Text, StyleSheet, Switch, ScrollView, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSettings } from '../store/SettingsContext';

const SettingsScreen = ({ navigation }: any) => {
    const { settings, updateSetting, clearStorage } = useSettings();
    const insets = useSafeAreaInsets();

    const handleClearStorage = async () => {
        await clearStorage();
        alert('Local preferences reset successfully');
    };

    return (
        <ScrollView style={[styles.container, { paddingTop: insets.top }]}> 
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Text style={styles.backButtonText}>Back</Text>
                </TouchableOpacity>
                <Text style={styles.title}>Settings</Text>
            </View>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Appearance</Text>

                <View style={styles.settingRow}>
                    <Text style={styles.settingLabel}>Dark Theme</Text>
                    <Switch
                        value={settings.theme === 'dark'}
                        onValueChange={(val) => updateSetting('theme', val ? 'dark' : 'light')}
                        trackColor={{ false: '#767577', true: '#ff2f66' }}
                        thumbColor={'#fff'}
                    />
                </View>

                <View style={styles.settingRow}>
                    <Text style={styles.settingLabel}>Glass UI Effects</Text>
                    <Switch
                        value={settings.glassEffect}
                        onValueChange={(val) => updateSetting('glassEffect', val)}
                        trackColor={{ false: '#767577', true: '#ff2f66' }}
                        thumbColor={'#fff'}
                    />
                </View>

                <View style={styles.settingRow}>
                    <Text style={styles.settingLabel}>Show Metadata on Cards</Text>
                    <Switch
                        value={settings.showMetadata}
                        onValueChange={(val) => updateSetting('showMetadata', val)}
                        trackColor={{ false: '#767577', true: '#ff2f66' }}
                        thumbColor={'#fff'}
                    />
                </View>
            </View>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Data & Storage</Text>

                <TouchableOpacity style={styles.actionButton} onPress={handleClearStorage}>
                    <Text style={styles.actionButtonText}>Reset Local Preferences</Text>
                </TouchableOpacity>
            </View>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Backend</Text>
                <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Provider</Text>
                    <Text style={styles.infoValue}>Convex</Text>
                </View>
                <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Version</Text>
                    <Text style={styles.infoValue}>1.0.0 (Expo)</Text>
                </View>
            </View>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#12030d',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        marginBottom: 30,
        position: 'relative',
        justifyContent: 'center',
    },
    backButton: {
        position: 'absolute',
        left: 20,
        padding: 8,
    },
    backButtonText: {
        color: '#fff',
        fontSize: 16,
    },
    title: {
        color: '#fff',
        fontSize: 20,
        fontWeight: 'bold',
    },
    section: {
        marginBottom: 30,
        borderBottomWidth: 1,
        borderBottomColor: '#2a1321',
        paddingBottom: 20,
    },
    sectionTitle: {
        color: '#aa8fa1',
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 15,
        paddingHorizontal: 20,
        textTransform: 'uppercase',
    },
    settingRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 12,
    },
    settingLabel: {
        color: '#fff',
        fontSize: 16,
    },
    actionButton: {
        paddingHorizontal: 20,
        paddingVertical: 12,
    },
    actionButtonText: {
        color: '#ff4f79',
        fontSize: 16,
    },
    infoRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 12,
    },
    infoLabel: {
        color: '#fff',
        fontSize: 16,
    },
    infoValue: {
        color: '#a78fa0',
        fontSize: 16,
    },
});

export default SettingsScreen;
