import React, { useState } from 'react';
import { 
    View, Text, TextInput, TouchableOpacity, StyleSheet, 
    Alert, ScrollView, KeyboardAvoidingView, Platform 
} from 'react-native';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../services/firebaseConfig'; 

const RegisterScreen = ({ navigation }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    const handleRegister = async () => {
        if (!email || !password || !confirmPassword) {
            Alert.alert('Error', 'Todos los campos son obligatorios');
            return;
        }
        if (password !== confirmPassword) {
            Alert.alert('Error', 'Las contraseñas no coinciden');
            return;
        }
        try {
            await createUserWithEmailAndPassword(auth, email, password);
            Alert.alert('¡Éxito!', 'Cuenta creada correctamente', [
                { text: 'Empezar', onPress: () => navigation.replace('MainApp') }
            ]);
        } catch (error) {
            Alert.alert('Error', 'No se pudo crear la cuenta (el correo puede que ya exista)');
        }
    };

    return (
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{flex: 1}}>
            <ScrollView contentContainerStyle={styles.container}>
                <Text style={styles.title}>Crear Cuenta</Text>
                <TextInput placeholder="Correo" value={email} onChangeText={setEmail} style={styles.input} autoCapitalize="none" />
                <TextInput placeholder="Contraseña" value={password} onChangeText={setPassword} style={styles.input} secureTextEntry />
                <TextInput placeholder="Confirmar Contraseña" value={confirmPassword} onChangeText={setConfirmPassword} style={styles.input} secureTextEntry />
                
                <TouchableOpacity onPress={handleRegister} style={styles.button}>
                    <Text style={styles.buttonText}>REGISTRARSE</Text>
                </TouchableOpacity>
                
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Text style={styles.linkText}>Volver al login</Text>
                </TouchableOpacity>
            </ScrollView>
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    container: { flexGrow: 1, padding: 30, justifyContent: 'center', backgroundColor: '#fff' },
    title: { fontSize: 28, fontWeight: 'bold', marginBottom: 30, textAlign: 'center', color: '#333' },
    input: { backgroundColor: '#f1f1f1', padding: 15, borderRadius: 8, marginBottom: 15, fontSize: 16 },
    button: { backgroundColor: '#4CD964', padding: 15, borderRadius: 8, alignItems: 'center', marginTop: 10 },
    buttonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
    linkText: { marginTop: 20, color: '#007AFF', textAlign: 'center' }
});

export default RegisterScreen;