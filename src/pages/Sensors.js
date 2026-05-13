import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Image,
  RefreshControl,
} from 'react-native';
import { ref, onValue, query, limitToLast } from 'firebase/database';
import { database } from '../firebase/firebaseConfig';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const Sensors = () => {
  const [data, setData] = useState({
    light: 0,
    temperature: 0,
    humidity_air: 0,
    soil_moisture: 0,
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    const dataRef = query(ref(database, 'He_thong_tuoi/sensors/data'), limitToLast(1));
    const unsubscribe = onValue(dataRef, (snapshot) => {
      if (snapshot.exists()) {
        let latest = {};
        snapshot.forEach((child) => {
          latest = child.val() || {};
        });
        setData({
          light: latest.light_lux ?? 0,
          temperature: latest.temperature ?? 0,
          humidity_air: latest.humidity ?? 0,
          soil_moisture: latest.soil_percent ?? 0,
        });
      }
      setLoading(false);
      setRefreshing(false);
    });
    return () => unsubscribe();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
  };

  const sensors = [
    {
      key: 'light',
      label: 'Ánh sáng',
      value: `${data.light?.toFixed(0) ?? '--'} lux`,
      icon: 'white-balance-sunny',
      color: '#F57F17',
      bgColor: '#FFF8E1',
      borderColor: '#FFE082',
    },
    {
      key: 'temperature',
      label: 'Nhiệt độ',
      value: `${data.temperature?.toFixed(1) ?? '--'}°C`,
      icon: 'thermometer',
      color: '#E65100',
      bgColor: '#FFF3E0',
      borderColor: '#FFAB91',
    },
    {
      key: 'humidity_air',
      label: 'Độ ẩm không khí',
      value: `${data.humidity_air?.toFixed(1) ?? '--'}%`,
      icon: 'water-percent',
      color: '#1565C0',
      bgColor: '#E3F2FD',
      borderColor: '#90CAF9',
    },
    {
      key: 'soil_moisture',
      label: 'Độ ẩm đất',
      value: `${data.soil_moisture?.toFixed(1) ?? '--'}%`,
      icon: 'flower',
      color: '#2E7D32',
      bgColor: '#E8F5E9',
      borderColor: '#A5D6A7',
    },
  ];

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2E7D32" />
        <Text style={styles.loadingText}>Đang đọc cảm biến...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Image
          source={{ uri: 'https://images.unsplash.com/photo-1574943320219-553eb213f72d?w=800&q=80' }}
          style={styles.bannerImage}
        />
        <View style={styles.headerOverlay}>
          <MaterialCommunityIcons name="chart-box" size={40} color="#fff" />
          <Text style={styles.headerTitle}>Cảm biến</Text>
          <Text style={styles.headerSubtitle}>Dữ liệu realtime từ IoT</Text>
        </View>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#2E7D32']} />
        }
      >
        {sensors.map((sensor) => (
          <View key={sensor.key} style={styles.sensorCard}>
            <View style={[styles.iconWrapper, { backgroundColor: sensor.bgColor }]}>
              <MaterialCommunityIcons name={sensor.icon} size={36} color={sensor.color} />
            </View>
            <View style={styles.sensorInfo}>
              <Text style={styles.sensorLabel}>{sensor.label}</Text>
              <Text style={[styles.sensorValue, { color: sensor.color }]}>{sensor.value}</Text>
            </View>
            <View style={[styles.statusIndicator, { borderColor: sensor.borderColor }]} />
          </View>
        ))}

        <View style={styles.liveBadge}>
          <View style={styles.liveDot} />
          <Text style={styles.liveText}>LIVE - Cập nhật realtime</Text>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f4f0',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f4f0',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  header: {
    height: 160,
    overflow: 'hidden',
  },
  bannerImage: {
    width: '100%',
    height: '100%',
  },
  headerOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(21, 101, 192, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 8,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#e3f2fd',
    marginTop: 2,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  sensorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 18,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  iconWrapper: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sensorInfo: {
    flex: 1,
    marginLeft: 16,
  },
  sensorLabel: {
    fontSize: 15,
    color: '#666',
    fontWeight: '500',
  },
  sensorValue: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 4,
  },
  statusIndicator: {
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 2,
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    marginBottom: 10,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#4CAF50',
    marginRight: 8,
  },
  liveText: {
    fontSize: 13,
    color: '#4CAF50',
    fontWeight: '600',
  },
});

export default Sensors;
