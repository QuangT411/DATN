import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
  ScrollView,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, fonts, radii, spacing, shadows } from '../styles/theme';

const INFO_ROWS = [
  {
    icon: 'shield-check',
    color: colors.primary,
    label: 'Trạng thái tài khoản',
    value: 'Đã xác thực email',
  },
  {
    icon: 'cellphone-check',
    color: colors.accentBlue,
    label: 'Nền tảng',
    value: 'Android · iOS · Web',
  },
  {
    icon: 'database-check',
    color: colors.accentSun,
    label: 'Firebase',
    value: 'Đã kết nối',
  },
];

const Settings = () => {
  const { user, logout } = useAuth();

  const handleLogout = () => {
    Alert.alert(
      'Đăng xuất',
      'Bạn có chắc chắn muốn đăng xuất không?',
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Đăng xuất',
          style: 'destructive',
          onPress: async () => {
            try {
              await logout();
            } catch (error) {
              Alert.alert('Lỗi', error.message);
            }
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <View pointerEvents="none" style={styles.glow1} />
      <View pointerEvents="none" style={styles.glow2} />

      {/* Hero */}
      <View style={styles.hero}>
        <Image
          source={{ uri: 'https://images.unsplash.com/photo-1499529112087-3cb3b73cec95?w=1400&q=80' }}
          style={styles.heroImage}
        />
        <View style={styles.heroOverlay}>
          <MaterialCommunityIcons name="cog" size={32} color="rgba(255,255,255,0.9)" />
          <Text style={styles.heroTitle}>Cài đặt</Text>

        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Card */}
        <Text style={styles.sectionLabel}>Tài khoản</Text>
        <View style={styles.profileCard}>
          <View style={styles.avatarCircle}>
            <MaterialCommunityIcons name="account" size={40} color={colors.primary} />
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.profileEmail}>{user?.email || 'Không xác định'}</Text>
            <View style={styles.verifiedRow}>
              <MaterialCommunityIcons name="check-circle" size={14} color={colors.primary} />
              <Text style={styles.verifiedText}>Email đã xác thực</Text>
            </View>
          </View>
        </View>

        {/* UID Card */}
        <View style={styles.uidCard}>
          <Text style={styles.uidLabel}>User ID</Text>
          <Text style={styles.uidValue} numberOfLines={1} ellipsizeMode="middle">
            {user?.uid || 'N/A'}
          </Text>
        </View>

        {/* System Info */}
        <Text style={styles.sectionLabel}>Thông tin hệ thống</Text>
        <View style={styles.infoCard}>
          {INFO_ROWS.map((row, index) => (
            <View key={row.label}>
              <View style={styles.infoRow}>
                <View style={[styles.infoIconWrap, { backgroundColor: row.color + '18' }]}>
                  <MaterialCommunityIcons name={row.icon} size={20} color={row.color} />
                </View>
                <View style={styles.infoText}>
                  <Text style={styles.infoLabel}>{row.label}</Text>
                  <Text style={styles.infoValue}>{row.value}</Text>
                </View>
                <MaterialCommunityIcons name="check" size={16} color={colors.primary} />
              </View>
              {index < INFO_ROWS.length - 1 && <View style={styles.divider} />}
            </View>
          ))}
        </View>

        {/* Logout */}
        <TouchableOpacity
          style={styles.logoutBtn}
          onPress={handleLogout}
          activeOpacity={0.85}
        >
          <MaterialCommunityIcons name="logout" size={20} color="#fff" />
          <Text style={styles.logoutText}>Đăng xuất</Text>
        </TouchableOpacity>

        <Text style={styles.versionText}>Smart Irrigation v1.0.0</Text>
        <View style={{ height: spacing.xl }} />
      </ScrollView>
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
  heroSub: {
    fontSize: 13,
    fontFamily: fonts.medium,
    color: 'rgba(255,255,255,0.75)',
  },

  scroll: { flex: 1 },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
  },

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

  // Profile Card
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.md,
    marginBottom: spacing.sm,
    ...shadows.lift,
  },
  avatarCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  profileInfo: { flex: 1 },
  profileEmail: {
    fontSize: 15,
    fontFamily: fonts.bold,
    color: colors.textPrimary,
    marginBottom: spacing.xxs,
  },
  verifiedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  verifiedText: {
    fontSize: 12,
    fontFamily: fonts.medium,
    color: colors.primary,
  },

  // UID Card
  uidCard: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: radii.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  uidLabel: {
    fontSize: 11,
    fontFamily: fonts.bold,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 3,
  },
  uidValue: {
    fontSize: 12,
    fontFamily: fonts.medium,
    color: colors.textSecondary,
    letterSpacing: 0.3,
  },

  // Info Card
  infoCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.lg,
    overflow: 'hidden',
    ...shadows.lift,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
  },
  infoIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  infoText: { flex: 1 },
  infoLabel: {
    fontSize: 12,
    fontFamily: fonts.medium,
    color: colors.textMuted,
  },
  infoValue: {
    fontSize: 14,
    fontFamily: fonts.semibold,
    color: colors.textPrimary,
    marginTop: 1,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginHorizontal: spacing.lg,
  },

  // Logout
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.danger,
    borderRadius: radii.md,
    height: 52,
    gap: spacing.xs,
    marginBottom: spacing.md,
    ...shadows.lift,
  },
  logoutText: {
    color: '#fff',
    fontSize: 16,
    fontFamily: fonts.bold,
    letterSpacing: 0.1,
  },

  versionText: {
    textAlign: 'center',
    fontSize: 12,
    color: colors.textMuted,
    fontFamily: fonts.medium,
    marginBottom: spacing.sm,
  },
});

export default Settings;
