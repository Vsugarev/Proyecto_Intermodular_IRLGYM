import React from 'react';
import { TouchableOpacity, Text } from 'react-native';
import { globalStyles } from '../styles/globalStyles';
import { Colors } from '../styles/theme';

const CustomButton = ({ title, onPress, type = 'primary', style }) => {
  const getButtonStyle = () => {
    if (type === 'success') return globalStyles.buttonSuccess;
    if (type === 'danger') return [globalStyles.buttonPrimary, { backgroundColor: Colors.danger }];
    return globalStyles.buttonPrimary;
  };

  return (
    <TouchableOpacity style={[getButtonStyle(), style]} onPress={onPress}>
      <Text style={globalStyles.buttonText}>{title}</Text>
    </TouchableOpacity>
  );
};

export default CustomButton;