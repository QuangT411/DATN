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
import { useMqtt } from '../context/MqttContext';

const Home = () => {
  const { colors } = useTheme();
  const { pumpStatus, mode } = useMqtt();
  const { userData } = useAuth();
  const deviceId = userData?.nameDevice ?? null;
  const isAiMode = mode === 'ai';
  const [data, setData] = useState({
    temperature: 0,
    soil_moisture: 0,
    light: 0,
    humidity_air: 0,
    water_liters: 0,
  });
  const [refreshing, setRefreshing] = useState(false);

  const SENSOR_CARDS = useMemo(() => [
    {
      key: 'temperature',
      label: 'Nhiệt độ',
      icon: 'thermometer',
      color: colors.accentSun,
      bgColor: colors.accentSunSoft,
      format: (v) => `${v?.toFixed(1) ?? '--'}°C`,
    },
    {
      key: 'soil_moisture',
      label: 'Độ ẩm đất',
      icon: 'flower',
      color: colors.primary,
      bgColor: colors.primaryLight,
      format: (v) => `${v?.toFixed(0) ?? '--'}%`,
    },
    {
      key: 'light',
      label: 'Ánh sáng',
      icon: 'white-balance-sunny',
      color: colors.accentSun,
      bgColor: colors.accentSunSoft,
      format: (v) => `${v?.toFixed(0) ?? '--'} lx`,
    },
    {
      key: 'humidity_air',
      label: 'Độ ẩm KK',
      icon: 'water-percent',
      color: colors.accentBlue,
      bgColor: colors.accentBlueSoft,
      format: (v) => `${v?.toFixed(1) ?? '--'}%`,
    },
  ], [colors]);

  useEffect(() => {
    if (!deviceId) return;
    const sensorRef = query(ref(database, `He_thong_tuoi/sensor/${deviceId}/data`), limitToLast(1));
    const unsubSensor = onValue(sensorRef, (snapshot) => {
      if (snapshot.exists()) {
        let latest = {};
        snapshot.forEach((child) => {
          latest = child.val() || {};
        });
        setData((prev) => ({
          ...prev,
          temperature: latest.temperature ?? 0,
          soil_moisture: latest.soil_percent ?? 0,
          light: latest.light_lux ?? 0,
          humidity_air: latest.humidity ?? 0,
          water_liters: latest.total_volume_L ?? 0,
        }));
      }
      setRefreshing(false);
    });
    return () => { unsubSensor(); };
  }, [deviceId]);

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  };

  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <View style={styles.container}>
      {/* Background glows */}
      <View pointerEvents="none" style={styles.glow1} />
      <View pointerEvents="none" style={styles.glow2} />

      {/* Hero Banner */}
      <View style={styles.hero}>
        <Image
          source={require("../../assets/icons/home.png")}
          style={styles.heroImage}
        />
        <View style={styles.heroOverlay}>
          <View style={styles.heroBadge}>
            <View style={styles.liveDot} />
            <Text style={styles.liveBadgeText}>LIVE</Text>
          </View>
          <Text style={styles.heroTitle}>Hệ thống tưới thông minh</Text>
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
        {/* Status Cards */}
        <Text style={styles.sectionLabel}>Trạng thái hệ thống</Text>
        <View style={styles.statusRow}>
          <View style={[styles.statusCard, isAiMode ? styles.statusCardOn : styles.statusCardOff]}>
            <MaterialCommunityIcons
              name="autorenew"
              size={26}
              color={isAiMode ? colors.white : colors.textMuted}
            />
            <Text style={[styles.statusCardTitle, isAiMode && { color: colors.white }]}>
              Auto Mode
            </Text>
            <View style={[styles.pill, isAiMode ? styles.pillOn : styles.pillOff]}>
              <Text style={[styles.pillText, isAiMode ? styles.pillTextOn : styles.pillTextOff]}>
                {isAiMode ? 'BẬT' : 'TẮT'}
              </Text>
            </View>
          </View>

          <View style={[styles.statusCard, pumpStatus === null ? styles.statusCardOff : pumpStatus ? styles.statusCardBlue : styles.statusCardOff]}>
            <MaterialCommunityIcons
              name={pumpStatus ? 'water-pump' : 'water-pump-off'}
              size={26}
              color={pumpStatus === null ? colors.textMuted : pumpStatus ? colors.white : colors.textMuted}
            />
            <Text style={[styles.statusCardTitle, pumpStatus && { color: colors.white }]}>
              Máy bơm
            </Text>
            <View style={[styles.pill, pumpStatus === null ? styles.pillOff : pumpStatus ? styles.pillBlue : styles.pillOff]}>
              <Text style={[styles.pillText, pumpStatus === null ? styles.pillTextOff : pumpStatus ? styles.pillTextBlue : styles.pillTextOff]}>
                {pumpStatus === null ? 'Đang chờ...' : pumpStatus ? 'CHẠY' : 'TẮT'}
              </Text>
            </View>
          </View>
        </View>

        {/* Sensor Grid */}
        <Text style={styles.sectionLabel}>Cảm biến </Text>
        <View style={styles.sensorGrid}>
          {SENSOR_CARDS.map((s) => (
            <View key={s.key} style={styles.sensorCard}>
              <View style={[styles.sensorIcon, { backgroundColor: s.bgColor }]}>
                <MaterialCommunityIcons name={s.icon} size={24} color={s.color} />
              </View>
              <Text style={styles.sensorLabel}>{s.label}</Text>
              <Text style={[styles.sensorValue, { color: s.color }]}>
                {s.format(data[s.key])}
              </Text>
            </View>
          ))}
        </View>

        {/* Water Card */}
        <Text style={styles.sectionLabel}>Lượng nước</Text>
        <View style={styles.waterCard}>
          <View style={styles.waterLeft}>
            <View style={styles.waterIconWrap}>
              <MaterialCommunityIcons name="cup-water" size={26} color={colors.accentBlue} />
            </View>
            <View>
              <Text style={styles.waterLabel}>Đã tưới </Text>
              <Text style={styles.waterValue}>
                {data.water_liters?.toFixed(2) ?? '0.00'} L
              </Text>
            </View>
          </View>
          <View style={[styles.waterBadge, pumpStatus === null ? styles.waterBadgeOff : pumpStatus ? styles.waterBadgeOn : styles.waterBadgeOff]}>
            <View style={[styles.waterDot, { backgroundColor: pumpStatus === null ? colors.textMuted : pumpStatus ? colors.accentBlue : colors.textMuted }]} />
            <Text style={[styles.waterBadgeText, { color: pumpStatus === null ? colors.textMuted : pumpStatus ? colors.accentBlue : colors.textMuted }]}>
              {pumpStatus === null ? 'Đang chờ...' : pumpStatus ? 'Đang tưới' : 'Đã tắt'}
            </Text>
          </View>
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
    opacity: 0.6,
  },
  glow2: {
    position: 'absolute',
    bottom: -120,
    left: -100,
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: colors.glowAccent,
    opacity: 0.6,
  },

  // Hero
  hero: {
    height: 220,
    overflow: 'hidden',
    borderBottomLeftRadius: radii.xl,
    borderBottomRightRadius: radii.xl,
    backgroundColor: '#0D1A12',
  },
  heroImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'contain',
  },
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
    lineHeight: 32,
    letterSpacing: -0.3,
    textAlign: 'center',
  },

  // Scroll
  scroll: { flex: 1 },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
  },

  // Section Label
  sectionLabel: {
    fontSize: 13,
    fontFamily: fonts.bold,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: spacing.sm,
    marginTop: spacing.xs,
    textAlign: 'center',
    alignSelf: 'stretch',
  },

  // Status Cards
  statusRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  statusCard: {
    flex: 1,
    borderRadius: radii.lg,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    gap: spacing.xs,
    ...shadows.lift,
  },
  statusCardOff: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
  },
  statusCardOn: {
    backgroundColor: colors.primary,
    borderColor: colors.primaryDark,
  },
  statusCardBlue: {
    backgroundColor: colors.accentBlue,
    borderColor: '#155d8a',
  },
  statusCardTitle: {
    fontSize: 13,
    fontFamily: fonts.semibold,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  pill: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radii.pill,
  },
  pillOn: { backgroundColor: 'rgba(255,255,255,0.25)' },
  pillBlue: { backgroundColor: 'rgba(255,255,255,0.25)' },
  pillOff: { backgroundColor: colors.surfaceMuted },
  pillText: {
    fontSize: 11,
    fontFamily: fonts.bold,
    letterSpacing: 0.5,
  },
  pillTextOn: { color: colors.white },
  pillTextBlue: { color: colors.white },
  pillTextOff: { color: colors.textMuted },

  // Sensor Grid
  sensorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: spacing.lg,
  },
  sensorCard: {
    width: '48%',
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.sm,
    ...shadows.lift,
  },
  sensorIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  sensorLabel: {
    fontSize: 11,
    fontFamily: fonts.semibold,
    color: colors.textMuted,
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginBottom: 3,
  },
  sensorValue: {
    fontSize: 20,
    fontFamily: fonts.bold,
    textAlign: 'center',
    letterSpacing: -0.3,
  },

  // Water Card
  waterCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.md,
    ...shadows.lift,
  },
  waterLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  waterIconWrap: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: colors.accentBlueSoft,
    justifyContent: 'center',
    alignItems: 'center',
  },
  waterLabel: {
    fontSize: 12,
    fontFamily: fonts.medium,
    color: colors.textMuted,
  },
  waterValue: {
    fontSize: 20,
    fontFamily: fonts.bold,
    color: colors.accentBlue,
    letterSpacing: -0.3,
  },
  waterBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxs + 2,
    borderRadius: radii.pill,
  },
  waterBadgeOn: { backgroundColor: colors.accentBlueSoft },
  waterBadgeOff: { backgroundColor: colors.surfaceMuted },
  waterDot: { width: 6, height: 6, borderRadius: 3 },
  waterBadgeText: { fontSize: 12, fontFamily: fonts.semibold },
});

export default Home;
