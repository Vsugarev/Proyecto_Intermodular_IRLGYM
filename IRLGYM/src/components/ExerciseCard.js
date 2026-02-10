import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { globalStyles } from '../styles/globalStyles';
import { Colors } from '../styles/theme';

const ExerciseCard = ({ name, subtitle, onAction, iconName = "add-circle" }) => (
  <View style={globalStyles.card}>
    <View style={{ flex: 1 }}>
      <Text style={globalStyles.subtitle}>{name}</Text>
      <Text style={globalStyles.caption}>{subtitle}</Text>
    </View>
    <TouchableOpacity onPress={onAction}>
      <Ionicons name={iconName} size={30} color={iconName.includes('trash') ? Colors.danger : Colors.primary} />
    </TouchableOpacity>
  </View>
);

export default ExerciseCard;