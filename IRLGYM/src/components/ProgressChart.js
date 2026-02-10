import React from 'react';
import { View, Text, Dimensions } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { Colors, Spacing } from '../styles/theme';
import { getExerciseHistory } from '../services/database';
import { auth } from '../services/firebaseConfig';

const ProgressChart = ({ exerciseName }) => {
  const historyWeights = getExerciseHistory(auth.currentUser?.uid, exerciseName);

  // Si no hay historial (menos de 2 registros), mostramos un mensaje
  if (historyWeights.length < 2) {
    return (
      <View style={{ height: 100, justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ color: Colors.gray, fontSize: 12 }}>
          Completa más entrenamientos para ver la evolución
        </Text>
      </View>
    );
  }

  // Limitamos a los últimos 6 registros para que no se amontonen
  const displayData = historyWeights.slice(-6);

  return (
    <View style={{ alignItems: 'center' }}>
      <LineChart
        data={{
          labels: displayData.map((_, i) => `${i + 1}º`),
          datasets: [{ data: displayData }]
        }}
        width={Dimensions.get('window').width - 70}
        height={180}
        chartConfig={{
          backgroundColor: Colors.white,
          backgroundGradientFrom: Colors.white,
          backgroundGradientTo: Colors.white,
          decimalPlaces: 1,
          color: (opacity = 1) => `rgba(0, 122, 255, ${opacity})`,
          labelColor: (opacity = 1) => Colors.gray,
          propsForDots: { r: "4", strokeWidth: "2", stroke: Colors.primary }
        }}
        bezier
        style={{ marginVertical: 8, borderRadius: 16 }}
      />
    </View>
  );
};

export default ProgressChart;