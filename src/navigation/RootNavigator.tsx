import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '../store/AuthContext';
import TabNavigator from './TabNavigator';
import AuthNavigator from './AuthNavigator';
import DetailScreen from '../screens/DetailScreen';
import PlayScreen from '../screens/PlayScreen';
import SettingsScreen from '../screens/SettingsScreen';
import { View, ActivityIndicator } from 'react-native';

const RootStack = createNativeStackNavigator();

export const RootNavigator = () => {
    const { user, loading } = useAuth();

    if (loading) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', backgroundColor: '#121212' }}>
                <ActivityIndicator size="large" color="#ffffff" />
            </View>
        );
    }

    return (
        <NavigationContainer>
            {user ? (
                <RootStack.Navigator screenOptions={{ headerShown: false }}>
                    <RootStack.Screen name="MainTabs" component={TabNavigator} />
                    <RootStack.Screen name="Detail" component={DetailScreen} />
                    <RootStack.Screen name="Play" component={PlayScreen} />
                    <RootStack.Screen name="Settings" component={SettingsScreen} />
                </RootStack.Navigator>
            ) : (
                <AuthNavigator />
            )}
        </NavigationContainer>
    );
};
