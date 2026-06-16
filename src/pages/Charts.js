import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  Image,
  Modal,
  KeyboardAvoidingView,
  Platform,
  useWindowDimensions,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { ref, onValue, query, orderByKey, startAt, endAt } from 'firebase/database';
import { database } from '../firebase/firebaseConfig';
import { LineChart } from 'react-native-chart-kit';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { fonts, radii, spacing, shadows } from '../styles/theme';
import { useTheme } from '../context/ThemeContext';

const downsampleData = (data, maxPoints = 15) => {
  if (data.length <= maxPoints) return data;
  const step = Math.ceil(data.length / maxPoints);
  const result = [];
  for (let i = 0; i < data.length; i += step) {
    result.push(data[i]);
  }
  if (result[result.length - 1] !== data[data.length - 1]) {
    result[result.length - 1] = data[data.length - 1];
  }
  return result;
};

const Charts = () => {
  const { colors } = useTheme();
  const { width: windowWidth } = useWindowDimensions();
  const [sensorHistory, setSensorHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sensorType, setSensorType] = useState('temperature');

  // Time selection state
  const [viewMode, setViewMode] = useState('recent'); // 'recent' | 'date'
  const [hoursLimit, setHoursLimit] = useState(1);
  const [selectedDate, setSelectedDate] = useState(new Date());

  // Modal / Picker state
  const [modalVisible, setModalVisible] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [pendingDate, setPendingDate] = useState(new Date());

  const SENSOR_OPTIONS = useMemo(() => [
    { key: 'temperature', label: 'Nhiệt độ', icon: 'thermometer', color: colors.accentSun, unit: '°C' },
    { key: 'humidity_air', label: 'Độ ẩm KK', icon: 'water-percent', color: colors.accentBlue, unit: '%' },
    { key: 'soil_moisture', label: 'Độ ẩm đất', icon: 'flower', color: colors.primary, unit: '%' },
    { key: 'light', label: 'Ánh sáng', icon: 'white-balance-sunny', color: colors.accentSun, unit: ' lux' },
  ], [colors]);

  useEffect(() => {
    setLoading(true);
    let sensorQuery;

    if (viewMode === 'date') {
      // Lấy dữ liệu cho ngày đã chọn (00:00:00 → 23:59:59)
      const startOfDay = new Date(selectedDate);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(selectedDate);
      endOfDay.setHours(23, 59, 59, 999);

      const startSec = Math.floor(startOfDay.getTime() / 1000);
      const endSec = Math.floor(endOfDay.getTime() / 1000);

      sensorQuery = query(
        ref(database, 'He_thong_tuoi/sensors/data'),
        orderByKey(),
        startAt(startSec.toString()),
        endAt(endSec.toString())
      );
    } else {
      // Chế độ xem gần đây
      const currentSeconds = Math.floor(Date.now() / 1000);
      const startSeconds = currentSeconds - hoursLimit * 60 * 60;
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
            timeLabel = val.timestamp.substring(11, 16);
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
        const sampledData = downsampleData(rawData, 15);
        setSensorHistory(sampledData);
      } else {
        setSensorHistory([]);
      }
      setLoading(false);
    });

    return () => unsubSensor();
  }, [hoursLimit, viewMode, selectedDate]);

  const getChartData = () => {
    if (sensorHistory.length === 0) {
      return { labels: [''], datasets: [{ data: [0] }] };
    }
    const labels = sensorHistory.map((item, i) => {
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
    setViewMode('recent');
    setHoursLimit(hours);
    setModalVisible(false);
    setShowDatePicker(false);
  };

  const handleOpenDatePicker = () => {
    setPendingDate(selectedDate);
    setShowDatePicker(true);
  };

  const handleDateChange = (event, date) => {
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
      if (event.type === 'set' && date) {
        setSelectedDate(date);
        setViewMode('date');
        setModalVisible(false);
      }
    } else {
      if (date) setPendingDate(date);
    }
  };

  const handleConfirmDate = () => {
    setSelectedDate(pendingDate);
    setViewMode('date');
    setShowDatePicker(false);
    setModalVisible(false);
  };

  const handleCancelDate = () => {
    setShowDatePicker(false);
  };

  const formatDateVN = (date) => {
    const d = date.getDate().toString().padStart(2, '0');
    const m = (date.getMonth() + 1).toString().padStart(2, '0');
    const y = date.getFullYear();
    return `${d}/${m}/${y}`;
  };

  const isToday = (date) => {
    const today = new Date();
    return date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear();
  };

  const getTimeLabel = () => {
    if (viewMode === 'date') {
      return isToday(selectedDate) ? `Hôm nay (${formatDateVN(selectedDate)})` : formatDateVN(selectedDate);
    }
    if (hoursLimit === 1) return '1 giờ qua';
    return `${hoursLimit} giờ qua`;
  };

  const activeSensor = SENSOR_OPTIONS.find((o) => o.key === sensorType);
  const styles = useMemo(() => createStyles(colors), [colors]);

  const chartConfig = useMemo(() => ({
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
      fill: colors.surface,
    },
    propsForBackgroundLines: {
      strokeDasharray: '4,4',
      stroke: colors.border,
    },
    fillShadowGradientFrom: colors.primary,
    fillShadowGradientTo: 'transparent',
    fillShadowGradientOpacity: 0.12,
  }), [colors]);

  const chartW = useMemo(() => {
    const appWidth = Platform.OS === 'web' ? Math.min(windowWidth, 480) : windowWidth;
    return appWidth - spacing.lg * 4;
  }, [windowWidth]);

  return (
    <View style={styles.container}>
      <View pointerEvents="none" style={styles.glow1} />
      <View pointerEvents="none" style={styles.glow2} />

      {/* Hero */}
      <View style={styles.hero}>
        <Image
          source={require("../../assets/icons/growth.png")}
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
          <View style={{ flex: 1 }}>
            <Text style={styles.timeHeaderTitle}>Thời gian hiển thị</Text>
            <View style={styles.timeLabelRow}>
              {viewMode === 'date' && (
                <MaterialCommunityIcons name="calendar-check" size={14} color={colors.primary} style={{ marginRight: 4 }} />
              )}
              <Text style={styles.timeHeaderSub}>{getTimeLabel()}</Text>
            </View>
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
                {`Không có dữ liệu trong ${getTimeLabel()}`}
              </Text>
            </View>
          )}
        </View>

        <View style={{ height: spacing.xl }} />
      </ScrollView>

      {/* Modal tùy chọn thời gian */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => { setModalVisible(false); setShowDatePicker(false); }}
      >
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            activeOpacity={1}
            onPress={() => { setModalVisible(false); setShowDatePicker(false); }}
          />
          <View style={styles.modalContent}>
            <View style={styles.modalHandle} />
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Tùy chọn thời gian</Text>
              <TouchableOpacity onPress={() => { setModalVisible(false); setShowDatePicker(false); }}>
                <MaterialCommunityIcons name="close" size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            {/* --- Khoảng gần đây --- */}
            <Text style={styles.modalSectionLabel}>Khoảng gần đây</Text>

            {[
              { hours: 1, label: '1 giờ qua', icon: 'clock-fast' },
              { hours: 6, label: '6 giờ qua', icon: 'clock-outline' },
              { hours: 12, label: '12 giờ qua', icon: 'clock-time-four-outline' },
            ].map(({ hours, label, icon }) => {
              const isActive = viewMode === 'recent' && hoursLimit === hours;
              return (
                <TouchableOpacity
                  key={hours}
                  style={styles.modalOption}
                  onPress={() => handleSelectHours(hours)}
                >
                  <MaterialCommunityIcons
                    name={icon}
                    size={20}
                    color={isActive ? colors.primary : colors.textSecondary}
                  />
                  <Text style={[styles.modalOptionText, isActive && styles.modalOptionActive]}>
                    {label}
                  </Text>
                  {isActive && <MaterialCommunityIcons name="check" size={20} color={colors.primary} />}
                </TouchableOpacity>
              );
            })}

            {/* --- Chọn ngày cụ thể --- */}
            <Text style={[styles.modalSectionLabel, { marginTop: spacing.md }]}>Chọn ngày cụ thể</Text>

            <TouchableOpacity
              style={[
                styles.datePickerButton,
                viewMode === 'date' && { borderColor: colors.primary, backgroundColor: colors.primaryLight },
              ]}
              onPress={handleOpenDatePicker}
              activeOpacity={0.8}
            >
              <MaterialCommunityIcons
                name="calendar-search"
                size={22}
                color={viewMode === 'date' ? colors.primary : colors.textSecondary}
              />
              <View style={{ flex: 1, marginLeft: spacing.sm }}>
                <Text style={[
                  styles.datePickerButtonLabel,
                  viewMode === 'date' && { color: colors.primary },
                ]}>
                  {viewMode === 'date' ? formatDateVN(selectedDate) : 'Chọn ngày...'}
                </Text>
                <Text style={styles.datePickerButtonSub}>
                  Xem dữ liệu trong một ngày bất kỳ
                </Text>
              </View>
              <MaterialCommunityIcons
                name="chevron-right"
                size={20}
                color={viewMode === 'date' ? colors.primary : colors.textMuted}
              />
            </TouchableOpacity>

            {/* DateTimePicker (inline cho iOS, native dialog cho Android) */}
            {showDatePicker && (
              <View style={styles.datePickerWrapper}>
                <DateTimePicker
                  value={pendingDate}
                  mode="date"
                  display={Platform.OS === 'ios' ? 'inline' : 'default'}
                  maximumDate={new Date()}
                  onChange={handleDateChange}
                  locale="vi-VN"
                  accentColor={colors.primary}
                  themeVariant="light"
                  style={{ alignSelf: 'center' }}
                />
                {Platform.OS === 'ios' && (
                  <View style={styles.datePickerActions}>
                    <TouchableOpacity style={styles.dateActionCancel} onPress={handleCancelDate}>
                      <Text style={styles.dateActionCancelText}>Huỷ</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.dateActionConfirm, { backgroundColor: colors.primary }]} onPress={handleConfirmDate}>
                      <Text style={styles.dateActionConfirmText}>Xác nhận</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            )}
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
};

