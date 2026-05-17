import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
  ScrollView,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, fonts, radii, spacing, shadows } from '../styles/theme';

const INFO_ROWS = [
  { icon: 'shield-check', color: colors.primary, label: 'Trạng thái tài khoản', value: 'Đã xác thực email' },
  { icon: 'cellphone-check', color: colors.accentBlue, label: 'Nền tảng', value: 'Android · iOS · Web' },
  { icon: 'database-check', color: colors.accentSun, label: 'Firebase', value: 'Đã kết nối' },
];

// ─── Modal sửa thông tin ───────────────────────────────────────
const EditProfileModal = ({ visible, onClose, userData, onSave }) => {
  const [username, setUsername] = useState(userData?.username || '');
  const [phone, setPhone] = useState(userData?.phone || '');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!username.trim()) {
      Alert.alert('Lỗi', 'Tên hiển thị không được để trống');
      return;
    }
    setSaving(true);
    try {
      await onSave({ username: username.trim(), phone: phone.trim() });
      Alert.alert('Thành công', 'Thông tin đã được cập nhật');
      onClose();
    } catch (e) {
      Alert.alert('Lỗi', e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={styles.modalBackdrop}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.modalBox}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Sửa thông tin</Text>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <MaterialCommunityIcons name="close" size={22} color={colors.textMuted} />
            </TouchableOpacity>
          </View>

          <Text style={styles.fieldLabel}>Tên hiển thị</Text>
          <View style={styles.inputWrap}>
            <MaterialCommunityIcons name="account-outline" size={18} color={colors.textMuted} />
            <TextInput
              style={styles.input}
              value={username}
              onChangeText={setUsername}
              placeholder="Nhập tên của bạn"
              placeholderTextColor={colors.textMuted}
            />
          </View>

          <Text style={styles.fieldLabel}>Số điện thoại</Text>
          <View style={styles.inputWrap}>
            <MaterialCommunityIcons name="phone-outline" size={18} color={colors.textMuted} />
            <TextInput
              style={styles.input}
              value={phone}
              onChangeText={setPhone}
              placeholder="Nhập số điện thoại"
              placeholderTextColor={colors.textMuted}
              keyboardType="phone-pad"
            />
          </View>

          <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={saving} activeOpacity={0.85}>
            {saving
              ? <ActivityIndicator color="#fff" size="small" />
              : <><MaterialCommunityIcons name="content-save-outline" size={18} color="#fff" />
                <Text style={styles.saveBtnText}>Lưu thay đổi</Text></>
            }
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

// ─── Modal đổi mật khẩu ────────────────────────────────────────
const ChangePasswordModal = ({ visible, onClose, onSave }) => {
  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!currentPw || !newPw || !confirmPw) {
      Alert.alert('Lỗi', 'Vui lòng điền đầy đủ các trường');
      return;
    }
    if (newPw !== confirmPw) {
      Alert.alert('Lỗi', 'Mật khẩu mới không khớp');
      return;
    }
    if (newPw.length < 6) {
      Alert.alert('Lỗi', 'Mật khẩu mới phải có ít nhất 6 ký tự');
      return;
    }
    setSaving(true);
    try {
      await onSave(currentPw, newPw);
      Alert.alert('✅ Thành công', 'Mật khẩu đã được đổi');
      setCurrentPw(''); setNewPw(''); setConfirmPw('');
      onClose();
    } catch (e) {
      Alert.alert('Lỗi', e.message.includes('wrong-password') || e.message.includes('invalid-credential')
        ? 'Mật khẩu hiện tại không đúng'
        : e.message
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={styles.modalBackdrop}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.modalBox}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Đổi mật khẩu</Text>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <MaterialCommunityIcons name="close" size={22} color={colors.textMuted} />
            </TouchableOpacity>
          </View>

          {[
            { label: 'Mật khẩu hiện tại', value: currentPw, set: setCurrentPw },
            { label: 'Mật khẩu mới', value: newPw, set: setNewPw },
            { label: 'Xác nhận mật khẩu', value: confirmPw, set: setConfirmPw },
          ].map(({ label, value, set }) => (
            <View key={label}>
              <Text style={styles.fieldLabel}>{label}</Text>
              <View style={styles.inputWrap}>
                <MaterialCommunityIcons name="lock-outline" size={18} color={colors.textMuted} />
                <TextInput
                  style={styles.input}
                  value={value}
                  onChangeText={set}
                  placeholder="••••••••"
                  placeholderTextColor={colors.textMuted}
                  secureTextEntry
                />
              </View>
            </View>
          ))}

          <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={saving} activeOpacity={0.85}>
            {saving
              ? <ActivityIndicator color="#fff" size="small" />
              : <><MaterialCommunityIcons name="lock-reset" size={18} color="#fff" />
                <Text style={styles.saveBtnText}>Đổi mật khẩu</Text></>
            }
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

// ─── Màn hình Cài đặt chính ────────────────────────────────────
const Settings = () => {
  const { user, userData, logout, updateUserProfile, changePassword } = useAuth();
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPwModal, setShowPwModal] = useState(false);

  const handleLogout = () => {
    Alert.alert('Đăng xuất', 'Bạn có chắc chắn muốn đăng xuất không?', [
      { text: 'Hủy', style: 'cancel' },
      {
        text: 'Đăng xuất', style: 'destructive', onPress: async () => {
          try { await logout(); } catch (e) { Alert.alert('Lỗi', e.message); }
        }
      },
    ]);
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

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        {/* Profile Card */}
        <Text style={styles.sectionLabel}>Tài khoản</Text>
        <View style={styles.profileCard}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarText}>
              {(userData?.username || user?.email || '?')[0].toUpperCase()}
            </Text>
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{userData?.username || 'Chưa đặt tên'}</Text>
            <Text style={styles.profileEmail}>{user?.email || 'Không xác định'}</Text>
            {userData?.phone ? (
              <Text style={styles.profilePhone}>📞 {userData.phone}</Text>
            ) : null}
            <View style={styles.verifiedRow}>
              <MaterialCommunityIcons name="check-circle" size={14} color={colors.primary} />
              <Text style={styles.verifiedText}>Email đã xác thực</Text>
            </View>
          </View>
        </View>

        {/* Edit Actions */}
        <View style={styles.actionRow}>
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => setShowEditModal(true)}
            activeOpacity={0.85}
          >
            <MaterialCommunityIcons name="account-edit-outline" size={18} color={colors.primary} />
            <Text style={styles.actionBtnText}>Sửa thông tin</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionBtn, styles.actionBtnAlt]}
            onPress={() => setShowPwModal(true)}
            activeOpacity={0.85}
          >
            <MaterialCommunityIcons name="lock-reset" size={18} color={colors.accentBlue} />
            <Text style={[styles.actionBtnText, { color: colors.accentBlue }]}>Đổi mật khẩu</Text>
          </TouchableOpacity>
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
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.85}>
          <MaterialCommunityIcons name="logout" size={20} color="#fff" />
          <Text style={styles.logoutText}>Đăng xuất</Text>
        </TouchableOpacity>

        <Text style={styles.versionText}>Smart Irrigation v1.0.0</Text>
        <View style={{ height: spacing.xl }} />
      </ScrollView>

      {/* Modals */}
      <EditProfileModal
        visible={showEditModal}
        onClose={() => setShowEditModal(false)}
        userData={userData}
        onSave={updateUserProfile}
      />
      <ChangePasswordModal
        visible={showPwModal}
        onClose={() => setShowPwModal(false)}
        onSave={changePassword}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  glow1: { position: 'absolute', top: -100, right: -100, width: 260, height: 260, borderRadius: 130, backgroundColor: colors.glowPrimary, opacity: 0.55 },
  glow2: { position: 'absolute', bottom: -120, left: -100, width: 280, height: 280, borderRadius: 140, backgroundColor: colors.glowAccent, opacity: 0.55 },

  // Hero
  hero: { height: 190, overflow: 'hidden', borderBottomLeftRadius: radii.xl, borderBottomRightRadius: radii.xl },
  heroImage: { width: '100%', height: '100%' },
  heroOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: colors.overlay, justifyContent: 'center', alignItems: 'center', padding: spacing.lg, gap: spacing.xxs },
  heroTitle: { fontSize: 26, fontFamily: fonts.bold, color: colors.white, letterSpacing: -0.3, marginTop: spacing.xs, textAlign: 'center' },

  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: spacing.lg, paddingTop: spacing.lg },

  sectionLabel: { fontSize: 13, fontFamily: fonts.bold, color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: spacing.sm, marginTop: spacing.xs, textAlign: 'center' },

  // Profile
  profileCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, borderRadius: radii.lg, padding: spacing.md, borderWidth: 1, borderColor: colors.border, gap: spacing.md, marginBottom: spacing.sm, ...shadows.lift },
  avatarCircle: { width: 64, height: 64, borderRadius: 32, backgroundColor: colors.primarySoft, justifyContent: 'center', alignItems: 'center', flexShrink: 0 },
  avatarText: { fontSize: 26, fontFamily: fonts.bold, color: colors.primary },
  profileInfo: { flex: 1 },
  profileName: { fontSize: 16, fontFamily: fonts.bold, color: colors.textPrimary, marginBottom: 2 },
  profileEmail: { fontSize: 13, fontFamily: fonts.medium, color: colors.textSecondary, marginBottom: 2 },
  profilePhone: { fontSize: 12, fontFamily: fonts.medium, color: colors.textMuted, marginBottom: 3 },
  verifiedRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  verifiedText: { fontSize: 12, fontFamily: fonts.medium, color: colors.primary },

  // Action Row
  actionRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.md },
  actionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.xs, backgroundColor: colors.primarySoft, borderRadius: radii.md, height: 44, borderWidth: 1, borderColor: colors.primary + '40' },
  actionBtnAlt: { backgroundColor: colors.accentBlueSoft, borderColor: colors.accentBlue + '40' },
  actionBtnText: { fontSize: 13, fontFamily: fonts.semibold, color: colors.primary },

  // UID
  uidCard: { backgroundColor: colors.surfaceMuted, borderRadius: radii.md, paddingVertical: spacing.sm, paddingHorizontal: spacing.md, marginBottom: spacing.lg, borderWidth: 1, borderColor: colors.border },
  uidLabel: { fontSize: 11, fontFamily: fonts.bold, color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 3 },
  uidValue: { fontSize: 12, fontFamily: fonts.medium, color: colors.textSecondary, letterSpacing: 0.3 },

  // Info Card
  infoCard: { backgroundColor: colors.surface, borderRadius: radii.lg, borderWidth: 1, borderColor: colors.border, marginBottom: spacing.lg, overflow: 'hidden', ...shadows.lift },
  infoRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.md, paddingHorizontal: spacing.lg, gap: spacing.sm },
  infoIconWrap: { width: 38, height: 38, borderRadius: 19, justifyContent: 'center', alignItems: 'center', flexShrink: 0 },
  infoText: { flex: 1 },
  infoLabel: { fontSize: 12, fontFamily: fonts.medium, color: colors.textMuted },
  infoValue: { fontSize: 14, fontFamily: fonts.semibold, color: colors.textPrimary, marginTop: 1 },
  divider: { height: 1, backgroundColor: colors.border, marginHorizontal: spacing.lg },

  // Logout
  logoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: colors.danger, borderRadius: radii.md, height: 52, gap: spacing.xs, marginBottom: spacing.md, ...shadows.lift },
  logoutText: { color: '#fff', fontSize: 16, fontFamily: fonts.bold, letterSpacing: 0.1 },
  versionText: { textAlign: 'center', fontSize: 12, color: colors.textMuted, fontFamily: fonts.medium, marginBottom: spacing.sm },

  // Modal
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.65)', justifyContent: 'flex-end' },
  modalBox: { backgroundColor: colors.surface, borderTopLeftRadius: radii.xl, borderTopRightRadius: radii.xl, padding: spacing.lg, paddingBottom: spacing.xxxl, borderTopWidth: 1, borderColor: colors.border },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.lg },
  modalTitle: { fontSize: 18, fontFamily: fonts.bold, color: colors.textPrimary },
  fieldLabel: { fontSize: 12, fontFamily: fonts.semibold, color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: spacing.xxs, marginTop: spacing.sm },
  inputWrap: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surfaceMuted, borderRadius: radii.md, paddingHorizontal: spacing.sm, borderWidth: 1, borderColor: colors.border, gap: spacing.xs, marginBottom: spacing.xs },
  input: { flex: 1, height: 46, fontSize: 15, fontFamily: fonts.medium, color: colors.textPrimary },
  saveBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primary, borderRadius: radii.md, height: 50, gap: spacing.xs, marginTop: spacing.md },
  saveBtnText: { color: '#fff', fontSize: 15, fontFamily: fonts.bold },
});

export default Settings;
