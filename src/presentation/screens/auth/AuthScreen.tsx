import React, { useState } from 'react';
import { 
  StyleSheet, Text, TextInput, ActivityIndicator, 
  Alert, ScrollView, TouchableOpacity 
} from 'react-native';
import { AuthService } from '../../../application/service/AuthService';

export const AuthScreen = () => {
  const [isRegistering, setIsRegistering] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [username, setUsername] = useState('');
  const [working, setWorking] = useState(false);

  const handleAuth = async () => {
    if (!email || !password) {
      Alert.alert("Error", "Rellena los campos básicos");
      return;
    }
    setWorking(true);
    try {
      if (isRegistering) {
        await AuthService.register(email, password, confirmPassword, username);
        Alert.alert("¡Bienvenido!", "Cuenta creada con éxito");
      } else {
        await AuthService.login(email, password);
      }
    } catch (err: any) {
      Alert.alert("Error", err.message || err);
    } finally {
      setWorking(false);
    }
  };

  const handleReset = async () => {
    if (!email) {
      Alert.alert("Aviso", "Introduce tu email arriba");
      return;
    }
    try {
      await AuthService.resetPassword(email);
      Alert.alert("Email enviado", "Revisa tu bandeja de entrada");
    } catch (err: any) {
      Alert.alert("Error", "No se pudo enviar");
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.authContainer}>
      <Text style={styles.title}>IRLGYM</Text>
      <Text style={styles.subtitle}>{isRegistering ? 'Crea tu leyenda' : 'Continua tu progreso'}</Text>

      {isRegistering && (
        <TextInput placeholder="Nombre de Guerrero" style={styles.input} onChangeText={setUsername} value={username} />
      )}

      <TextInput 
        placeholder="Email" style={styles.input} onChangeText={setEmail} value={email} 
        autoCapitalize="none" keyboardType="email-address" 
      />

      <TextInput 
        placeholder="Contraseña" style={styles.input} onChangeText={setPassword} value={password} 
        secureTextEntry 
      />

      {isRegistering && (
        <TextInput 
          placeholder="Repetir Contraseña" style={styles.input} 
          onChangeText={setConfirmPassword} value={confirmPassword} secureTextEntry 
        />
      )}

      {working ? (
        <ActivityIndicator color="#28a745" />
      ) : (
        <>
          <TouchableOpacity style={styles.btnPrimary} onPress={handleAuth}>
            <Text style={styles.btnText}>{isRegistering ? "REGISTRARSE" : "ENTRAR"}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setIsRegistering(!isRegistering)}>
            <Text style={styles.toggleText}>
              {isRegistering ? "¿Ya tienes cuenta? Login" : "¿No tienes cuenta? Regístrate"}
            </Text>
          </TouchableOpacity>
          {!isRegistering && (
            <TouchableOpacity onPress={handleReset}>
              <Text style={styles.forgotText}>¿Olvidaste tu contraseña?</Text>
            </TouchableOpacity>
          )}
        </>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  authContainer: { flexGrow: 1, padding: 30, justifyContent: 'center', backgroundColor: '#fff' },
  title: { fontSize: 40, fontWeight: 'bold', textAlign: 'center', color: '#1a1a1a' },
  subtitle: { fontSize: 16, textAlign: 'center', color: '#666', marginBottom: 30 },
  input: { borderWidth: 1, borderColor: '#eee', padding: 15, borderRadius: 12, marginBottom: 15, backgroundColor: '#f9f9f9' },
  btnPrimary: { backgroundColor: '#28a745', padding: 18, borderRadius: 12, alignItems: 'center', marginTop: 10 },
  btnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  toggleText: { textAlign: 'center', marginTop: 20, color: '#007AFF', fontWeight: '600' },
  forgotText: { textAlign: 'center', marginTop: 15, color: '#999', fontSize: 13, textDecorationLine: 'underline' }
});