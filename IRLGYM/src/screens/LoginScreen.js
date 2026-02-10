import React, { useState } from 'react';
import { View, Text, TextInput, Image, TouchableOpacity } from 'react-native';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../services/firebaseConfig';
import { globalStyles } from '../styles/globalStyles';
import { Colors } from '../styles/theme';
import CustomButton from '../components/CustomButton';

const LoginScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async () => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
      navigation.replace('MainApp');
    } catch (e) { alert("Error al entrar"); }
  };

  return (
    <View style={globalStyles.centerContainer}>
      <Image source={require('../../assets/icon.png')} style={{ width: 100, height: 100, marginBottom: 20 }} />
      <Text style={[globalStyles.title, { fontSize: 32 }]}>IRLGYM</Text>
      <TextInput placeholder="Email" value={email} onChangeText={setEmail} style={globalStyles.input} autoCapitalize="none" />
      <TextInput placeholder="Contraseña" value={password} onChangeText={setPassword} style={globalStyles.input} secureTextEntry />
      <CustomButton title="ENTRAR" onPress={handleLogin} />
      <TouchableOpacity onPress={() => navigation.navigate('Register')}>
        <Text style={{ marginTop: 20, color: Colors.primary }}>¿No tienes cuenta? Regístrate</Text>
      </TouchableOpacity>
    </View>
  );
};

export default LoginScreen;