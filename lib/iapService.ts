/**
 * iapService.ts – SoulSync MyTwin AI
 * نظام الفوترة المتكامل مع expo-iap@4.2.8 (SDK 52)
 */

import { Platform } from 'react-native';
import {
  fetchProducts,
  getAvailablePurchases,
  purchaseUpdatedListener,
  purchaseErrorListener,
  finishTransaction,
  emitter,
  OpenIapEvent,
} from 'expo-iap';
import { apiPost, apiGet } from './httpClient';

// ================================================================
// معرفات المنتجات – يجب أن تطابق Google Play Console بالضبط
// ================================================================
export const PRODUCT_IDS: Record<string, string> = {
  plus:    'mytwin_plus_monthly',
  premium: 'mytwin_premium_monthly',
  pro:     'mytwin_pro_semiannual',
  yearly:  'mytwin_yearly_annual',
};

export const ALL_SKUS = Object.values(PRODUCT_IDS);

// ================================================================
// الحالة الداخلية
// ================================================================
let _isInitialized  = false;
let _purchaseListener: { remove: () => void } | null = null;
let _errorListener:   { remove: () => void } | null = null;

// ================================================================
// تهيئة IAP
// ================================================================
export async function initializeIAP(): Promise<boolean> {
  if (Platform.OS !== 'android') return false;
  if (_isInitialized) return true;

  try {
    // مستمع المشتريات الناجحة
    _purchaseListener = purchaseUpdatedListener(async (purchase: any) => {
      if (!purchase) return;
      const token = purchase.purchaseToken || purchase.transactionReceipt;
      if (!token) return;
      try {
        await finishTransaction({ purchase, isConsumable: false });
        console.log('[IAP] ✅ Transaction finished:', purchase.productId);
      } catch (err) {
        console.warn('[IAP] finishTransaction error:', err);
      }
    });

    // مستمع الأخطاء
    _errorListener = purchaseErrorListener((error: any) => {
      const code = error?.code || error?.errorCode || '';
      if (code !== 'E_USER_CANCELLED' && code !== 'USER_CANCELED') {
        console.error('[IAP] Purchase error:', code, error?.message);
      }
    });

    _isInitialized = true;
    console.log('[IAP] ✅ expo-iap@4.2.8 initialized');
    return true;
  } catch (err) {
    console.error('[IAP] initializeIAP failed:', err);
    return false;
  }
}

// ================================================================
// تحميل الاشتراكات من Google Play
// ================================================================
export async function loadSubscriptionProducts(): Promise<any[]> {
  if (Platform.OS !== 'android') return [];
  try {
    await ensureInitialized();
    const products = await fetchProducts({ skus: ALL_SKUS, type: 'subs' });
    console.log('[IAP] Products loaded:', products?.length ?? 0);
    return products ?? [];
  } catch (err) {
    console.warn('[IAP] loadSubscriptionProducts failed:', err);
    return [];
  }
}

// ================================================================
// شراء اشتراك
// ================================================================
export async function purchaseSubscription(
  tier: string,
  userId: string,
): Promise<{ success: boolean; tier?: string; message?: string }> {
  if (Platform.OS !== 'android') {
    return { success: false, message: 'Android only' };
  }

  const productId = PRODUCT_IDS[tier];
  if (!productId) {
    return { success: false, message: `Invalid tier: ${tier}` };
  }

  try {
    await ensureInitialized();
    console.log('[IAP] Starting purchase:', productId);

    // فتح نافذة Google Play
    const purchase = await new Promise<any>((resolve, reject) => {
      // مستمع مؤقت للشراء الحالي
      const listener = purchaseUpdatedListener((p: any) => {
        if (p?.productId === productId) {
          listener.remove();
          resolve(p);
        }
      });

      const errListener = purchaseErrorListener((err: any) => {
        errListener.remove();
        listener.remove();
        reject(err);
      });

      // طلب الشراء عبر Native Module
      try {
        const { getNativeModule } = require('expo-iap');
        const native = getNativeModule();
        native?.requestSubscription?.({ sku: productId })
          ?? native?.buySubscription?.({ sku: productId });
      } catch (e) {
        errListener.remove();
        listener.remove();
        reject(e);
      }

      // timeout 5 دقائق
      setTimeout(() => {
        listener.remove();
        errListener.remove();
        reject(new Error('TIMEOUT'));
      }, 300000);
    });

    if (!purchase) {
      return { success: false, message: 'No purchase returned' };
    }

    const token = purchase.purchaseToken || purchase.transactionReceipt;
    if (!token) {
      return { success: false, message: 'No purchase token' };
    }

    // التحقق عبر الخادم
    const result = await verifyWithServer(productId, token);
    if (result.success) {
      updateLocalTier(tier);
      try {
        await finishTransaction({ purchase, isConsumable: false });
      } catch (_) {}
      return { success: true, tier: result.tier };
    }

    return { success: false, message: result.message ?? 'Verification failed' };

  } catch (err: any) {
    const code = err?.code || err?.errorCode || err?.message || '';
    if (
      code.includes('USER_CANCELLED') ||
      code.includes('USER_CANCELED')  ||
      code === 'E_USER_CANCELLED'
    ) {
      return { success: false, message: 'cancelled' };
    }
    if (code === 'TIMEOUT') {
      return { success: false, message: 'timeout' };
    }
    console.error('[IAP] purchaseSubscription error:', err);
    return { success: false, message: err?.message ?? 'Purchase failed' };
  }
}

