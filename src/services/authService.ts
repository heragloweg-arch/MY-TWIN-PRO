import { apiPost, apiGet } from '../../lib/httpClient';
import { googleLogin } from '../../lib/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { securityService } from './SecurityService';

const KEYS = {
  USER: 'mytwin-user',
  DEVICE_TRUSTED: 'mytwin-device-trusted',
  LAST_SESSION: 'mytwin-last-session',
};

export interface AuthResult {
  token: string;
  user_id: string;
  onboarded: boolean;
  twin_name?: string;
  isNewUser: boolean;
}

export interface SessionRestoreResult {
  canRestore: boolean;
  token?: string;
  user_id?: string;
  lastSessionId?: string;
  reason?: string;
}

export class AuthService {
  async login(email: string, password: string): Promise<AuthResult> {
    try {
      const data = await apiPost('/api/auth/login', { email: email.trim(), password });
      if (data?.token && data?.user_id) {
        await securityService.storeToken(data.token);
        await AsyncStorage.setItem(KEYS.USER, data.user_id);
        return { token: data.token, user_id: data.user_id, onboarded: data.onboarded || false, isNewUser: false };
      }
      throw new Error(data?.message || 'فشل تسجيل الدخول');
    } catch (e: any) {
      throw new Error(e.message || 'فشل تسجيل الدخول. تحقق من بريدك الإلكتروني وكلمة المرور.');
    }
  }

  async signup(email: string, password: string, twinName: string = 'توأمك', lang: string = 'ar'): Promise<AuthResult> {
    try {
      const data = await apiPost('/api/auth/signup', { email: email.trim(), password, twin_name: twinName, lang });
      if (data?.token && data?.user_id) {
        await securityService.storeToken(data.token);
        await AsyncStorage.setItem(KEYS.USER, data.user_id);
        return { token: data.token, user_id: data.user_id, onboarded: false, twin_name: twinName, isNewUser: true };
      }
      throw new Error(data?.message || 'فشل إنشاء الحساب');
    } catch (e: any) {
      if (e.message?.includes('already registered')) {
        throw new Error('هذا البريد مسجل بالفعل. حاول تسجيل الدخول.');
      }
      throw new Error(e.message || 'فشل إنشاء الحساب. حاول مرة أخرى.');
    }
  }

  async loginWithGoogle(lang: string = 'ar'): Promise<AuthResult> {
    try {
      const data = await googleLogin(lang);
      if (data?.token && data?.user_id) {
        await securityService.storeToken(data.token);
        await AsyncStorage.setItem(KEYS.USER, data.user_id);
        return { token: data.token, user_id: data.user_id, onboarded: data.onboarded || false, isNewUser: !data.onboarded };
      }
      throw new Error('فشل تسجيل الدخول بـ Google');
    } catch (e: any) {
      throw new Error(e.message || 'فشل تسجيل الدخول بـ Google. حاول مرة أخرى.');
    }
  }

  async forgotPassword(email: string): Promise<void> {
    await apiPost('/api/auth/forgot-password', { email: email.trim() });
  }

  async logout(): Promise<void> {
    await securityService.clearAll();
    await AsyncStorage.multiRemove([KEYS.USER, KEYS.LAST_SESSION]);
  }

  async isAuthenticated(): Promise<boolean> {
    const token = await securityService.getToken();
    if (!token) return false;
    if (securityService.isTokenExpired(token)) {
      const refreshed = await securityService.refreshAuthToken();
      return refreshed;
    }
    return true;
  }

  async getUserId(): Promise<string | null> {
    return await AsyncStorage.getItem(KEYS.USER);
  }

  async checkSessionRestore(): Promise<SessionRestoreResult> {
    const token = await securityService.getToken();
    const userId = await AsyncStorage.getItem(KEYS.USER);
    const lastSession = await AsyncStorage.getItem(KEYS.LAST_SESSION);

    if (token && userId) {
      if (securityService.isTokenExpired(token)) {
        const refreshed = await securityService.refreshAuthToken();
        if (!refreshed) return { canRestore: false, reason: 'token_expired' };
      }
      try {
        const data = await apiGet(`/api/auth/verify-token?user_id=${userId}`);
        if (data?.valid) {
          return { canRestore: true, token, user_id: userId, lastSessionId: lastSession || undefined };
        }
      } catch (e) {}
    }

    return { canRestore: false, reason: 'no_valid_session' };
  }

  async isDeviceTrusted(): Promise<boolean> {
    const trusted = await AsyncStorage.getItem(KEYS.DEVICE_TRUSTED);
    return trusted === 'true';
  }

  async trustDevice(): Promise<void> {
    await AsyncStorage.setItem(KEYS.DEVICE_TRUSTED, 'true');
  }

  async saveLastSession(sessionId: string): Promise<void> {
    await AsyncStorage.setItem(KEYS.LAST_SESSION, sessionId);
  }
}

export const authService = new AuthService();
