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

const Home = () => {
  const [data, setData] = useState({
    auto_mode: false,
    pump_status: false,
    temperature: 0,
    soil_moisture: 0,
    light: 0,
    humidity_air: 0,
    water_liters: 0,
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
          auto_mode: false,
          pump_status: false,
          temperature: latest.temperature ?? 0,
          soil_moisture: latest.soil_percent ?? 0,
          light: latest.light_lux ?? 0,
          humidity_air: latest.humidity ?? 0,
          water_liters: 0,
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

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2E7D32" />
        <Text style={styles.loadingText}>Đang tải dữ liệu...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Image
          source={{ uri: 'https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?w=800&q=80' }}
          style={styles.bannerImage}
        />
        <View style={styles.headerOverlay}>
          <MaterialCommunityIcons name="sprout" size={40} color="#fff" />
          <Text style={styles.headerTitle}>Hệ thống tưới chính xác</Text>
          <Text style={styles.headerSubtitle}>Smart Irrigation System</Text>
        </View>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#2E7D32']} />
        }
      >
        <View style={styles.statusGrid}>
          <View style={[styles.statusCard, data.auto_mode ? styles.cardActive : styles.cardInactive]}>
            <MaterialCommunityIcons
              name={data.auto_mode ? 'autorenew' : 'autorenew'}
              size={36}
              color={data.auto_mode ? '#fff' : '#999'}
            />
            <Text style={[styles.statusLabel, data.auto_mode && { color: '#fff' }]}>Auto Mode</Text>
            <Text style={[styles.statusValue, data.auto_mode && { color: '#fff' }]}>
              {data.auto_mode ? 'ON' : 'OFF'}
            </Text>
          </View>

          <View style={[styles.statusCard, data.pump_status ? styles.cardActive : styles.cardInactive]}>
            <MaterialCommunityIcons
              name="water-pump"
              size={36}
              color={data.pump_status ? '#fff' : '#999'}
            />
            <Text style={[styles.statusLabel, data.pump_status && { color: '#fff' }]}>Pump</Text>
            <Text style={[styles.statusValue, data.pump_status && { color: '#fff' }]}>
              {data.pump_status ? 'ON' : 'OFF'}
            </Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Cảm biến realtime</Text>

        <View style={styles.sensorGrid}>
          <View style={styles.sensorCard}>
            <View style={[styles.iconContainer, { backgroundColor: '#FFF3E0' }]}>
              <MaterialCommunityIcons name="thermometer" size={28} color="#E65100" />
            </View>
            <Text style={styles.sensorLabel}>Nhiệt độ</Text>
            <Text style={styles.sensorValue}>{data.temperature?.toFixed(1) ?? '--'}°C</Text>
          </View>

          <View style={styles.sensorCard}>
            <View style={[styles.iconContainer, { backgroundColor: '#E8F5E9' }]}>
              <MaterialCommunityIcons name="flower" size={28} color="#2E7D32" />
            </View>
            <Text style={styles.sensorLabel}>Độ ẩm đất</Text>
            <Text style={styles.sensorValue}>{data.soil_moisture?.toFixed(1) ?? '--'}%</Text>
          </View>

          <View style={styles.sensorCard}>
            <View style={[styles.iconContainer, { backgroundColor: '#FFFDE7' }]}>
              <MaterialCommunityIcons name="white-balance-sunny" size={28} color="#F57F17" />
            </View>
            <Text style={styles.sensorLabel}>Ánh sáng</Text>
            <Text style={styles.sensorValue}>{data.light?.toFixed(0) ?? '--'} lux</Text>
          </View>

          <View style={styles.sensorCard}>
            <View style={[styles.iconContainer, { backgroundColor: '#E3F2FD' }]}>
              <MaterialCommunityIcons name="water-percent" size={28} color="#1565C0" />
            </View>
            <Text style={styles.sensorLabel}>Độ ẩm KK</Text>
            <Text style={styles.sensorValue}>{data.humidity_air?.toFixed(1) ?? '--'}%</Text>
          </View>
        </View>

        <View style={styles.waterCard}>
          <MaterialCommunityIcons name="cup-water" size={32} color="#1565C0" />
          <Text style={styles.waterLabel}>Lượng nước đã tưới</Text>
          <Text style={styles.waterValue}>{data.water_liters?.toFixed(2) ?? '0.00'} L</Text>
        </View>

        <View style={{ height: 20 }} />
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
    height: 180,
    overflow: 'hidden',
  },
  bannerImage: {
    width: '100%',
    height: '100%',
  },
  headerOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(46, 125, 50, 0.75)',
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
    color: '#e8f5e9',
    marginTop: 2,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  statusGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  statusCard: {
    flex: 1,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardActive: {
    backgroundColor: '#2E7D32',
  },
  cardInactive: {
    backgroundColor: '#fff',
  },
  statusLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 8,
    color: '#666',
  },
  statusValue: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 4,
    color: '#666',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  sensorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  sensorCard: {
    width: '48%',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  sensorLabel: {
    fontSize: 13,
    color: '#666',
    textAlign: 'center',
  },
  sensorValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 4,
  },
  waterCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginTop: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  waterLabel: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
  },
  waterValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1565C0',
    marginTop: 4,
  },
});

export default Home;
