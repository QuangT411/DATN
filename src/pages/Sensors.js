import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  RefreshControl,
} from 'react-native';
import { ref, onValue, query, limitToLast } from 'firebase/database';
import { database } from '../firebase/firebaseConfig';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { fonts, radii, spacing, shadows } from '../styles/theme';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';

const Sensors = () => {
  const { colors } = useTheme();
  const { userData } = useAuth();
  const deviceId = userData?.nameDevice ?? null;
  const [data, setData] = useState({
    light: 0,
    temperature: 0,
    humidity_air: 0,
    soil_moisture: 0,
  });
  const [refreshing, setRefreshing] = useState(false);

  const SENSORS = useMemo(() => [
    {
      key: 'light',
      label: 'Ánh sáng',
      icon: 'white-balance-sunny',
      color: colors.accentSun,
      bgColor: colors.accentSunSoft,
      format: (v) => `${v?.toFixed(0) ?? '--'} lux`,
      desc: 'Cường độ ánh sáng môi trường',
    },
    {
      key: 'temperature',
      label: 'Nhiệt độ',
      icon: 'thermometer',
      color: colors.accentSun,
      bgColor: colors.accentSunSoft,
      format: (v) => `${v?.toFixed(1) ?? '--'}°C`,
      desc: 'Nhiệt độ không khí xung quanh',
    },
    {
      key: 'humidity_air',
      label: 'Độ ẩm không khí',
      icon: 'water-percent',
      color: colors.accentBlue,
      bgColor: colors.accentBlueSoft,
      format: (v) => `${v?.toFixed(1) ?? '--'}%`,
      desc: 'Độ ẩm tương đối trong không khí',
    },
    {
      key: 'soil_moisture',
      label: 'Độ ẩm đất',
      icon: 'flower',
      color: colors.primary,
      bgColor: colors.primaryLight,
      format: (v) => `${v?.toFixed(0) ?? '--'}%`,
      desc: 'Hàm lượng nước trong đất trồng',
    },
  ], [colors]);

  useEffect(() => {
    if (!deviceId) return;
    const dataRef = query(ref(database, `sensors/${deviceId}/data`), limitToLast(1));
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
      setRefreshing(false);
    });
    return () => unsubscribe();
  }, [deviceId]);

  const onRefresh = () => setRefreshing(true);

  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <View style={styles.container}>
      <View pointerEvents="none" style={styles.glow1} />
      <View pointerEvents="none" style={styles.glow2} />

      {/* Hero */}
      <View style={styles.hero}>
        <Image
          source={require("../../assets/icons/soil-moisture-sensor.png")}
          style={styles.heroImage}
        />
        <View style={styles.heroOverlay}>
          <View style={styles.heroBadge}>
            <View style={styles.liveDot} />
            <Text style={styles.liveBadgeText}>REALTIME</Text>
          </View>
          <Text style={styles.heroTitle}>Cảm biến</Text>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
      >
        {SENSORS.map((sensor) => {
          const val = data[sensor.key];
          return (
            <View key={sensor.key} style={styles.sensorCard}>
              <View style={[styles.iconWrap, { backgroundColor: sensor.bgColor }]}>
                <MaterialCommunityIcons name={sensor.icon} size={30} color={sensor.color} />
              </View>
              <View style={styles.sensorBody}>
                <Text style={styles.sensorLabel}>{sensor.label}</Text>
                <Text style={styles.sensorDesc}>{sensor.desc}</Text>
              </View>
              <Text style={[styles.sensorValue, { color: sensor.color }]}>
                {sensor.format(val)}
              </Text>
            </View>
          );
        })}

        {/* Live badge */}
        <View style={styles.liveRow}>
          <View style={[styles.liveDotSmall, { backgroundColor: colors.accentTeal }]} />
          <Text style={styles.liveText}>Dữ liệu cập nhật tự động</Text>
        </View>

        <View style={{ height: spacing.xl }} />
      </ScrollView>
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
  },
  heroBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xxs,
    marginBottom: spacing.xs,
  },
  liveDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#4ADE80',
  },
  liveBadgeText: {
    fontSize: 11,
    fontFamily: fonts.bold,
    color: '#4ADE80',
    letterSpacing: 1,
  },
  heroTitle: {
    fontSize: 26,
    fontFamily: fonts.bold,
    color: colors.white,
    letterSpacing: -0.3,
    textAlign: 'center',
  },

  // Scroll
  scroll: { flex: 1 },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
  },

  // Sensor Card
  sensorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.md,
    ...shadows.lift,
  },
  iconWrap: {
    width: 58,
    height: 58,
    borderRadius: 29,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  sensorBody: {
    flex: 1,
  },
  sensorLabel: {
    fontSize: 15,
    fontFamily: fonts.semibold,
    color: colors.textPrimary,
  },
  sensorDesc: {
    fontSize: 12,
    fontFamily: fonts.regular,
    color: colors.textMuted,
    marginTop: 2,
    lineHeight: 16,
  },
  sensorValue: {
    fontSize: 20,
    fontFamily: fonts.bold,
    letterSpacing: -0.3,
    textAlign: 'right',
    minWidth: 72,
  },

  // Live row
  liveRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.md,
    gap: spacing.xs,
  },
  liveDotSmall: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  liveText: {
    fontSize: 12,
    fontFamily: fonts.medium,
    color: colors.accentTeal,
  },
});

export default Sensors;
