import React from 'react';
import { View, Text, StyleSheet, Switch, ScrollView, TouchableOpacity } from 'react-native';
import { useSettings } from '../store/SettingsContext';
import { AppHeader } from '../components/AppHeader';

const SettingsScreen = ({ navigation }: any) => {
    const { settings, updateSetting, clearStorage } = useSettings();

    const handleClearStorage = async () => {
        await clearStorage();
        alert('Local preferences reset successfully');
    };

    return (
        <View style={styles.container}>
            <AppHeader
                title="Settings"
                showBrand={false}
                showBack
                onBackPress={() => navigation.goBack()}
                showSearch={false}
                showMenu={false}
            />
            <ScrollView>

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
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#12030d',
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
