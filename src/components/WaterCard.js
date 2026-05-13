import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const WaterCard = ({ waterLiters, pumpStatus }) => {
  return (
    <View style={styles.container}>
      <View style={styles.iconContainer}>
        <MaterialCommunityIcons name="cup-water" size={40} color="#1565C0" />
      </View>
      <Text style={styles.label}>Lượng nước đã tưới</Text>
      <Text style={styles.value}>{waterLiters?.toFixed(2) ?? '0.00'} L</Text>
      <View style={[styles.statusBadge, pumpStatus ? styles.statusOn : styles.statusOff]}>
        <Text style={styles.statusText}>
          {pumpStatus ? 'Đang tưới' : 'Đã tắt'}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  iconContainer: {
    marginBottom: 8,
  },
  label: {
    fontSize: 15,
    color: '#666',
    fontWeight: '500',
  },
  value: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1565C0',
    marginTop: 4,
  },
  statusBadge: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 16,
    marginTop: 10,
  },
  statusOn: {
    backgroundColor: '#E3F2FD',
  },
  statusOff: {
    backgroundColor: '#f5f5f5',
  },
  statusText: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#1565C0',
  },
});

export default WaterCard;
