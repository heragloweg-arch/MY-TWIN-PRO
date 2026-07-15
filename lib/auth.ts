import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiPost, setToken } from './httpClient';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';

WebBrowser.maybeCompleteAuthSession();

const TOKEN_KEY = 'mytwin-token';
const USER_KEY = 'mytwin-user';

export async function saveAuthData(token: string, userId: string): Promise<void> {
  await AsyncStorage.setItem(TOKEN_KEY, token);
  await AsyncStorage.setItem(USER_KEY, userId);
  await setToken(token);
}

export async function getToken(): Promise<string | null> {
  return await AsyncStorage.getItem(TOKEN_KEY);
}

export async function getUserId(): Promise<string | null> {
  return await AsyncStorage.getItem(USER_KEY);
}

export async function removeToken(): Promise<void> {
  await AsyncStorage.multiRemove([TOKEN_KEY, USER_KEY]);
}

export async function login(email: string, password: string): Promise<any> {
  const data = await apiPost('/api/auth/login', { email: email.trim(), password });
  if (data?.token && data?.user_id) {
    await saveAuthData(data.token, data.user_id);
  }
  return data;
}

export async function signup(email: string, password: string, twinName: string, lang: string = 'ar'): Promise<any> {
  const data = await apiPost('/api/auth/signup', {
    email: email.trim(),
    password,
    twin_name: twinName,
    lang,
  });
  if (data?.token && data?.user_id) {
    await saveAuthData(data.token, data.user_id);
  }
  return data;
}

// ✅ تسجيل الدخول عبر Google باستخدام expo-auth-session
export async function googleLogin(lang: string = 'ar'): Promise<any> {
  try {
    const [request, response, promptAsync] = Google.useAuthRequest({
      androidClientId: 'YOUR_ANDROID_CLIENT_ID.apps.googleusercontent.com',
      iosClientId: 'YOUR_IOS_CLIENT_ID.apps.googleusercontent.com',
      webClientId: 'YOUR_WEB_CLIENT_ID.apps.googleusercontent.com',
    });

    const result = await promptAsync();
    
    if (result?.type === 'success' && result.authentication?.accessToken) {
      const accessToken = result.authentication.accessToken;
      
      // إرسال التوكن إلى الخادم الخلفي للتحقق منه وإنشاء/استرجاع المستخدم
      const data = await apiPost('/api/auth/google', {
        access_token: accessToken,
        lang,
      });
      
      if (data?.token && data?.user_id) {
        await saveAuthData(data.token, data.user_id);
        return { token: data.token, user_id: data.user_id, onboarded: data.onboarded || false };
      }
      throw new Error('Google authentication failed on server');
    }
    
    throw new Error('Google sign-in was cancelled or failed');
  } catch (e: any) {
    console.error('[GoogleLogin] Error:', e);
    throw e;
  }
}

export async function logout(): Promise<void> {
  await removeToken();
}

export async function isAuthenticated(): Promise<boolean> {
  const token = await getToken();
  return !!token;
}
