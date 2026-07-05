import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, Alert,
  ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView,
  Image, Animated, Modal, Dimensions, Keyboard,
} from 'react-native';
import { router } from 'expo-router';
import { useTwinStore } from '../store/useTwinStore';
import { useTheme } from '../utils/theme';
import { apiPost } from '../lib/httpClient';
import { googleLogin } from '../lib/auth';
import {
  Mail, Lock, Eye, EyeOff, LogIn, UserPlus, Globe,
  Chrome, Sparkles, CheckCircle2, X,
} from 'lucide-react-native';

const { height: SCREEN_H } = Dimensions.get('window');

const APP_LOGO = require('../assets/logo.png');

// ============================================================
// NEURON NETWORK — خلايا عصبية ذهبية
// ============================================================
const NeuronNetwork = ({ isDark }: { isDark: boolean }) => {
  const neurons = useRef(
    Array.from({ length: 10 }).map(() => ({
      x: 10 + Math.random() * 80,
      y: 5 + Math.random() * 90,
      pulse: new Animated.Value(0.2 + Math.random() * 0.3),
      size: 3 + Math.random() * 4,
      delay: Math.random() * 2000,
    }))
  ).current;

  useEffect(() => {
    neurons.forEach(n => {
      Animated.loop(
        Animated.sequence([
          Animated.delay(n.delay),
          Animated.timing(n.pulse, { toValue: 0.8, duration: 1800, useNativeDriver: true }),
          Animated.timing(n.pulse, { toValue: 0.2, duration: 1800, useNativeDriver: true }),
        ])
      ).start();
    });
  }, []);

  const lineColor = isDark ? 'rgba(251, 191, 36, 0.12)' : 'rgba(217, 119, 6, 0.15)';
  const nodeColor = isDark ? '#FBBF24' : '#D97706';

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {neurons.map((n, i) => (
        <React.Fragment key={i}>
          {neurons.slice(i + 1).map((n2, j) => {
            const dx = n2.x - n.x;
            const dy = n2.y - n.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist > 30) return null;
            return (
              <View
                key={`${i}-${j}`}
                style={{
                  position: 'absolute',
                  left: `${n.x}%`,
                  top: `${n.y}%`,
                  width: `${dist}%`,
                  height: 1,
                  backgroundColor: lineColor,
                  transform: [{ rotate: `${Math.atan2(dy, dx)}rad` }],
                }}
              />
            );
          })}
          <Animated.View
            style={{
              position: 'absolute',
              left: `${n.x}%`,
              top: `${n.y}%`,
              width: n.size,
              height: n.size,
              borderRadius: n.size / 2,
              backgroundColor: nodeColor,
              opacity: n.pulse,
            }}
          />
        </React.Fragment>
      ))}
    </View>
  );
};

// ============================================================
// POPUP احترافي — تأكيد إنشاء الحساب
// ============================================================
const SuccessPopup = ({
  visible,
  onClose,
  isAr,
}: {
  visible: boolean;
  onClose: () => void;
  isAr: boolean;
}) => {
  const scaleAnim = useRef(new Animated.Value(0.5)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(scaleAnim, { toValue: 1, friction: 6, tension: 100, useNativeDriver: true }),
        Animated.timing(opacityAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
      ]).start();
    } else {
      scaleAnim.setValue(0.5);
      opacityAnim.setValue(0);
    }
  }, [visible]);

  if (!visible) return null;

  return (
    <Modal visible transparent animationType="none" statusBarTranslucent>
      <View style={popupStyles.overlay}>
        <Animated.View
          style={[
            popupStyles.container,
            { opacity: opacityAnim, transform: [{ scale: scaleAnim }] },
          ]}
        >
          <TouchableOpacity style={popupStyles.closeBtn} onPress={onClose}>
            <X size={20} stroke="#A78BFA" />
          </TouchableOpacity>

          <View style={popupStyles.iconWrap}>
            <CheckCircle2 size={64} stroke="#10B981" />
          </View>

          <Text style={popupStyles.title}>
            {isAr ? 'تم إنشاء حسابك!' : 'Account Created!'}
          </Text>

          <Text style={popupStyles.message}>
            {isAr
              ? 'أرسلنا إليك بريداً إلكترونياً للتأكيد.\nيرجى التحقق من صندوق الوارد (والمهملات) والنقر على رابط التفعيل.\nبعدها يمكنك تسجيل الدخول.'
              : "We've sent you a confirmation email.\nPlease check your inbox (and spam) and click the activation link.\nThen you can sign in."}
          </Text>

          <TouchableOpacity style={popupStyles.btn} onPress={onClose} activeOpacity={0.8}>
            <Sparkles size={18} stroke="#FFF" />
            <Text style={popupStyles.btnText}>
              {isAr ? 'حسناً، سأتحقق' : 'Got it, I\'ll check'}
            </Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </Modal>
  );
};

const popupStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  container: {
    backgroundColor: '#1A1226',
    borderRadius: 28,
    padding: 32,
    width: '100%',
    maxWidth: 380,
    borderWidth: 1,
    borderColor: '#7C3AED40',
    alignItems: 'center',
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 30,
    elevation: 20,
  },
  closeBtn: {
    position: 'absolute',
    top: 16,
    right: 16,
    padding: 8,
    borderRadius: 12,
    backgroundColor: '#7C3AED15',
  },
  iconWrap: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#10B98115',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 2,
    borderColor: '#10B98130',
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 12,
    textAlign: 'center',
  },
  message: {
    fontSize: 14,
    color: '#A78BFA',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#7C3AED',
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 16,
    width: '100%',
  },
  btnText: {
    color: '#FFF',
    fontWeight: '700',
    fontSize: 16,
  },
});

// ============================================================
// LOGIN SCREEN
// ============================================================
export default function Login() {
  const { setAuth, lang, setLang, hasHydrated } = useTwinStore();
  const isAr = lang === 'ar';
  const isDark = useTheme().isDark;

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [keyboardVisible, setKeyboardVisible] = useState(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const logoScale = useRef(new Animated.Value(0.8)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;

  // مراقبة لوحة المفاتيح
  useEffect(() => {
    const showSub = Keyboard.addListener(Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow', (e) => {
      setKeyboardVisible(true);
      Animated.timing(slideAnim, {
        toValue: -Math.min(e.endCoordinates.height * 0.25, 120),
        duration: 250,
        useNativeDriver: true,
      }).start();
    });
    const hideSub = Keyboard.addListener(Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide', () => {
      setKeyboardVisible(false);
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }).start();
    });

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  useEffect(() => {
    if (!hasHydrated) return;
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
      Animated.spring(logoScale, { toValue: 1, friction: 6, tension: 40, useNativeDriver: true }),
    ]).start();
  }, [hasHydrated]);

  const toggleLanguage = () => setLang(lang === 'ar' ? 'en' : 'ar');

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert(
        isAr ? '⚠️ تنبيه' : '⚠️ Notice',
        isAr ? 'أدخل البريد الإلكتروني وكلمة المرور' : 'Enter email and password'
      );
      return;
    }
    setLoading(true);
    try {
      const data = await apiPost('/api/auth/login', { email: email.trim(), password });
      if (data?.token && data?.user_id) {
        setAuth(data.user_id);
        router.replace(data?.onboarded ? '/twin-mind' : '/onboarding');
      } else {
        Alert.alert(
          isAr ? '❌ خطأ' : '❌ Error',
          isAr ? 'بيانات دخول غير صحيحة' : 'Invalid credentials'
        );
      }
    } catch (e: any) {
      Alert.alert(
        isAr ? '❌ خطأ' : '❌ Error',
        e.message || (isAr ? 'فشل تسجيل الدخول. تحقق من اتصالك.' : 'Login failed. Check your connection.')
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert(
        isAr ? '⚠️ تنبيه' : '⚠️ Notice',
        isAr ? 'أدخل البريد الإلكتروني وكلمة المرور' : 'Enter email and password'
      );
      return;
    }
    if (password.length < 6) {
      Alert.alert(
        isAr ? '⚠️ تنبيه' : '⚠️ Notice',
        isAr ? 'كلمة المرور يجب أن تكون 6 أحرف على الأقل' : 'Password must be at least 6 characters'
      );
      return;
    }
    setLoading(true);
    try {
      const data = await apiPost('/api/auth/signup', {
        email: email.trim(),
        password,
        lang: isAr ? 'ar' : 'en',
        twin_name: isAr ? 'توأمك' : 'MyTwin',
      });
      if (data?.token && data?.user_id) {
        setShowSuccessPopup(true);
      } else if (data?.message?.includes('already exists') || data?.error?.includes('already exists')) {
        Alert.alert(
          isAr ? '⚠️ موجود' : '⚠️ Exists',
          isAr ? 'هذا البريد مسجل مسبقاً. سجل دخولك.' : 'This email is already registered. Please sign in.'
        );
      } else {
        setShowSuccessPopup(true);
      }
    } catch (e: any) {
      Alert.alert(
        isAr ? '❌ خطأ' : '❌ Error',
        e.message || (isAr ? 'فشل إنشاء الحساب' : 'Signup failed')
      );
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      const data = await googleLogin(isAr ? 'ar' : 'en');
      if (data?.token && data?.user_id) {
        setAuth(data.user_id);
        router.replace(data?.onboarded ? '/twin-mind' : '/onboarding');
      } else {
        Alert.alert(
          isAr ? '❌ خطأ' : '❌ Error',
          isAr ? 'فشل تسجيل الدخول بـ Google' : 'Google login failed'
        );
      }
    } catch (e: any) {
      Alert.alert(
        isAr ? '❌ خطأ' : '❌ Error',
        e.message || (isAr ? 'فشل الاتصال بـ Google' : 'Failed to connect to Google')
      );
    } finally {
      setLoading(false);
    }
  };

  const handleClosePopup = () => {
    setShowSuccessPopup(false);
    setPassword('');
  };

  const colors = {
    bg: isDark ? '#0A0014' : '#FAFAF8',
    card: isDark ? '#1A1226' : '#FFFFFF',
    text: isDark ? '#FFFFFF' : '#1A1226',
    subtext: isDark ? '#A78BFA' : '#6B5B8A',
    accent: '#7C3AED',
    accentLight: '#7C3AED15',
    border: isDark ? '#2D1B4D' : '#E0D9F5',
    inputBg: isDark ? '#161122' : '#F8F6F2',
    google: '#4285F4',
    googleLight: '#4285F415',
  };

  // 🛡️ حماية: لا تعرض حتى يكتمل rehydration
  if (!hasHydrated) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0A0014' }}>
        <ActivityIndicator size="large" color="#7C3AED" />
        <Text style={{ color: '#A78BFA', marginTop: 16, fontSize: 14 }}>
          {isAr ? 'يتم الاتصال بوعي التوأم...' : 'Connecting to Twin consciousness...'}
        </Text>
      </View>
    );
  }

  return (
    <View style={[st.root, { backgroundColor: colors.bg }]}>
      <NeuronNetwork isDark={isDark} />

      {/* Popup نجاح إنشاء الحساب */}
      <SuccessPopup
        visible={showSuccessPopup}
        onClose={handleClosePopup}
        isAr={isAr}
      />

      {/* زر اللغة */}
      <TouchableOpacity style={st.langBtn} onPress={toggleLanguage}>
        <Globe size={22} stroke={colors.accent} />
        <Text style={[st.langText, { color: colors.accent }]}>
          {isAr ? 'English' : 'العربية'}
        </Text>
      </TouchableOpacity>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={st.container}
          showsVerticalScrollIndicator={false}
        >
          <Animated.View
            style={[
              st.contentWrap,
              { transform: [{ translateY: slideAnim }] },
            ]}
          >
            {/* الشعار */}
            <Animated.View style={[st.logoContainer, { transform: [{ scale: logoScale }] }]}>
              <View style={st.logoGlow}>
                <Image source={APP_LOGO} style={st.logo} resizeMode="contain" />
              </View>
            </Animated.View>

            <Animated.Text style={[st.heading, { color: colors.text, opacity: fadeAnim }]}>
              My Twin
            </Animated.Text>

            <Animated.Text style={[st.tagline, { color: colors.subtext, opacity: fadeAnim }]}>
              {isAr ? 'توأمك الرقمي .. دائماً معك' : 'Your Twin AI .. Always There'}
            </Animated.Text>

            {/* زر Google */}
            <Animated.View style={{ opacity: fadeAnim, width: '100%' }}>
              <TouchableOpacity
                style={[st.googleBtn, { backgroundColor: colors.googleLight, borderColor: colors.google }]}
                onPress={handleGoogleLogin}
                disabled={loading}
                activeOpacity={0.8}
              >
                <Chrome size={22} stroke={colors.google} />
                <Text style={[st.googleBtnText, { color: colors.google }]}>
                  {isAr ? 'التسجيل باستخدام Google' : 'Continue with Google'}
                </Text>
              </TouchableOpacity>

              {/* فاصل */}
              <View style={st.dividerRow}>
                <View style={[st.dividerLine, { backgroundColor: colors.border }]} />
                <Text style={[st.dividerText, { color: colors.subtext }]}>
                  {isAr ? 'أو' : 'OR'}
                </Text>
                <View style={[st.dividerLine, { backgroundColor: colors.border }]} />
              </View>
            </Animated.View>

            {/* حقل البريد */}
            <Animated.View style={[st.inputWrap, { backgroundColor: colors.inputBg, borderColor: colors.border, opacity: fadeAnim }]}>
              <Mail size={20} stroke={colors.subtext} />
              <TextInput
                style={[st.input, { color: colors.text, textAlign: isAr ? 'right' : 'left' }]}
                placeholder={isAr ? 'البريد الإلكتروني' : 'Email'}
                placeholderTextColor={colors.subtext}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="next"
              />
            </Animated.View>

            {/* حقل كلمة المرور */}
            <Animated.View style={[st.inputWrap, { backgroundColor: colors.inputBg, borderColor: colors.border, opacity: fadeAnim }]}>
              <Lock size={20} stroke={colors.subtext} />
              <TextInput
                style={[st.input, { color: colors.text, flex: 1, textAlign: isAr ? 'right' : 'left' }]}
                placeholder={isAr ? 'كلمة المرور' : 'Password'}
                placeholderTextColor={colors.subtext}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                returnKeyType="done"
                onSubmitEditing={handleLogin}
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                {showPassword ? <EyeOff size={20} stroke={colors.subtext} /> : <Eye size={20} stroke={colors.subtext} />}
              </TouchableOpacity>
            </Animated.View>

            {/* زر تسجيل الدخول */}
            <Animated.View style={{ opacity: fadeAnim, width: '100%' }}>
              <TouchableOpacity
                style={[st.primaryBtn, { backgroundColor: colors.accent, opacity: loading ? 0.7 : 1 }]}
                onPress={handleLogin}
                disabled={loading}
                activeOpacity={0.8}
              >
                {loading ? (
                  <ActivityIndicator color="#FFF" />
                ) : (
                  <>
                    <LogIn size={20} stroke="#FFF" />
                    <Text style={st.primaryBtnText}>{isAr ? 'تسجيل الدخول' : 'Sign In'}</Text>
                  </>
                )}
              </TouchableOpacity>
            </Animated.View>

            {/* زر إنشاء حساب */}
            <Animated.View style={{ opacity: fadeAnim, width: '100%' }}>
              <TouchableOpacity
                style={[st.outlineBtn, { borderColor: colors.accent, opacity: loading ? 0.7 : 1 }]}
                onPress={handleSignup}
                disabled={loading}
                activeOpacity={0.8}
              >
                <UserPlus size={20} stroke={colors.accent} />
                <Text style={[st.outlineBtnText, { color: colors.accent }]}>
                  {isAr ? 'إنشاء حساب جديد' : 'Create Account'}
                </Text>
              </TouchableOpacity>
            </Animated.View>

            {/* نص مساعد */}
            <Animated.Text style={[st.helpText, { color: colors.subtext, opacity: fadeAnim }]}>
              {isAr
                ? 'بالتسجيل، أنت توافق على شروط الاستخدام وسياسة الخصوصية'
                : 'By signing up, you agree to Terms of Use and Privacy Policy'}
            </Animated.Text>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const st = StyleSheet.create({
  root: { flex: 1 },
  container: { flexGrow: 1, padding: 24, justifyContent: 'center', alignItems: 'center' },
  contentWrap: { width: '100%', alignItems: 'center' },
  langBtn: {
    position: 'absolute',
    top: 50,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#7C3AED15',
    zIndex: 10,
  },
  langText: { fontWeight: '600', fontSize: 14 },
  logoContainer: { alignItems: 'center', marginBottom: 16 },
  logoGlow: {
    shadowColor: '#A855F7',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 10,
  },
  logo: { width: 110, height: 110, borderRadius: 28 },
  heading: { fontSize: 34, fontWeight: '800', textAlign: 'center', marginBottom: 6 },
  tagline: { fontSize: 14, textAlign: 'center', marginBottom: 20, lineHeight: 20, paddingHorizontal: 20 },

  // Google
  googleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 14,
    borderRadius: 16,
    borderWidth: 1.5,
    width: '100%',
    marginBottom: 10,
  },
  googleBtnText: {
    fontSize: 15,
    fontWeight: '700',
  },

  // Divider
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
    width: '100%',
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    marginHorizontal: 14,
    fontSize: 13,
    fontWeight: '600',
  },

  // Inputs
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginBottom: 14,
    gap: 12,
    width: '100%',
  },
  input: {
    flex: 1,
    fontSize: 16,
  },

  // Buttons
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    gap: 8,
  },
  primaryBtnText: { color: '#FFF', fontWeight: '700', fontSize: 17 },
  outlineBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1.5,
    gap: 8,
    marginBottom: 16,
  },
  outlineBtnText: { fontWeight: '700', fontSize: 17 },

  // Help text
  helpText: {
    fontSize: 11,
    textAlign: 'center',
    lineHeight: 18,
    marginTop: 10,
    opacity: 0.8,
  },
});
