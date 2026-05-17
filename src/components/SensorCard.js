import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, fonts, radii, spacing, shadows } from '../styles/theme';

const SensorCard = ({ label, value, icon, color, bgColor, unit }) => {
  return (
    <View style={styles.card}>
      <View style={[styles.iconContainer, { backgroundColor: bgColor || colors.primaryLight }]}>
        <MaterialCommunityIcons name={icon} size={28} color={color} />
      </View>
      <Text style={styles.label} numberOfLines={2}>{label}</Text>
      <Text style={[styles.value, { color }]} numberOfLines={1} adjustsFontSizeToFit>
        {value}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.sm,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    flex: 1,
    minWidth: 0,
    ...shadows.card,
  },
  iconContainer: {
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  label: {
    fontSize: 12,
    color: colors.textMuted,
    fontFamily: fonts.semibold,
    textAlign: 'center',
    letterSpacing: 0.3,
    lineHeight: 16,
    marginBottom: spacing.xxs,
    textTransform: 'uppercase',
  },
  value: {
    fontSize: 19,
    fontFamily: fonts.bold,
    color: colors.textPrimary,
    textAlign: 'center',
    letterSpacing: -0.3,
  },
});

export default SensorCard;
