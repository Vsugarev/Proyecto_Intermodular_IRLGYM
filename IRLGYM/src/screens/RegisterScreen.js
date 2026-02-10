import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../services/firebaseConfig'; 
import { globalStyles } from '../styles/globalStyles';
import { Colors } from '../styles/theme';
import CustomButton from '../components/CustomButton';

const RegisterScreen = ({ navigation }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    const handleRegister = async () => {
        if (password !== confirmPassword) return alert('Las contraseñas no coinciden');
        try {
            await createUserWithEmailAndPassword(auth, email, password);
            navigation.replace('MainApp');
        } catch (error) {
            alert("Error al crear cuenta");
        }
    };

    return (
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{flex: 1}}>
            <ScrollView contentContainerStyle={globalStyles.centerContainer}>
                <Text style={globalStyles.title}>Crear Cuenta</Text>
                <TextInput placeholder="Correo" value={email} onChangeText={setEmail} style={globalStyles.input} autoCapitalize="none" />
                <TextInput placeholder="Contraseña" value={password} onChangeText={setPassword} style={globalStyles.input} secureTextEntry />
                <TextInput placeholder="Confirmar" value={confirmPassword} onChangeText={setConfirmPassword} style={globalStyles.input} secureTextEntry />
                
                <CustomButton title="REGISTRARSE" type="success" onPress={handleRegister} />
                
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Text style={{ marginTop: 20, color: Colors.primary }}>Volver al login</Text>
                </TouchableOpacity>
            </ScrollView>
        </KeyboardAvoidingView>
    );
};

export default RegisterScreen;