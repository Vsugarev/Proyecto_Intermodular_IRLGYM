import React from 'react';
import { View, Text, TextInput } from 'react-native';
import { globalStyles } from '../styles/globalStyles';

const StatInput = ({ label, val, onChange, isWeight }) => (
  <View style={{ alignItems: 'center', marginRight: 15 }}>
    <Text style={globalStyles.caption}>{label}</Text>
    <TextInput 
      style={[globalStyles.input, { width: isWeight ? 60 : 45, padding: 5, textAlign: 'center', marginBottom: 0, marginTop: 5 }]}
      keyboardType="numeric"
      defaultValue={val?.toString()}
      onChangeText={onChange}
    />
  </View>
);

export default StatInput;