import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Switch,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  Image,
} from 'react-native';
import { ref, onValue, set } from 'firebase/database';
import { database } from '../firebase/firebaseConfig';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const WaterPump = () => {
  const [data, setData] = useState({
    water_liters: 0,
    pump_status: false,
    auto_mode: false,
  });
  const [loading, setLoading] = useState(true);
  const [autoMode, setAutoMode] = useState(false);
  const [pumpOn, setPumpOn] = useState(false);
  const [manualTime, setManualTime] = useState('10');
  const [controlLoading, setControlLoading] = useState(false);

  useEffect(() => {
    const currentRef = ref(database, 'current');
    const unsubscribe = onValue(currentRef, (snapshot) => {
      if (snapshot.exists()) {
        const val = snapshot.val();
        setData({
          water_liters: val.water_liters || 0,
          pump_status: val.pump_status || false,
          auto_mode: val.auto_mode || false,
        });
        setAutoMode(val.auto_mode || false);
        setPumpOn(val.pump_status || false);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const toggleAutoMode = async (value) => {
    setControlLoading(true);
    try {
      await set(ref(database, 'control/auto_mode'), value);
      setAutoMode(value);
      Alert.alert(
        value ? 'Auto Mode BẬT' : 'Auto Mode TẮT',
        value
          ? 'Hệ thống sẽ tự động tưới dựa trên cảm biến'
          : 'Đã chuyển sang chế độ điều khiển thủ công'
      );
    } catch (error) {
      Alert.alert('Lỗi', 'Không thể thay đổi chế độ: ' + error.message);
    } finally {
      setControlLoading(false);
    }
  };

  const handlePumpOn = async () => {
    setControlLoading(true);
    try {
      const time = parseInt(manualTime) || 10;
      await set(ref(database, 'control/manual_pump'), 1);
      await set(ref(database, 'control/manual_time'), time);
      setPumpOn(true);
      Alert.alert('Bật bơm', `Máy bơm đã bật. Thời gian: ${time} giây`);
    } catch (error) {
      Alert.alert('Lỗi', 'Không thể bật bơm: ' + error.message);
    } finally {
      setControlLoading(false);
    }
  };

  const handlePumpOff = async () => {
    setControlLoading(true);
    try {
      await set(ref(database, 'control/manual_pump'), 0);
      setPumpOn(false);
      Alert.alert('Tắt bơm', 'Máy bơm đã tắt');
    } catch (error) {
      Alert.alert('Lỗi', 'Không thể tắt bơm: ' + error.message);
    } finally {
      setControlLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1565C0" />
        <Text style={styles.loadingText}>Đang tải...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Image
          source={{ uri: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80' }}
          style={styles.bannerImage}
        />
        <View style={styles.headerOverlay}>
          <MaterialCommunityIcons name="water-pump" size={40} color="#fff" />
          <Text style={styles.headerTitle}>Điều khiển bơm</Text>
          <Text style={styles.headerSubtitle}>Tưới thủ công & tự động</Text>
        </View>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
        <View style={styles.waterDisplay}>
          <MaterialCommunityIcons name="cup-water" size={48} color="#1565C0" />
          <Text style={styles.waterLabel}>Lượng nước đã tưới</Text>
          <Text style={styles.waterValue}>{data.water_liters?.toFixed(2) ?? '0.00'} L</Text>
        </View>

        <View style={styles.pumpStatusCard}>
          <MaterialCommunityIcons
            name={data.pump_status ? 'water-pump' : 'water-pump-off'}
            size={32}
            color={data.pump_status ? '#1565C0' : '#999'}
          />
          <Text style={styles.pumpStatusLabel}>Trạng thái bơm</Text>
          <View style={[styles.pumpBadge, data.pump_status ? styles.pumpOn : styles.pumpOff]}>
            <Text style={styles.pumpBadgeText}>{data.pump_status ? 'ĐANG CHẠY' : 'ĐÃ TẮT'}</Text>
          </View>
        </View>

        <View style={styles.controlCard}>
          <View style={styles.controlHeader}>
            <MaterialCommunityIcons name="autorenew" size={24} color="#2E7D32" />
            <Text style={styles.controlTitle}>Auto Mode</Text>
            <Switch
              value={autoMode}
              onValueChange={toggleAutoMode}
              trackColor={{ false: '#ccc', true: '#81C784' }}
              thumbColor={autoMode ? '#2E7D32' : '#f4f3f4'}
              disabled={controlLoading}
            />
          </View>
          <Text style={styles.controlDesc}>
            {autoMode
              ? 'Hệ thống tự động tưới dựa trên độ ẩm đất'
              : 'Bạn đang ở chế độ thủ công'}
          </Text>
        </View>

        <View style={styles.manualCard}>
          <Text style={styles.manualTitle}>
            <MaterialCommunityIcons name="gesture-tap" size={20} color="#1565C0" /> Điều khiển thủ công
          </Text>

          <View style={styles.timeInputContainer}>
            <Text style={styles.timeLabel}>Thời gian tưới (giây):</Text>
            <TextInput
              style={styles.timeInput}
              value={manualTime}
              onChangeText={setManualTime}
              keyboardType="number-pad"
              placeholder="10"
              placeholderTextColor="#999"
            />
          </View>

          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={[styles.controlButton, styles.pumpOnButton]}
              onPress={handlePumpOn}
              disabled={controlLoading}
            >
              {controlLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <MaterialCommunityIcons name="power-on" size={22} color="#fff" />
                  <Text style={styles.controlButtonText}>Pump ON</Text>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.controlButton, styles.pumpOffButton]}
              onPress={handlePumpOff}
              disabled={controlLoading}
            >
              {controlLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <MaterialCommunityIcons name="power-off" size={22} color="#fff" />
                  <Text style={styles.controlButtonText}>Pump OFF</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
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
    backgroundColor: 'rgba(21, 101, 192, 0.75)',
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
  waterDisplay: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    marginBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  waterLabel: {
    fontSize: 16,
    color: '#666',
    marginTop: 8,
    fontWeight: '500',
  },
  waterValue: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#1565C0',
    marginTop: 4,
  },
  pumpStatusCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 18,
    alignItems: 'center',
    marginBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  pumpStatusLabel: {
    fontSize: 15,
    color: '#666',
    marginTop: 8,
    fontWeight: '500',
  },
  pumpBadge: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    marginTop: 8,
  },
  pumpOn: {
    backgroundColor: '#E3F2FD',
  },
  pumpOff: {
    backgroundColor: '#f5f5f5',
  },
  pumpBadgeText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1565C0',
  },
  controlCard: {
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
  controlHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  controlTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginLeft: 10,
  },
  controlDesc: {
    fontSize: 14,
    color: '#888',
    paddingLeft: 34,
  },
  manualCard: {
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
  manualTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  timeInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  timeLabel: {
    fontSize: 15,
    color: '#555',
    flex: 1,
  },
  timeInput: {
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
    width: 80,
    height: 44,
    textAlign: 'center',
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
  },
  controlButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    height: 52,
    gap: 8,
  },
  pumpOnButton: {
    backgroundColor: '#1565C0',
    shadowColor: '#1565C0',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  pumpOffButton: {
    backgroundColor: '#c62828',
    shadowColor: '#c62828',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  controlButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default WaterPump;