const createStyles = (colors) => StyleSheet.create({
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
    height: 220,
    overflow: 'hidden',
    borderBottomLeftRadius: radii.xl,
    borderBottomRightRadius: radii.xl,
    backgroundColor: '#0D1A12',
  },
  heroImage: { width: '100%', height: '100%', resizeMode: 'contain' },
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
  timeLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
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
  modalHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
    alignSelf: 'center',
    marginBottom: spacing.sm,
  },
  modalContent: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radii.xl,
    borderTopRightRadius: radii.xl,
    padding: spacing.xl,
    paddingTop: spacing.md,
    paddingBottom: Platform.OS === 'ios' ? 40 : spacing.xl,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingBottom: spacing.sm,
  },
  modalTitle: {
    fontSize: 18,
    fontFamily: fonts.bold,
    color: colors.textPrimary,
  },
  modalSectionLabel: {
    fontSize: 11,
    fontFamily: fonts.bold,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: spacing.xs,
  },
  modalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm + 2,
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

  // Date Picker Button
  datePickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radii.lg,
    padding: spacing.md,
    backgroundColor: colors.surfaceMuted,
    marginBottom: spacing.sm,
  },
  datePickerButtonLabel: {
    fontSize: 15,
    fontFamily: fonts.semibold,
    color: colors.textPrimary,
  },
  datePickerButtonSub: {
    fontSize: 12,
    fontFamily: fonts.regular,
    color: colors.textMuted,
    marginTop: 2,
  },

  // Date Picker Wrapper
  datePickerWrapper: {
    marginTop: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.lg,
    overflow: 'hidden',
    backgroundColor: colors.surfaceMuted,
    padding: spacing.sm,
  },
  datePickerActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.sm,
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  dateActionCancel: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xs + 2,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.border,
  },
  dateActionCancelText: {
    fontSize: 14,
    fontFamily: fonts.medium,
    color: colors.textSecondary,
  },
  dateActionConfirm: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xs + 2,
    borderRadius: radii.pill,
  },
  dateActionConfirmText: {
    fontSize: 14,
    fontFamily: fonts.bold,
    color: '#fff',
  },
});

export default Charts;
