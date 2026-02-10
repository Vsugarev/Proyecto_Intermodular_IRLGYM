import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, BorderRadius } from '../styles/theme';

const Badge = ({ icon, title, unlocked }) => (
  <View style={[styles.container, { opacity: unlocked ? 1 : 0.3 }]}>
    <View style={[styles.circle, { backgroundColor: unlocked ? Colors.primary : '#ccc' }]}>
      <Ionicons name={icon} size={24} color="white" />
    </View>
    <Text style={styles.text}>{title}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: { alignItems: 'center', margin: 10, width: 80 },
  circle: { width: 50, height: 50, borderRadius: 25, justifyContent: 'center', alignItems: 'center', marginBottom: 5 },
  text: { fontSize: 10, fontWeight: 'bold', textAlign: 'center', color: Colors.text }
});

export default Badge;