import React, { useState } from 'react';
import { 
  StyleSheet, Text, TextInput, ActivityIndicator, 
  Alert, ScrollView, TouchableOpacity, View, SafeAreaView, Platform, StatusBar 
} from 'react-native';
import { AuthService } from '../../../application/service/AuthService';
import { Theme } from '../../styles/theme';
import { Ionicons } from '@expo/vector-icons';

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
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <View style={styles.logoCircle}>
            <Ionicons name="fitness" size={50} color={Theme.colors.success} />
          </View>
          <Text style={styles.title}>IRLGYM</Text>
          <Text style={styles.subtitle}>{isRegistering ? 'Crea tu leyenda' : 'Continúa tu progreso'}</Text>
        </View>

        <View style={styles.form}>
          {isRegistering && (
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Nombre de Guerrero</Text>
              <TextInput 
                placeholder="Ej: Kratos" 
                placeholderTextColor={Theme.colors.textSecondary}
                style={styles.input} 
                onChangeText={setUsername} 
                value={username} 
              />
            </View>
          )}

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email</Text>
            <TextInput 
              placeholder="tu@email.com" 
              placeholderTextColor={Theme.colors.textSecondary}
              style={styles.input} 
              onChangeText={setEmail} 
              value={email} 
              autoCapitalize="none" 
              keyboardType="email-address" 
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Contraseña</Text>
            <TextInput 
              placeholder="••••••••" 
              placeholderTextColor={Theme.colors.textSecondary}
              style={styles.input} 
              onChangeText={setPassword} 
              value={password} 
              secureTextEntry 
            />
          </View>

          {isRegistering && (
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Repetir Contraseña</Text>
              <TextInput 
                placeholder="••••••••" 
                placeholderTextColor={Theme.colors.textSecondary}
                style={styles.input} 
                onChangeText={setConfirmPassword} 
                value={confirmPassword} 
                secureTextEntry 
              />
            </View>
          )}

          {working ? (
            <ActivityIndicator color={Theme.colors.success} style={{ marginTop: 20 }} />
          ) : (
            <View style={styles.actions}>
              <TouchableOpacity style={styles.btnPrimary} onPress={handleAuth}>
                <Text style={styles.btnText}>{isRegistering ? "CREAR CUENTA" : "INICIAR SESIÓN"}</Text>
              </TouchableOpacity>
              
              <TouchableOpacity onPress={() => setIsRegistering(!isRegistering)} style={styles.toggleBtn}>
                <Text style={styles.toggleText}>
                  {isRegistering ? "¿Ya tienes cuenta? " : "¿Nuevo en IRLGYM? "}
                  <Text style={{color: Theme.colors.primary}}>{isRegistering ? "Entra aquí" : "Regístrate"}</Text>
                </Text>
              </TouchableOpacity>

              {!isRegistering && (
                <TouchableOpacity onPress={handleReset} style={styles.forgotBtn}>
                  <Text style={styles.forgotText}>¿Olvidaste tu contraseña?</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: Theme.colors.background,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0
  },
  scrollContent: { flexGrow: 1, padding: Theme.spacing.lg, justifyContent: 'center' },
  header: { alignItems: 'center', marginBottom: 40 },
  logoCircle: { 
    width: 100, height: 100, borderRadius: 50, backgroundColor: Theme.colors.card, 
    justifyContent: 'center', alignItems: 'center', marginBottom: 20,
    borderWidth: 1, borderColor: Theme.colors.border, ...Theme.shadows.medium
  },
  title: { ...Theme.typography.h1, fontSize: 48, letterSpacing: -2 },
  subtitle: { ...Theme.typography.caption, fontSize: 16, marginTop: 5 },
  form: { width: '100%' },
  inputGroup: { marginBottom: Theme.spacing.md },
  label: { ...Theme.typography.caption, fontWeight: '800', marginBottom: 8, marginLeft: 4 },
  input: { 
    backgroundColor: Theme.colors.card, padding: 16, borderRadius: Theme.roundness.md, 
    fontSize: 16, color: Theme.colors.text, borderWidth: 1, borderColor: Theme.colors.border
  },
  actions: { marginTop: Theme.spacing.lg },
  btnPrimary: { 
    backgroundColor: Theme.colors.success, padding: 18, borderRadius: Theme.roundness.lg, 
    alignItems: 'center', ...Theme.shadows.medium 
  },
  btnText: { color: '#fff', fontWeight: '900', fontSize: 16, letterSpacing: 1 },
  toggleBtn: { marginTop: 25, alignItems: 'center' },
  toggleText: { color: Theme.colors.textSecondary, fontWeight: '600', fontSize: 14 },
  forgotBtn: { marginTop: 20, alignItems: 'center' },
  forgotText: { color: Theme.colors.textTertiary, fontSize: 12, textDecorationLine: 'underline' }
});