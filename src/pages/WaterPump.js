import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { ref, onValue, query, limitToLast } from 'firebase/database';
import { database } from '../firebase/firebaseConfig';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { fonts, radii, spacing, shadows } from '../styles/theme';
import { useTheme } from '../context/ThemeContext';
import { useMqtt } from '../context/MqttContext';
import { useAuth } from '../context/AuthContext';
import { TOPICS } from '../mqtt/mqttConfig';

const WaterPump = () => {
  const { colors } = useTheme();
  const { publish, controlPump, mode, setMode, connected } = useMqtt();
  const { userData } = useAuth();

  const [data, setData] = useState({
    water_liters: 0,
    pump_status: false,
    auto_mode: false,
  });
  const [loading, setLoading] = useState(true);
  const [manualTime, setManualTime] = useState('10');
  const [controlLoading, setControlLoading] = useState(false);

  useEffect(() => {
    const currentRef = ref(database, 'current');
    const unsubscribe = onValue(currentRef, (snapshot) => {
      if (snapshot.exists()) {
        const val = snapshot.val();
        setData((prev) => ({
          ...prev,
          pump_status: val.pump_status || false,
          auto_mode: val.auto_mode || false,
        }));
      }
      setLoading(false);
    });

    const sensorRef = query(ref(database, 'He_thong_tuoi/sensors/data'), limitToLast(1));
    const unsubSensor = onValue(sensorRef, (snapshot) => {
      if (snapshot.exists()) {
        let latest = {};
        snapshot.forEach((child) => { latest = child.val() || {}; });
        setData((prev) => ({
          ...prev,
          water_liters: latest.total_volume_L ?? 0,
        }));
      }
    });

    return () => { unsubscribe(); unsubSensor(); };
  }, []);

  const handleSetMode = (newMode) => {
    if (!connected) {
      Alert.alert('Mất kết nối', 'Không thể gửi lệnh, vui lòng kiểm tra kết nối MQTT');
      return;
    }
    const ok = setMode(newMode);
    if (ok) {
      Alert.alert(
        newMode === 'ai' ? '🤖 Chế độ AI' : '🖐 Chế độ Thủ công',
        newMode === 'ai'
          ? 'AI Server sẽ tự động điều khiển bơm'
          : 'Bạn có thể điều khiển bơm thủ công'
      );
    }
  };

  const handlePumpOn = async () => {
    if (!connected) {
      Alert.alert('Mất kết nối', 'Không thể gửi lệnh, vui lòng kiểm tra kết nối MQTT');
      return;
    }
    setControlLoading(true);
    try {
      const time = parseInt(manualTime) || 10;
      const ok = controlPump(true, time);
      if (ok) Alert.alert('Bật bơm', `Máy bơm đã bật. Thời gian: ${time} giây`);
    } catch (error) {
      Alert.alert('Lỗi', 'Không thể bật bơm: ' + error.message);
    } finally {
      setControlLoading(false);
    }
  };

  const handlePumpOff = async () => {
    if (!connected) {
      Alert.alert('Mất kết nối', 'Không thể gửi lệnh, vui lòng kiểm tra kết nối MQTT');
      return;
    }
    setControlLoading(true);
    try {
      const ok = controlPump(false);
      if (ok) Alert.alert('Tắt bơm', 'Máy bơm đã tắt');
    } catch (error) {
      Alert.alert('Lỗi', 'Không thể tắt bơm: ' + error.message);
    } finally {
      setControlLoading(false);
    }
  };

  const styles = useMemo(() => createStyles(colors), [colors]);

  if (!userData?.role) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.accentBlue} />
        <Text style={styles.loadingText}>Đang kiểm tra quyền...</Text>
      </View>
    );
  }

  if (userData.role !== 'admin') {
    return (
      <View style={styles.restrictedContainer}>
        <View style={styles.restrictedCard}>
          <MaterialCommunityIcons name="shield-lock" size={42} color={colors.danger} />
          <Text style={styles.restrictedTitle}>Không có quyền truy cập</Text>
          <Text style={styles.restrictedText}>
            Tài khoản của bạn không được phép điều khiển máy bơm.
          </Text>
        </View>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.accentBlue} />
        <Text style={styles.loadingText}>Đang tải...</Text>
      </View>
    );
  }

  const isManual = mode === 'manual';

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View pointerEvents="none" style={styles.glow1} />
      <View pointerEvents="none" style={styles.glow2} />

      {/* Hero */}
      <View style={styles.hero}>
        <Image
          source={{ uri: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1400&q=80' }}
          style={styles.heroImage}
        />
        <View style={styles.heroOverlay}>
          <MaterialCommunityIcons name="water-pump" size={32} color="rgba(255,255,255,0.9)" />
          <Text style={styles.heroTitle}>Điều khiển bơm</Text>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Trạng thái kết nối MQTT */}
        <View style={[styles.mqttBadge, connected ? styles.mqttOn : styles.mqttOff]}>
          <View style={[styles.mqttDot, { backgroundColor: connected ? '#4ADE80' : colors.danger }]} />
          <Text style={[styles.mqttText, { color: connected ? '#4ADE80' : colors.danger }]}>
            MQTT {connected ? 'Đã kết nối' : 'Mất kết nối'}
          </Text>
        </View>

        {/* Water + Status Row */}
        <View style={styles.topRow}>
          <View style={[styles.topCard, { flex: 1.2 }]}>
            <View style={styles.topCardIcon}>
              <MaterialCommunityIcons name="cup-water" size={22} color={colors.accentBlue} />
            </View>
            <Text style={styles.topCardLabel}>Đã tưới</Text>
            <Text style={styles.topCardValue}>{data.water_liters?.toFixed(2) ?? '0.00'} L</Text>
          </View>

          <View style={[styles.topCard, { flex: 1 }]}>
            <View style={[styles.topCardIcon, { backgroundColor: data.pump_status ? colors.accentBlueSoft : colors.surfaceMuted }]}>
              <MaterialCommunityIcons
                name={data.pump_status ? 'water-pump' : 'water-pump-off'}
                size={22}
                color={data.pump_status ? colors.accentBlue : colors.textMuted}
              />
            </View>
            <Text style={styles.topCardLabel}>Máy bơm</Text>
            <View style={[styles.statusPill, data.pump_status ? styles.pillOn : styles.pillOff]}>
              <View style={[styles.pillDot, { backgroundColor: data.pump_status ? colors.accentBlue : colors.textMuted }]} />
              <Text style={[styles.pillText, { color: data.pump_status ? colors.accentBlue : colors.textMuted }]}>
                {data.pump_status ? 'CHẠY' : 'TẮT'}
              </Text>
            </View>
          </View>
        </View>

        {/* Chọn chế độ */}
        <Text style={styles.sectionLabel}>Chế độ hoạt động</Text>
        <View style={styles.modeRow}>
          <TouchableOpacity
            style={[styles.modeBtn, isManual && styles.modeBtnActive]}
            onPress={() => handleSetMode('manual')}
            activeOpacity={0.8}
          >
            <MaterialCommunityIcons
              name="hand-back-right"
              size={20}
              color={isManual ? colors.white : colors.textMuted}
            />
            <Text style={[styles.modeBtnText, isManual && styles.modeBtnTextActive]}>
              Thủ công
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.modeBtn, !isManual && styles.modeBtnAi]}
            onPress={() => handleSetMode('ai')}
            activeOpacity={0.8}
          >
            <MaterialCommunityIcons
              name="robot"
              size={20}
              color={!isManual ? colors.white : colors.textMuted}
            />
            <Text style={[styles.modeBtnText, !isManual && styles.modeBtnTextActive]}>
              AI
            </Text>
          </TouchableOpacity>
        </View>

        {/* Nội dung theo chế độ */}
        {isManual ? (
          <>
            <Text style={styles.sectionLabel}>Điều khiển thủ công</Text>
            <View style={styles.card}>
              <View style={styles.timeRow}>
                <MaterialCommunityIcons name="timer-outline" size={18} color={colors.textSecondary} />
                <Text style={styles.timeLabel}>Thời gian tưới</Text>
                <View style={styles.timeInputWrap}>
                  <TextInput
                    style={styles.timeInput}
                    value={manualTime}
                    onChangeText={setManualTime}
                    keyboardType="number-pad"
                    placeholder="10"
                    placeholderTextColor={colors.textMuted}
                  />
                  <Text style={styles.timeUnit}>giây</Text>
                </View>
              </View>

              <View style={styles.divider} />

              <View style={styles.buttonRow}>
                <TouchableOpacity
                  style={[styles.btn, styles.btnOn, controlLoading && styles.btnDisabled]}
                  onPress={handlePumpOn}
                  disabled={controlLoading}
                  activeOpacity={0.8}
                >
                  {controlLoading ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <>
                      <MaterialCommunityIcons name="water-pump" size={18} color="#fff" />
                      <Text style={styles.btnText}>Bật bơm</Text>
                    </>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.btn, styles.btnOff, controlLoading && styles.btnDisabled]}
                  onPress={handlePumpOff}
                  disabled={controlLoading}
                  activeOpacity={0.8}
                >
                  {controlLoading ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <>
                      <MaterialCommunityIcons name="water-pump-off" size={18} color="#fff" />
                      <Text style={styles.btnText}>Tắt bơm</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </>
        ) : (
          <>
            <Text style={styles.sectionLabel}>Chế độ AI</Text>
            <View style={styles.aiCard}>
              <View style={styles.aiIconWrap}>
                <MaterialCommunityIcons name="robot" size={42} color={colors.primary} />
              </View>
              <Text style={styles.aiTitle}>AI đang kiểm soát</Text>
              <Text style={styles.aiDesc}>
                AI Server sẽ tự phân tích dữ liệu cảm biến và tự động điều khiển bơm.
                Bạn không cần làm gì thêm.
              </Text>
              <View style={styles.aiActiveBadge}>
                <View style={styles.aiDot} />
                <Text style={styles.aiActiveText}>Đang hoạt động</Text>
              </View>
            </View>
          </>
        )}

        <View style={{ height: spacing.xl }} />
      </ScrollView>
    </KeyboardAvoidingView>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
    gap: spacing.sm,
  },
  loadingText: {
    fontSize: 15,
    fontFamily: fonts.medium,
    color: colors.textSecondary,
  },
  restrictedContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
    padding: spacing.lg,
  },
  restrictedCard: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: spacing.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.xs,
    ...shadows.lift,
  },
  restrictedTitle: {
    fontSize: 18,
    fontFamily: fonts.bold,
    color: colors.textPrimary,
    textAlign: 'center',
  },
  restrictedText: {
    fontSize: 13,
    fontFamily: fonts.medium,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
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

  // MQTT Badge
  mqttBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    gap: spacing.xxs + 2,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxs + 2,
    borderRadius: radii.pill,
    marginBottom: spacing.md,
  },
  mqttOn: { backgroundColor: 'rgba(74,222,128,0.12)' },
  mqttOff: { backgroundColor: 'rgba(239,68,68,0.12)' },
  mqttDot: { width: 7, height: 7, borderRadius: 3.5 },
  mqttText: { fontSize: 12, fontFamily: fonts.semibold, letterSpacing: 0.3 },

  // Top Row
  topRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  topCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.xxs,
    ...shadows.lift,
  },
  topCardIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.accentBlueSoft,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.xxs,
  },
  topCardLabel: {
    fontSize: 12,
    fontFamily: fonts.medium,
    color: colors.textMuted,
  },
  topCardValue: {
    fontSize: 20,
    fontFamily: fonts.bold,
    color: colors.accentBlue,
    letterSpacing: -0.3,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radii.pill,
    marginTop: spacing.xxs,
  },
  pillOn: { backgroundColor: colors.accentBlueSoft },
  pillOff: { backgroundColor: colors.surfaceMuted },
  pillDot: { width: 6, height: 6, borderRadius: 3 },
  pillText: { fontSize: 11, fontFamily: fonts.bold, letterSpacing: 0.3 },

  // Mode Selector
  modeRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  modeBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    height: 48,
    borderRadius: radii.md,
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  modeBtnActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primaryDark,
  },
  modeBtnAi: {
    backgroundColor: '#7C3AED',
    borderColor: '#5B21B6',
  },
  modeBtnText: {
    fontSize: 14,
    fontFamily: fonts.semibold,
    color: colors.textMuted,
  },
  modeBtnTextActive: {
    color: colors.white,
  },

  // Card (thủ công)
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.md,
    ...shadows.lift,
  },

  // Time Row
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.md,
  },
  timeLabel: {
    flex: 1,
    fontSize: 14,
    fontFamily: fonts.medium,
    color: colors.textSecondary,
  },
  timeInputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceMuted,
    borderRadius: radii.sm,
    paddingHorizontal: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.xxs,
  },
  timeInput: {
    width: 52,
    height: 40,
    textAlign: 'center',
    fontSize: 16,
    fontFamily: fonts.bold,
    color: colors.textPrimary,
  },
  timeUnit: {
    fontSize: 13,
    fontFamily: fonts.medium,
    color: colors.textMuted,
  },

  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginBottom: spacing.md,
  },

  // Buttons
  buttonRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  btn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.md,
    height: 48,
    gap: spacing.xs,
  },
  btnOn: { backgroundColor: colors.primary },
  btnOff: { backgroundColor: colors.danger },
  btnDisabled: { opacity: 0.5 },
  btnText: {
    color: '#fff',
    fontSize: 14,
    fontFamily: fonts.semibold,
    letterSpacing: 0.1,
  },

  // AI Card
  aiCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: spacing.xl,
    borderWidth: 1,
    borderColor: '#7C3AED30',
    alignItems: 'center',
    marginBottom: spacing.md,
    gap: spacing.sm,
    ...shadows.lift,
  },
  aiIconWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  aiTitle: {
    fontSize: 18,
    fontFamily: fonts.bold,
    color: colors.textPrimary,
    textAlign: 'center',
  },
  aiDesc: {
    fontSize: 13,
    fontFamily: fonts.regular,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  aiActiveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xxs + 2,
    backgroundColor: 'rgba(124,58,237,0.1)',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxs + 2,
    borderRadius: radii.pill,
    marginTop: spacing.xs,
  },
  aiDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#7C3AED',
  },
  aiActiveText: {
    fontSize: 12,
    fontFamily: fonts.semibold,
    color: '#7C3AED',
  },
});

export default WaterPump;
