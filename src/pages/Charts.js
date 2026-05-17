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
  Modal,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { ref, onValue, query, orderByKey, startAt, limitToLast } from 'firebase/database';
import { database } from '../firebase/firebaseConfig';
import { LineChart } from 'react-native-chart-kit';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, fonts, radii, spacing, shadows } from '../styles/theme';

const { width: screenWidth } = Dimensions.get('window');

const SENSOR_OPTIONS = [
  { key: 'temperature', label: 'Nhiệt độ', icon: 'thermometer', color: colors.accentSun, bgColor: colors.accentSunSoft, unit: '°C' },
  { key: 'humidity_air', label: 'Độ ẩm KK', icon: 'water-percent', color: colors.accentBlue, bgColor: colors.accentBlueSoft, unit: '%' },
  { key: 'soil_moisture', label: 'Độ ẩm đất', icon: 'flower', color: colors.primary, bgColor: colors.primaryLight, unit: '%' },
  { key: 'light', label: 'Ánh sáng', icon: 'white-balance-sunny', color: colors.accentSun, bgColor: colors.accentSunSoft, unit: ' lux' },
];

// Hàm lấy bớt dữ liệu để biểu đồ không bị lag (tối đa ~15-20 điểm)
const downsampleData = (data, maxPoints = 15) => {
  if (data.length <= maxPoints) return data;
  const step = Math.ceil(data.length / maxPoints);
  const result = [];
  for (let i = 0; i < data.length; i += step) {
    result.push(data[i]);
  }
  // Đảm bảo luôn lấy điểm mới nhất
  if (result[result.length - 1] !== data[data.length - 1]) {
    result[result.length - 1] = data[data.length - 1];
  }
  return result;
};

