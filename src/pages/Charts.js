import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  Image,
  Dimensions,
} from 'react-native';
import { ref, onValue, query, orderByKey, limitToLast } from 'firebase/database';
import { database } from '../firebase/firebaseConfig';
import { LineChart } from 'react-native-chart-kit';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const screenWidth = Dimensions.get('window').width;
const chartWidth = screenWidth - 32;

const Charts = () => {
  const [sensorHistory, setSensorHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sensorType, setSensorType] = useState('temperature');

  useEffect(() => {
    const sensorQuery = query(
      ref(database, 'He_thong_tuoi/sensors/data'),
      orderByKey(),
      limitToLast(10)
    );

    const unsubSensor = onValue(sensorQuery, (snapshot) => {
      if (snapshot.exists()) {
        const data = [];
        snapshot.forEach((child) => {
          const val = child.val() || {};
          data.push({
            key: child.key,
            temperature: val.temperature ?? 0,
            humidity_air: val.humidity ?? 0,
            soil_moisture: val.soil_percent ?? 0,
            light: val.light_lux ?? 0,
          });
        });
        setSensorHistory(data);
      }
      setLoading(false);
    });

    return () => {
      unsubSensor();
    };
  }, []);

  const getChartData = () => {
    if (sensorHistory.length === 0) {
      return {
        labels: [],
        datasets: [{ data: [0] }],
      };
    }

    const labels = sensorHistory.map((_, i) => `#${i + 1}`);
    const values = sensorHistory.map((item) => {
      const val = item[sensorType];
      return typeof val === 'number' ? val : 0;
    });

    return {
      labels,
      datasets: [{ data: values }],
    };
  };

  const sensorOptions = [
    { key: 'temperature', label: 'Nhiệt độ', icon: 'thermometer', color: '#E65100' },
    { key: 'humidity_air', label: 'Độ ẩm KK', icon: 'water-percent', color: '#1565C0' },
    { key: 'soil_moisture', label: 'Độ ẩm đất', icon: 'flower', color: '#2E7D32' },
    { key: 'light', label: 'Ánh sáng', icon: 'white-balance-sunny', color: '#F57F17' },
  ];

  const chartConfig = {
    backgroundColor: '#ffffff',
    backgroundGradientFrom: '#ffffff',
    backgroundGradientTo: '#ffffff',
    decimalPlaces: 1,
    color: (opacity = 1) => `rgba(46, 125, 50, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(51, 51, 51, ${opacity})`,
    style: {
      borderRadius: 16,
    },
    propsForDots: {
      r: '4',
      strokeWidth: '2',
      stroke: '#2E7D32',
    },
    propsForBackgroundLines: {
      strokeDasharray: '',
      stroke: '#e0e0e0',
    },
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
          source={{ uri: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&q=80' }}
          style={styles.bannerImage}
        />
        <View style={styles.headerOverlay}>
          <MaterialCommunityIcons name="chart-line" size={40} color="#fff" />
          <Text style={styles.headerTitle}>Biểu đồ</Text>
          <Text style={styles.headerSubtitle}>Lịch sử dữ liệu cảm biến & tưới</Text>
        </View>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
          {sensorOptions.map((option) => (
            <TouchableOpacity
              key={option.key}
              style={[
                styles.filterChip,
                sensorType === option.key && { backgroundColor: option.color },
              ]}
              onPress={() => setSensorType(option.key)}
            >
              <MaterialCommunityIcons
                name={option.icon}
                size={18}
                color={sensorType === option.key ? '#fff' : option.color}
              />
              <Text
                style={[
                  styles.filterChipText,
                  sensorType === option.key && { color: '#fff' },
                ]}
              >
                {option.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <View style={styles.chartContainer}>
          <Text style={styles.chartTitle}>
            {sensorOptions.find((o) => o.key === sensorType)?.label} - 10 mẫu gần nhất
          </Text>
          {sensorHistory.length > 0 ? (
            <LineChart
              data={getChartData()}
              width={chartWidth}
              height={220}
              chartConfig={chartConfig}
              bezier
              style={styles.chart}
              withInnerLines={true}
              withOuterLines={true}
              withVerticalLines={false}
              withHorizontalLines={true}
              fromZero={false}
            />
          ) : (
            <View style={styles.emptyChart}>
              <MaterialCommunityIcons name="chart-line" size={48} color="#ccc" />
              <Text style={styles.emptyText}>Chưa có dữ liệu cảm biến</Text>
            </View>
          )}
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
    backgroundColor: 'rgba(46, 125, 50, 0.7)',
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
  },
  scrollContent: {
    padding: 16,
  },
  filterScroll: {
    marginBottom: 16,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    gap: 6,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  filterChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#666',
  },
  chartContainer: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  chart: {
    borderRadius: 12,
    marginVertical: 8,
  },
  emptyChart: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    marginTop: 12,
    fontSize: 15,
    color: '#999',
  },
});

export default Charts;
