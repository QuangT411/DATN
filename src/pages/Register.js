import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Image,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { fonts, radii, spacing, shadows } from '../styles/theme';

const FIELDS = [
  { key: 'username', label: 'Họ và tên', icon: 'account-outline', placeholder: 'Nhập tên của bạn', type: 'default', capitalize: 'words' },
  { key: 'email', label: 'Email', icon: 'email-outline', placeholder: 'example@email.com', type: 'email-address', capitalize: 'none' },
  { key: 'phone', label: 'Số điện thoại', icon: 'phone-outline', placeholder: '0987 654 321', type: 'phone-pad', capitalize: 'none' },
  { key: 'password', label: 'Mật khẩu', icon: 'lock-outline', placeholder: 'Ít nhất 6 ký tự', secure: true, capitalize: 'none' },
  { key: 'confirmPassword', label: 'Xác nhận mật khẩu', icon: 'lock-check-outline', placeholder: 'Nhập lại mật khẩu', secure: true, capitalize: 'none' },
];

const Register = ({ navigation }) => {
  const [form, setForm] = useState({
    username: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [registered, setRegistered] = useState(false);
  const [lastResendTime, setLastResendTime] = useState(null);
  const [resendLoading, setResendLoading] = useState(false);
  const { register, resendVerificationEmail } = useAuth();
  const { colors } = useTheme();

  const styles = makeStyles(colors);

  const updateField = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const handleRegister = async () => {
    const { username, email, phone, password, confirmPassword } = form;

    if (!username.trim() || !email.trim() || !phone.trim() || !password.trim() || !confirmPassword.trim()) {
      Alert.alert('Thiếu thông tin', 'Vui lòng nhập đầy đủ tất cả các trường');
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert('Lỗi', 'Mật khẩu xác nhận không khớp');
      return;
    }
    if (password.length < 6) {
      Alert.alert('Mật khẩu quá ngắn', 'Mật khẩu phải có ít nhất 6 ký tự');
      return;
    }

    setLoading(true);
    try {
      await register(email.trim(), password, username.trim(), phone.trim());
      setRegistered(true);
      setLastResendTime(Date.now());
    } catch (error) {
      Alert.alert('Đăng ký thất bại', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (lastResendTime) {
      const elapsed = Math.floor((Date.now() - lastResendTime) / 1000);
      if (elapsed < 60) {
        const remaining = 60 - elapsed;
        Alert.alert('Vui lòng chờ', `Bạn có thể gửi lại sau ${remaining} giây.`);
        return;
      }
    }
    setResendLoading(true);
    try {
      await resendVerificationEmail(form.email.trim(), form.password);
      setLastResendTime(Date.now());
      Alert.alert('✓ Đã gửi lại', 'Kiểm tra hộp thư của bạn (kể cả Spam).');
    } catch (error) {
      Alert.alert('Lỗi', error.message);
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <View pointerEvents="none" style={styles.glow1} />
      <View pointerEvents="none" style={styles.glow2} />

      {registered ? (
        // ---- VIEW CHờ XÁC MINH EMAIL ----
        <View style={styles.verifyContainer}>
          <View style={styles.verifyIconWrap}>
            <MaterialCommunityIcons name="email-check-outline" size={64} color={colors.primary} />
          </View>
          <Text style={styles.verifyTitle}>Kiểm tra hộp thư!</Text>
          <Text style={styles.verifyDesc}>
            Chúng tôi đã gửi email xác minh tới
          </Text>
          <Text style={styles.verifyEmail}>{form.email.trim()}</Text>
          <Text style={styles.verifyDesc}>
            Vui lòng mở email và nhấn vào đường liên kết xác minh trước khi đăng nhập.
          </Text>

          <TouchableOpacity
            style={[styles.resendBtn, resendLoading && styles.resendBtnDisabled]}
            onPress={handleResend}
            disabled={resendLoading}
            activeOpacity={0.85}
          >
            {resendLoading ? (
              <ActivityIndicator color={colors.primary} />
            ) : (
              <>
                <MaterialCommunityIcons name="email-sync-outline" size={18} color={colors.primary} />
                <Text style={styles.resendBtnText}>Gửi lại email xác minh</Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => navigation.goBack()}
            activeOpacity={0.85}
          >
            <MaterialCommunityIcons name="arrow-left" size={18} color="#fff" />
            <Text style={styles.backBtnText}>Về đăng nhập</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
        {/* Banner */}
        <View style={styles.banner}>
          <Image
            source={{
              uri: 'https://images.unsplash.com/photo-1762330472502-83efbe1d4478?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
            }}
            style={styles.bannerImage}
          />
          <View style={styles.bannerOverlay}>
            <MaterialCommunityIcons name="account-plus" size={48} color="rgba(255,255,255,0.95)" />
            <Text style={styles.bannerTitle}>Tạo tài khoản</Text>

          </View>
        </View>

        {/* Form */}
        <View style={styles.form}>
          <Text style={styles.formTitle}>Đăng ký</Text>


          {FIELDS.map((field) => {
            const isPassword = field.key === 'password';
            const isConfirm = field.key === 'confirmPassword';
            const showEye = isPassword || isConfirm;
            const secure = (isPassword && !showPassword) || (isConfirm && !showConfirm);

            return (
              <View key={field.key}>
                <Text style={styles.fieldLabel}>{field.label}</Text>
                <View style={styles.inputWrap}>
                  <View style={styles.inputIconWrap}>
                    <MaterialCommunityIcons name={field.icon} size={19} color={colors.primary} />
                  </View>
                  <TextInput
                    style={styles.input}
                    placeholder={field.placeholder}
                    value={form[field.key]}
                    onChangeText={(v) => updateField(field.key, v)}
                    keyboardType={field.type || 'default'}
                    autoCapitalize={field.capitalize || 'none'}
                    secureTextEntry={secure}
                    placeholderTextColor={colors.textMuted}
                  />
                  {showEye && (
                    <TouchableOpacity
                      style={styles.eyeBtn}
                      onPress={() =>
                        isPassword ? setShowPassword(!showPassword) : setShowConfirm(!showConfirm)
                      }
                    >
                      <MaterialCommunityIcons
                        name={(!isPassword ? showConfirm : showPassword) ? 'eye-off-outline' : 'eye-outline'}
                        size={19}
                        color={colors.textMuted}
                      />
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            );
          })}

          {/* Register Button */}
          <TouchableOpacity
            style={[styles.registerBtn, loading && styles.registerBtnDisabled]}
            onPress={handleRegister}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <MaterialCommunityIcons name="account-plus" size={20} color="#fff" />
                <Text style={styles.registerBtnText}>Tạo tài khoản</Text>
              </>
            )}
          </TouchableOpacity>

          {/* Login Link */}
          <View style={styles.loginRow}>
            <Text style={styles.loginText}>Đã có tài khoản? </Text>
            <TouchableOpacity onPress={() => navigation.goBack()}>
              <Text style={styles.loginLink}>Đăng nhập</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
      )}
    </KeyboardAvoidingView>
  );
};

const makeStyles = (colors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  glow1: {
    position: 'absolute',
    top: -120,
    right: -90,
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: colors.glowPrimary,
    opacity: 0.6,
  },
  glow2: {
    position: 'absolute',
    bottom: -140,
    left: -100,
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: colors.glowAccent,
    opacity: 0.6,
  },
  scrollContent: { flexGrow: 1 },

  // Banner
  banner: {
    height: 220,
    overflow: 'hidden',
    borderBottomLeftRadius: radii.xl,
    borderBottomRightRadius: radii.xl,
  },
  bannerImage: { width: '100%', height: '100%' },
  bannerOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.overlay,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
    gap: spacing.xxs,
  },
  bannerTitle: {
    fontSize: 26,
    fontFamily: fonts.bold,
    color: colors.white,
    letterSpacing: -0.3,
    marginTop: spacing.sm,
    textAlign: 'center',
  },

  // Form
  form: {
    flex: 1,
    backgroundColor: colors.surface,
    borderTopLeftRadius: radii.xl,
    borderTopRightRadius: radii.xl,
    marginTop: -radii.xl,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    paddingBottom: spacing.xl,
  },
  formTitle: {
    fontSize: 22,
    fontFamily: fonts.bold,
    color: colors.textPrimary,
    marginBottom: spacing.xxs,
    letterSpacing: -0.2,
    textAlign: 'center',
    alignSelf: 'stretch',
  },

  // Field
  fieldLabel: {
    fontSize: 13,
    fontFamily: fonts.semibold,
    color: colors.textSecondary,
    marginBottom: spacing.xxs,
    marginLeft: spacing.xxs,
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceMuted,
    borderRadius: radii.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    marginBottom: spacing.md,
    minHeight: 50,
    paddingHorizontal: spacing.sm,
  },
  inputIconWrap: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.xxs,
  },
  input: {
    flex: 1,
    fontSize: 15,
    fontFamily: fonts.medium,
    color: colors.textPrimary,
    paddingVertical: spacing.sm,
  },
  eyeBtn: {
    padding: spacing.xs,
  },

  // Register Button
  registerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    borderRadius: radii.md,
    height: 52,
    gap: spacing.xs,
    marginTop: spacing.sm,
    ...shadows.soft,
  },
  registerBtnDisabled: { opacity: 0.7 },
  registerBtnText: {
    color: '#fff',
    fontSize: 16,
    fontFamily: fonts.bold,
    letterSpacing: 0.2,
  },

  // Login Link
  loginRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: spacing.lg,
  },
  loginText: {
    fontSize: 14,
    fontFamily: fonts.regular,
    color: colors.textSecondary,
  },
  loginLink: {
    fontSize: 14,
    fontFamily: fonts.bold,
    color: colors.primary,
  },
  // Verification Pending
  verifyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    gap: spacing.sm,
  },
  verifyIconWrap: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  verifyTitle: {
    fontSize: 24,
    fontFamily: fonts.bold,
    color: colors.textPrimary,
    letterSpacing: -0.3,
    textAlign: 'center',
  },
  verifyDesc: {
    fontSize: 14,
    fontFamily: fonts.regular,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  verifyEmail: {
    fontSize: 15,
    fontFamily: fonts.bold,
    color: colors.primary,
    textAlign: 'center',
  },
  resendBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    borderWidth: 1.5,
    borderColor: colors.primary,
    borderRadius: radii.md,
    height: 50,
    width: '100%',
    marginTop: spacing.md,
  },
  resendBtnDisabled: { opacity: 0.5 },
  resendBtnText: {
    fontSize: 15,
    fontFamily: fonts.semibold,
    color: colors.primary,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    backgroundColor: colors.primary,
    borderRadius: radii.md,
    height: 50,
    width: '100%',
    marginTop: spacing.xs,
    ...shadows.soft,
  },
  backBtnText: {
    fontSize: 15,
    fontFamily: fonts.semibold,
    color: '#fff',
  },
});

export default Register;
