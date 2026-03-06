import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

type Theme = 'dark' | 'light';

interface Settings {
    theme: Theme;
    glassEffect: boolean;
    showMetadata: boolean;
}

interface SettingsContextType {
    settings: Settings;
    updateSetting: <K extends keyof Settings>(key: K, value: Settings[K]) => void;
    clearStorage: () => Promise<void>;
}

const defaultSettings: Settings = {
    theme: 'dark',
    glassEffect: true,
    showMetadata: true,
};

const SettingsContext = createContext<SettingsContextType>({
    settings: defaultSettings,
    updateSetting: () => { },
    clearStorage: async () => { },
});

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [settings, setSettings] = useState<Settings>(defaultSettings);

    useEffect(() => {
        loadSettings();
    }, []);

    const loadSettings = async () => {
        try {
            const saved = await AsyncStorage.getItem('@vibeo_settings');
            if (saved) setSettings(JSON.parse(saved));
        } catch (e) {
            console.error('Failed to load settings', e);
        }
    };

    const updateSetting = async <K extends keyof Settings>(key: K, value: Settings[K]) => {
        try {
            const newSettings = { ...settings, [key]: value };
            setSettings(newSettings);
            await AsyncStorage.setItem('@vibeo_settings', JSON.stringify(newSettings));
        } catch (e) {
            console.error('Failed to save setting', e);
        }
    };

    const clearStorage = async () => {
        try {
            await AsyncStorage.clear();
            setSettings(defaultSettings);
        } catch (e) {
            console.error('Failed to clear storage', e);
        }
    };

    return (
        <SettingsContext.Provider value={{ settings, updateSetting, clearStorage }}>
            {children}
        </SettingsContext.Provider>
    );
};

export const useSettings = () => useContext(SettingsContext);
