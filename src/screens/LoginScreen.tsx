import React, { useMemo, useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    KeyboardAvoidingView,
    Platform,
    ActivityIndicator,
    ScrollView,
} from 'react-native';
import { useAuth } from '../store/AuthContext';
import { AppHeader } from '../components/AppHeader';

const LoginScreen = () => {
    const { login, register } = useAuth();

    const [mode, setMode] = useState<'login' | 'register'>('login');
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [errorText, setErrorText] = useState('');

    const ctaLabel = useMemo(() => (mode === 'login' ? 'Login' : 'Create Account'), [mode]);

    const onSubmit = async () => {
        if (!email || !password) {
            setErrorText('Email and password are required.');
            return;
        }

        if (mode === 'register' && password !== confirmPassword) {
            setErrorText('Passwords do not match.');
            return;
        }

        setSubmitting(true);
        setErrorText('');

        try {
            if (mode === 'login') {
                await login(email.trim(), password);
            } else {
                await register(email.trim(), password, name.trim() || undefined);
            }
        } catch (error: any) {
            setErrorText(error?.message || 'Authentication failed.');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={styles.root}
        >
            <AppHeader showSearch={false} showMenu={false} withBorder={false} />
            <ScrollView contentContainerStyle={styles.container}>
                <View style={styles.heroBlob} />
                <Text style={styles.heading}>Stream darker, bolder cinema.</Text>
                <Text style={styles.subheading}>Sign in or create an account to sync your watchlist and history.</Text>

                <View style={styles.modeSwitch}>
                    <TouchableOpacity
                        style={[styles.modeButton, mode === 'login' && styles.modeButtonActive]}
                        onPress={() => {
                            setMode('login');
                            setErrorText('');
                        }}
                    >
                        <Text style={[styles.modeText, mode === 'login' && styles.modeTextActive]}>Login</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.modeButton, mode === 'register' && styles.modeButtonActive]}
                        onPress={() => {
                            setMode('register');
                            setErrorText('');
                        }}
                    >
                        <Text style={[styles.modeText, mode === 'register' && styles.modeTextActive]}>Register</Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.card}>
                    {mode === 'register' ? (
                        <TextInput
                            style={styles.input}
                            placeholder="Display Name"
                            placeholderTextColor="#8f7388"
                            value={name}
                            onChangeText={setName}
                        />
                    ) : null}

                    <TextInput
                        style={styles.input}
                        placeholder="Email"
                        placeholderTextColor="#8f7388"
                        value={email}
                        onChangeText={setEmail}
                        autoCapitalize="none"
                        keyboardType="email-address"
                    />

                    <TextInput
                        style={styles.input}
                        placeholder="Password"
                        placeholderTextColor="#8f7388"
                        value={password}
                        onChangeText={setPassword}
                        secureTextEntry
                    />

                    {mode === 'register' ? (
                        <TextInput
                            style={styles.input}
                            placeholder="Confirm Password"
                            placeholderTextColor="#8f7388"
                            value={confirmPassword}
                            onChangeText={setConfirmPassword}
                            secureTextEntry
                        />
                    ) : null}

                    {errorText ? <Text style={styles.errorText}>{errorText}</Text> : null}

                    <TouchableOpacity style={styles.primaryButton} onPress={onSubmit} disabled={submitting}>
                        {submitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryButtonText}>{ctaLabel}</Text>}
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    root: {
        flex: 1,
        backgroundColor: '#10010b',
    },
    container: {
        flexGrow: 1,
        paddingHorizontal: 18,
        paddingTop: 20,
        paddingBottom: 30,
        backgroundColor: '#10010b',
    },
    heroBlob: {
        position: 'absolute',
        top: -120,
        right: -90,
        width: 340,
        height: 340,
        borderRadius: 999,
        backgroundColor: 'rgba(255, 61, 123, 0.2)',
    },
    heading: {
        color: '#fff4f8',
        fontSize: 30,
        fontWeight: '900',
        lineHeight: 34,
    },
    subheading: {
        marginTop: 10,
        marginBottom: 24,
        color: '#ccb2c3',
        fontSize: 14,
        lineHeight: 20,
    },
    modeSwitch: {
        flexDirection: 'row',
        marginBottom: 14,
        borderRadius: 14,
        backgroundColor: '#240915',
        padding: 4,
    },
    modeButton: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 10,
        paddingVertical: 12,
    },
    modeButtonActive: {
        backgroundColor: '#ff3f75',
    },
    modeText: {
        color: '#bba1b1',
        fontWeight: '700',
    },
    modeTextActive: {
        color: '#fff',
    },
    card: {
        borderRadius: 18,
        borderWidth: 1,
        borderColor: '#3a1a2d',
        backgroundColor: 'rgba(35, 11, 24, 0.9)',
        padding: 14,
    },
    input: {
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#49233a',
        backgroundColor: '#1d0b15',
        color: '#fff',
        paddingHorizontal: 12,
        paddingVertical: 12,
        marginBottom: 10,
    },
    errorText: {
        color: '#ff9fba',
        marginBottom: 10,
        fontSize: 13,
    },
    primaryButton: {
        marginTop: 6,
        borderRadius: 12,
        backgroundColor: '#ff2d61',
        alignItems: 'center',
        paddingVertical: 13,
    },
    primaryButtonText: {
        color: '#fff',
        fontWeight: '900',
        letterSpacing: 0.3,
    },
});

export default LoginScreen;