const Charts = () => {
  const [sensorHistory, setSensorHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sensorType, setSensorType] = useState('temperature');
  
  // Chế độ xem: 'latest' (15 điểm gần nhất) hoặc 'hours' (6h, 12h, 24h)
  const [viewMode, setViewMode] = useState('latest');
  const [hoursLimit, setHoursLimit] = useState(6);
  
  const [modalVisible, setModalVisible] = useState(false);

  useEffect(() => {
    setLoading(true);
    let sensorQuery;

    if (viewMode === 'latest') {
      // Mặc định 15 điểm gần nhất
      sensorQuery = query(
        ref(database, 'He_thong_tuoi/sensors/data'),
        orderByKey(),
        limitToLast(15)
      );
    } else {
      // Xem theo giờ (6h, 12h, 24h)
      const currentSeconds = Math.floor(Date.now() / 1000);
      const startSeconds = currentSeconds - (hoursLimit * 60 * 60);

      sensorQuery = query(
        ref(database, 'He_thong_tuoi/sensors/data'),
        orderByKey(),
        startAt(startSeconds.toString())
      );
    }

    const unsubSensor = onValue(sensorQuery, (snapshot) => {
      if (snapshot.exists()) {
        const rawData = [];
        snapshot.forEach((child) => {
          const val = child.val() || {};
          let timeLabel = '';
          if (val.timestamp) {
            timeLabel = val.timestamp.substring(11, 16); // Chỉ lấy HH:mm
          } else {
            const date = new Date(parseInt(child.key) * 1000);
            timeLabel = `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
          }
          
          rawData.push({
            key: child.key,
            time: timeLabel,
            temperature: val.temperature ?? 0,
            humidity_air: val.humidity ?? 0,
            soil_moisture: val.soil_percent ?? 0,
            light: val.light_lux ?? 0,
          });
        });
        
        // Giới hạn hiển thị để biểu đồ không bị rối khi xem 24h
        const sampledData = viewMode === 'hours' ? downsampleData(rawData, 15) : rawData;
        setSensorHistory(sampledData);
      } else {
        setSensorHistory([]);
      }
      setLoading(false);
    });

    return () => unsubSensor();
  }, [viewMode, hoursLimit]);

  const getChartData = () => {
    if (sensorHistory.length === 0) {
      return { labels: [''], datasets: [{ data: [0] }] };
    }
    const labels = sensorHistory.map((item, i) => {
      // Ẩn bớt nhãn để tránh đè chữ
      if (sensorHistory.length > 6 && i % Math.ceil(sensorHistory.length / 4) !== 0 && i !== sensorHistory.length - 1) {
        return '';
      }
      return item.time;
    });
    const values = sensorHistory.map((item) => {
      const v = item[sensorType];
      return typeof v === 'number' ? v : 0;
    });
    return { labels, datasets: [{ data: values }] };
  };

  const handleSelectHours = (hours) => {
    setHoursLimit(hours);
    setViewMode('hours');
    setModalVisible(false);
  };

  const handleSelectLatest = () => {
    setViewMode('latest');
    setModalVisible(false);
  };



  const activeSensor = SENSOR_OPTIONS.find((o) => o.key === sensorType);

  const chartConfig = {
    backgroundColor: colors.surface,
    backgroundGradientFrom: colors.surface,
    backgroundGradientTo: colors.surface,
    decimalPlaces: 1,
    color: (opacity = 1) => `rgba(47, 125, 78, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(85, 107, 94, ${opacity})`,
    style: { borderRadius: radii.lg },
    propsForDots: {
      r: '5',
      strokeWidth: '2',
      stroke: colors.primary,
      fill: colors.white,
    },
    propsForBackgroundLines: {
      strokeDasharray: '4,4',
      stroke: colors.border,
    },
    fillShadowGradientFrom: colors.primary,
    fillShadowGradientTo: 'transparent',
    fillShadowGradientOpacity: 0.12,
  };

  const chartW = screenWidth - spacing.lg * 2 - spacing.lg * 2;

  return (
    <View style={styles.container}>
      <View pointerEvents="none" style={styles.glow1} />
      <View pointerEvents="none" style={styles.glow2} />

      {/* Hero */}
      <View style={styles.hero}>
        <Image
          source={{ uri: 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=1400&q=80' }}
          style={styles.heroImage}
        />
        <View style={styles.heroOverlay}>
          <MaterialCommunityIcons name="chart-line" size={32} color="rgba(255,255,255,0.9)" />
          <Text style={styles.heroTitle}>Biểu đồ</Text>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header chọn thời gian */}
        <View style={styles.timeHeader}>
          <View>
            <Text style={styles.timeHeaderTitle}>Thời gian hiển thị</Text>
            <Text style={styles.timeHeaderSub}>
              {viewMode === 'latest' 
                ? '15 điểm gần nhất' 
                : `${hoursLimit} giờ qua`}
            </Text>
          </View>
          <TouchableOpacity 
            style={styles.moreButton} 
            onPress={() => setModalVisible(true)}
            activeOpacity={0.7}
          >
            <MaterialCommunityIcons name="dots-vertical" size={24} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* Filter Chips */}
        <Text style={styles.sectionLabel}>Chọn cảm biến</Text>
        <View style={styles.chipRow}>
          {SENSOR_OPTIONS.map((option) => {
            const active = sensorType === option.key;
            return (
              <TouchableOpacity
                key={option.key}
                style={[
                  styles.chip,
                  active && { backgroundColor: option.color, borderColor: option.color },
                ]}
                onPress={() => setSensorType(option.key)}
                activeOpacity={0.8}
              >
                <MaterialCommunityIcons
                  name={option.icon}
                  size={15}
                  color={active ? '#fff' : option.color}
                />
                <Text style={[styles.chipText, active && { color: '#fff' }]}>
                  {option.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Chart Card */}
        <Text style={styles.sectionLabel}>Biểu đồ {activeSensor?.label}</Text>
        <View style={styles.chartCard}>
          {loading ? (
             <View style={styles.loadingWrapper}>
               <ActivityIndicator size="large" color={colors.primary} />
               <Text style={styles.loadingText}>Đang lấy dữ liệu...</Text>
             </View>
          ) : sensorHistory.length > 0 ? (
            <>
              <LineChart
                data={getChartData()}
                width={chartW}
                height={220}
                chartConfig={chartConfig}
                bezier
                style={styles.chart}
                withInnerLines={true}
                withOuterLines={false}
                withVerticalLines={false}
                withHorizontalLines={true}
                withDots={true}
                fromZero={false}
              />
              <View style={styles.chartFooter}>
                <Text style={styles.chartFooterText}>
                  Đơn vị: {activeSensor?.unit?.trim()}
                </Text>
                <View style={[styles.chartLegendDot, { backgroundColor: colors.primary }]} />
              </View>
            </>
          ) : (
            <View style={styles.emptyChart}>
              <MaterialCommunityIcons name="chart-line-variant" size={52} color={colors.border} />
              <Text style={styles.emptyTitle}>Chưa có dữ liệu</Text>
              <Text style={styles.emptyDesc}>
                {viewMode === 'latest' 
                  ? 'Chưa có bản ghi nào' 
                  : `Không có dữ liệu trong ${hoursLimit} giờ qua`}
              </Text>
            </View>
          )}
        </View>

        <View style={{ height: spacing.xl }} />
      </ScrollView>

      {/* Modal tùy chọn thời gian */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <KeyboardAvoidingView 
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Tùy chọn thời gian</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <MaterialCommunityIcons name="close" size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.modalOption} onPress={() => handleSelectHours(6)}>
              <MaterialCommunityIcons name="clock-outline" size={20} color={viewMode === 'hours' && hoursLimit === 6 ? colors.primary : colors.textSecondary} />
              <Text style={[styles.modalOptionText, viewMode === 'hours' && hoursLimit === 6 && styles.modalOptionActive]}>
                6 giờ qua
              </Text>
              {viewMode === 'hours' && hoursLimit === 6 && <MaterialCommunityIcons name="check" size={20} color={colors.primary} />}
            </TouchableOpacity>

            <TouchableOpacity style={styles.modalOption} onPress={() => handleSelectHours(12)}>
              <MaterialCommunityIcons name="clock-time-four-outline" size={20} color={viewMode === 'hours' && hoursLimit === 12 ? colors.primary : colors.textSecondary} />
              <Text style={[styles.modalOptionText, viewMode === 'hours' && hoursLimit === 12 && styles.modalOptionActive]}>
                12 giờ qua
              </Text>
              {viewMode === 'hours' && hoursLimit === 12 && <MaterialCommunityIcons name="check" size={20} color={colors.primary} />}
            </TouchableOpacity>

            <TouchableOpacity style={styles.modalOption} onPress={() => handleSelectHours(24)}>
              <MaterialCommunityIcons name="update" size={20} color={viewMode === 'hours' && hoursLimit === 24 ? colors.primary : colors.textSecondary} />
              <Text style={[styles.modalOptionText, viewMode === 'hours' && hoursLimit === 24 && styles.modalOptionActive]}>
                24 giờ qua
              </Text>
              {viewMode === 'hours' && hoursLimit === 24 && <MaterialCommunityIcons name="check" size={20} color={colors.primary} />}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>

    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  glow1: {
    position: 'absolute',
    top: -100,
    right: -100,
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: colors.glowPrimary,
    opacity: 0.55,
  },
  glow2: {
    position: 'absolute',
    bottom: -120,
    left: -100,
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: colors.glowAccent,
    opacity: 0.55,
  },

  // Hero
  hero: {
    height: 190,
    overflow: 'hidden',
    borderBottomLeftRadius: radii.xl,
    borderBottomRightRadius: radii.xl,
  },
  heroImage: { width: '100%', height: '100%' },
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.overlay,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
    gap: spacing.xxs,
  },
  heroTitle: {
    fontSize: 26,
    fontFamily: fonts.bold,
    color: colors.white,
    letterSpacing: -0.3,
    marginTop: spacing.xs,
    textAlign: 'center',
  },

  scroll: { flex: 1 },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
  },

  // Time Header
  timeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.lg,
    ...shadows.lift,
  },
  timeHeaderTitle: {
    fontSize: 14,
    fontFamily: fonts.bold,
    color: colors.textPrimary,
  },
  timeHeaderSub: {
    fontSize: 13,
    fontFamily: fonts.medium,
    color: colors.primary,
    marginTop: 2,
  },
  moreButton: {
    padding: spacing.xs,
    backgroundColor: colors.surfaceMuted,
    borderRadius: radii.sm,
  },

  sectionLabel: {
    fontSize: 13,
    fontFamily: fonts.bold,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: spacing.sm,
    marginTop: spacing.xs,
  },

  // Chips
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginBottom: spacing.lg,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xxs + 2,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radii.pill,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  chipText: {
    fontSize: 13,
    fontFamily: fonts.semibold,
    color: colors.textSecondary,
  },

  // Chart Card
  chartCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.md,
    ...shadows.card,
    overflow: 'hidden',
    minHeight: 250,
  },
  loadingWrapper: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xl,
  },
  loadingText: {
    marginTop: spacing.sm,
    fontSize: 14,
    fontFamily: fonts.medium,
    color: colors.textSecondary,
  },
  chart: {
    borderRadius: radii.md,
    marginLeft: -spacing.md,
  },
  chartFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  chartFooterText: {
    fontSize: 12,
    fontFamily: fonts.medium,
    color: colors.textMuted,
  },
  chartLegendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },

  // Empty
  emptyChart: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xxl,
    gap: spacing.xs,
  },
  emptyTitle: {
    fontSize: 16,
    fontFamily: fonts.semibold,
    color: colors.textSecondary,
    marginTop: spacing.sm,
  },
  emptyDesc: {
    fontSize: 13,
    fontFamily: fonts.regular,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 18,
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radii.xl,
    borderTopRightRadius: radii.xl,
    padding: spacing.xl,
    paddingBottom: Platform.OS === 'ios' ? 40 : spacing.xl,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingBottom: spacing.sm,
  },
  modalTitle: {
    fontSize: 18,
    fontFamily: fonts.bold,
    color: colors.textPrimary,
  },
  modalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.surfaceMuted,
  },
  modalOptionText: {
    flex: 1,
    fontSize: 15,
    fontFamily: fonts.medium,
    color: colors.textPrimary,
    marginLeft: spacing.sm,
  },
  modalOptionActive: {
    color: colors.primary,
    fontFamily: fonts.bold,
  },
  customInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.sm,
    gap: spacing.sm,
  },
  customInput: {
    flex: 1,
    height: 44,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.sm,
    paddingHorizontal: spacing.sm,
    fontSize: 15,
    fontFamily: fonts.medium,
    color: colors.textPrimary,
  },
  customApplyBtn: {
    backgroundColor: colors.primary,
    height: 44,
    paddingHorizontal: spacing.lg,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: radii.sm,
  },
  customApplyText: {
    color: '#fff',
    fontFamily: fonts.bold,
    fontSize: 14,
  },
});

export default Charts;
