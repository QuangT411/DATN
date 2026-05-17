import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, fonts, radii, spacing, shadows } from '../styles/theme';
import { useMqtt } from '../context/MqttContext';

const WaterCard = ({ waterLiters }) => {
  const { pumpStatus } = useMqtt();

  return (
    <View style={styles.container}>
      <View style={styles.topRow}>
        <View style={styles.iconWrap}>
          <MaterialCommunityIcons name="cup-water" size={28} color={colors.accentBlue} />
        </View>
        <View style={styles.textGroup}>
          <Text style={styles.label}>Lượng nước đã tưới</Text>
          <Text style={styles.value}>{waterLiters?.toFixed(2) ?? '0.00'} L</Text>
        </View>
        <View style={[styles.statusBadge, pumpStatus ? styles.statusOn : styles.statusOff]}>
          <View style={[styles.dot, pumpStatus ? styles.dotOn : styles.dotOff]} />
          <Text style={[styles.statusText, pumpStatus ? styles.statusTextOn : styles.statusTextOff]}>
            {pumpStatus ? 'Đang chạy' : 'Đã tắt'}
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.card,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  iconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.accentBlueSoft,
    justifyContent: 'center',
    alignItems: 'center',
  },
  textGroup: {
    flex: 1,
  },
  label: {
    fontSize: 13,
    color: colors.textMuted,
    fontFamily: fonts.medium,
  },
  value: {
    fontSize: 22,
    fontFamily: fonts.bold,
    color: colors.accentBlue,
    marginTop: 1,
    letterSpacing: -0.3,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxs + 2,
    borderRadius: radii.pill,
    gap: spacing.xxs,
  },
  statusOn: {
    backgroundColor: colors.accentBlueSoft,
  },
  statusOff: {
    backgroundColor: colors.surfaceMuted,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  dotOn: {
    backgroundColor: colors.accentBlue,
  },
  dotOff: {
    backgroundColor: colors.textMuted,
  },
  statusText: {
    fontSize: 12,
    fontFamily: fonts.semibold,
  },
  statusTextOn: {
    color: colors.accentBlue,
  },
  statusTextOff: {
    color: colors.textMuted,
  },
});

export default WaterCard;
