import React from 'react';
import { View, Text, StyleSheet, Switch, TouchableOpacity, ActivityIndicator } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, fonts, radii, spacing, shadows } from '../styles/theme';

const PumpControl = ({ autoMode, onToggleAuto, onPumpOn, onPumpOff, pumpOn, loading }) => {
  return (
    <View style={styles.container}>
      {/* Auto Mode Row */}
      <View style={styles.autoRow}>
        <View style={styles.autoIconWrap}>
          <MaterialCommunityIcons name="autorenew" size={20} color={colors.primary} />
        </View>
        <View style={styles.autoTextGroup}>
          <Text style={styles.autoLabel}>Chế độ tự động</Text>
          <Text style={styles.autoDesc}>
            {autoMode ? 'Tưới theo cảm biến đất' : 'Điều khiển thủ công'}
          </Text>
        </View>
        <Switch
          value={autoMode}
          onValueChange={onToggleAuto}
          trackColor={{ false: colors.borderStrong, true: colors.primarySoft }}
          thumbColor={autoMode ? colors.primary : colors.white}
          ios_backgroundColor={colors.borderStrong}
          disabled={loading}
        />
      </View>

      <View style={styles.divider} />

      {/* Manual Buttons */}
      <Text style={styles.manualLabel}>Điều khiển thủ công</Text>
      <View style={styles.buttonRow}>
        <TouchableOpacity
          style={[styles.button, styles.onButton, (loading || autoMode) && styles.buttonDisabled]}
          onPress={onPumpOn}
          disabled={loading || autoMode}
          activeOpacity={0.8}
        >
          {loading ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <>
              <MaterialCommunityIcons name="water-pump" size={18} color="#fff" />
              <Text style={styles.buttonText}>Bật bơm</Text>
            </>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.offButton, (loading || autoMode) && styles.buttonDisabled]}
          onPress={onPumpOff}
          disabled={loading || autoMode}
          activeOpacity={0.8}
        >
          {loading ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <>
              <MaterialCommunityIcons name="water-pump-off" size={18} color="#fff" />
              <Text style={styles.buttonText}>Tắt bơm</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.card,
  },
  autoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  autoIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  autoTextGroup: {
    flex: 1,
  },
  autoLabel: {
    fontSize: 15,
    fontFamily: fonts.semibold,
    color: colors.textPrimary,
  },
  autoDesc: {
    fontSize: 12,
    fontFamily: fonts.regular,
    color: colors.textMuted,
    marginTop: 1,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.md,
  },
  manualLabel: {
    fontSize: 13,
    fontFamily: fonts.semibold,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing.sm,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  button: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.md,
    height: 46,
    gap: spacing.xs,
  },
  onButton: {
    backgroundColor: colors.primary,
  },
  offButton: {
    backgroundColor: colors.danger,
  },
  buttonDisabled: {
    opacity: 0.45,
  },
  buttonText: {
    color: '#fff',
    fontSize: 14,
    fontFamily: fonts.semibold,
    letterSpacing: 0.1,
  },
});

export default PumpControl;
