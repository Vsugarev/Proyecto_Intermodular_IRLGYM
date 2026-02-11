import React from 'react';
import { View, Text, TextInput } from 'react-native';
import { globalStyles } from '../styles/globalStyles';
import { Colors } from '../styles/theme';

const StatInput = ({ label, val, onChange, isWeight }) => (
  <View style={{ alignItems: 'center', marginRight: 15 }}>
    <Text style={globalStyles.caption}>{label}</Text>
    <TextInput 
      style={[
        globalStyles.input, 
        { 
          width: isWeight ? 65 : 50, 
          padding: 8, 
          textAlign: 'center', 
          marginBottom: 0, 
          marginTop: 5,
          borderWidth: 1,
          borderColor: Colors.lightGray 
        }
      ]}
      keyboardType="numeric"
      defaultValue={val?.toString()}
      selectTextOnFocus={true} // Facilita borrar el "0" al tocar
      onChangeText={(text) => {
        // Solo enviamos el cambio si es un número válido o vacío (que luego la DB manejará como 0)
        onChange(text.replace(/[^0-9.,]/g, ''));
      }}
    />
  </View>
);

export default StatInput;