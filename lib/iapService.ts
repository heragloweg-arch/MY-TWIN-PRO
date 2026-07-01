/**
 * iapService.ts – SoulSync MyTwin AI
 * نظام الفوترة المتكامل مع expo-iap (SDK 52)
 */

import { Platform } from 'react-native';
import {
  fetchProducts,
  getAvailablePurchases,
  purchaseUpdatedListener,
  purchaseErrorListener,
  requestPurchase,
  finishTransaction,
  endConnection,
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
    // fetchProducts يقوم بالتهيئة تلقائياً في معظم إصدارات expo-iap
    try {
      await fetchProducts({ skus: ALL_SKUS });
    } catch (_) {
      // فشل صامت – قد لا تدعم بعض الإصدارات التهيئة بهذه الطريقة
    }

    _purchaseListener = purchaseUpdatedListener(async (purchase: any) => {
      if (!purchase) return;
      try {
        const productId = purchase?.productId || purchase?.transactionId || '';
        if (productId) {
          await finishTransaction({ purchase, isConsumable: false });
        }
        console.log('[IAP] ✅ Transaction finished:', productId);
      } catch (err) {
        console.warn('[IAP] finishTransaction error:', err);
      }
    });

    _errorListener = purchaseErrorListener((error: any) => {
      const code = error?.responseCode;
      if (code !== undefined && code !== 1) {
        console.error('[IAP] Purchase error:', code, error?.message);
      }
    });

    _isInitialized = true;
    console.log('[IAP] ✅ expo-iap initialized');
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
    const result = await fetchProducts({ skus: ALL_SKUS });
    
    // ✅ دفاعي: fetchProducts قد يعيد { products: [] } أو Product[] مباشرة
    if (Array.isArray(result)) {
      return result;
    }
    if (result && typeof result === 'object' && Array.isArray((result as any).products)) {
      return (result as any).products;
    }
    return [];
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

    // ✅ دفاعي: requestPurchase قد يقبل { productId } أو { sku } أو string
    let purchase: any;
    try {
      purchase = await requestPurchase({ productId } as any);
    } catch {
      try {
        purchase = await requestPurchase(productId as any);
      } catch {
        purchase = await (requestPurchase as any)({ sku: productId });
      }
    }

    if (!purchase) {
      return { success: false, message: 'No purchase returned' };
    }

    const token = (purchase as any).transactionId || 
                  (purchase as any).purchaseToken || 
                  (purchase as any).transactionReceipt || '';

    if (!token) {
      return { success: false, message: 'No purchase token' };
    }

    const result = await verifyWithServer(productId, token);
    if (result.success) {
      updateLocalTier(tier);
      try {
        const purchaseToFinish = Array.isArray(purchase) ? purchase[0] : purchase;
        await finishTransaction({ purchase: purchaseToFinish, isConsumable: false });
      } catch (_) {}
      return { success: true, tier: result.tier };
    }

    return { success: false, message: result.message ?? 'Verification failed' };

  } catch (err: any) {
    const code = err?.responseCode;
    if (code === 1) {
      return { success: false, message: 'cancelled' };
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
      const token = (purchase as any).transactionId || 
                    (purchase as any).purchaseToken || 
                    (purchase as any).transactionReceipt || '';
      const productId = (purchase as any).productId || (purchase as any).transactionId || '';

      if (!token || !productId) continue;

      const tier = Object.keys(PRODUCT_IDS).find(
        k => PRODUCT_IDS[k] === productId
      );
      if (!tier) continue;

      const result = await verifyWithServer(productId, token);
      if (result.success) {
        restoredTier = result.tier ?? tier;
        count++;
        try {
          await finishTransaction({ purchase, isConsumable: false });
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
    await endConnection();
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
