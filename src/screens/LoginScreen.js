import React, { useState } from 'react';
import { 
    View, Text, TextInput, TouchableOpacity, Image, 
    StyleSheet, KeyboardAvoidingView, Platform, Alert 
} from 'react-native';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../services/firebaseConfig';

const LoginScreen = ({ navigation }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const handleLogin = async () => {
        if (!email || !password) {
            Alert.alert('Error', 'Por favor, introduce tus credenciales');
            return;
        }
        try {
            await signInWithEmailAndPassword(auth, email, password);
            navigation.replace('MainApp');
        } catch (error) {
            console.log(error);
            Alert.alert('Error de Login', 'Correo o contraseña incorrectos');
        }
    };

    return (
        <KeyboardAvoidingView 
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
            style={styles.container}
        >
            <View style={styles.innerContainer}>
                <Image 
                    source={require('../../assets/icon.png')} 
                    style={styles.logo} 
                />
                <Text style={styles.title}>IRLGYM</Text>
                <Text style={styles.subtitle}>Tu gimnasio, tus reglas</Text>

                <View style={styles.inputContainer}>
                    <TextInput 
                        placeholder="Correo electrónico" 
                        value={email} 
                        onChangeText={setEmail} 
                        style={styles.input} 
                        autoCapitalize="none" 
                    />
                </View>

                <View style={styles.inputContainer}>
                    <TextInput 
                        placeholder="Contraseña" 
                        value={password} 
                        onChangeText={setPassword} 
                        style={styles.input} 
                        secureTextEntry 
                    />
                </View>

                <TouchableOpacity onPress={handleLogin} style={styles.button}>
                    <Text style={styles.buttonText}>INICIAR SESIÓN</Text>
                </TouchableOpacity>

                <TouchableOpacity onPress={() => navigation.navigate('Register')}>
                    <Text style={styles.linkText}>¿No tienes cuenta? Regístrate</Text>
                </TouchableOpacity>
            </View>
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#ffffff' },
    innerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 30 },
    logo: { width: 120, height: 120, marginBottom: 10, resizeMode: 'contain' },
    title: { fontSize: 32, fontWeight: 'bold', color: '#333' },
    subtitle: { fontSize: 16, color: '#666', marginBottom: 40 },
    inputContainer: { width: '100%', backgroundColor: '#f1f1f1', borderRadius: 8, marginBottom: 15, padding: 12 },
    input: { fontSize: 16, color: '#333' },
    button: { width: '100%', backgroundColor: '#007AFF', padding: 15, borderRadius: 8, alignItems: 'center', marginTop: 10 },
    buttonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
    linkText: { marginTop: 20, color: '#007AFF', fontSize: 14 },
});

export default LoginScreen;