// ================================================================
// استعادة المشتريات
// ================================================================
export async function restorePurchases(
  userId: string,
): Promise<{ success: boolean; tier?: string; count: number }> {
  if (Platform.OS !== 'android') return { success: false, count: 0 };

  try {
    await ensureInitialized();
    const purchases = await getAvailablePurchases();

    if (!purchases || purchases.length === 0) {
      console.log('[IAP] No purchases to restore');
      return { success: false, count: 0 };
    }

    console.log('[IAP] Restoring', purchases.length, 'purchases');
    let restoredTier: string | undefined;
    let count = 0;

    for (const purchase of purchases) {
      const token = (purchase as any).purchaseToken
        || (purchase as any).transactionReceipt;
      if (!token) continue;

      const productId = (purchase as any).productId
        || (purchase as any).transactionId;
      if (!productId) continue;

      const tier = Object.keys(PRODUCT_IDS).find(
        k => PRODUCT_IDS[k] === productId
      );
      if (!tier) continue;

      const result = await verifyWithServer(productId, token);
      if (result.success) {
        restoredTier = result.tier ?? tier;
        count++;
        try {
          await finishTransaction({ purchase: purchase as any, isConsumable: false });
        } catch (_) {}
      }
    }

    if (restoredTier) updateLocalTier(restoredTier);
    return { success: count > 0, tier: restoredTier, count };

  } catch (err) {
    console.error('[IAP] restorePurchases failed:', err);
    return { success: false, count: 0 };
  }
}

// ================================================================
// التحقق من حالة الاشتراك عبر الخادم
// ================================================================
export async function validateSubscriptionStatus(): Promise<{
  tier: string;
  isActive: boolean;
  expiresAt?: string;
}> {
  try {
    const result = await apiGet('/api/billing/status');
    if (result?.tier) {
      updateLocalTier(result.tier);
      return {
        tier:      result.tier,
        isActive:  result.is_active ?? true,
        expiresAt: result.expires_at,
      };
    }
  } catch (err) {
    console.warn('[IAP] validateSubscriptionStatus failed:', err);
  }
  return { tier: 'free', isActive: false };
}

// ================================================================
// إنهاء الاتصال
// ================================================================
export async function disconnectIAP(): Promise<void> {
  try {
    _purchaseListener?.remove();
    _errorListener?.remove();
    _purchaseListener = null;
    _errorListener   = null;
    _isInitialized   = false;
    console.log('[IAP] Disconnected');
  } catch (err) {
    console.warn('[IAP] disconnectIAP error:', err);
  }
}

// ================================================================
// دوال مساعدة داخلية
// ================================================================
async function ensureInitialized(): Promise<void> {
  if (!_isInitialized) {
    const ok = await initializeIAP();
    if (!ok) throw new Error('expo-iap not initialized');
  }
}

async function verifyWithServer(
  productId: string,
  purchaseToken: string,
): Promise<{ success: boolean; tier?: string; message?: string }> {
  try {
    const res = await apiPost('/api/billing/verify', {
      product_id:     productId,
      purchase_token: purchaseToken,
    });
    if (res?.success) return { success: true, tier: res.tier };
    return { success: false, message: res?.message ?? 'Verification failed' };
  } catch (err: any) {
    console.error('[IAP] verifyWithServer error:', err);
    return { success: false, message: err?.message ?? 'Network error' };
  }
}

function updateLocalTier(tier: string): void {
  try {
    const { useTwinStore } = require('../store/useTwinStore');
    useTwinStore.getState().setTier(tier as any);
    console.log('[IAP] Tier updated:', tier);
  } catch (err) {
    console.warn('[IAP] updateLocalTier failed:', err);
  }
}
