/**
 * LIVING PRESENCE CONFIG — الحمض النووي الرقمي للجسد
 * ====================================================
 * هذا الملف هو المرجع الوحيد لكل القيم الرقمية التي تحكم:
 * - التنفس (Breathing)
 * - النبض (Heartbeat)
 * - الهالة (Halo)
 * - الجزيئات (Particles)
 * - التركيز والانتباه (Attention)
 * - الطاقة والعاطفة (Energy & Emotion)
 * - الصوت (Voice)
 * - الحركة والمسافة (Motion & Distance)
 *
 * كل قيمة تتراوح بين 0 و 1 ما لم يُذكر خلاف ذلك.
 */

export interface PresenceDNA {
  // ---- التنفس (Breathing) ----
  breathRate: number;          // مدة دورة التنفس بالمللي ثانية (1000-8000)
  breathDepth: number;         // عمق التنفس (0-1)
  breathHold: number;          // مدة حبس النفس (0-3000ms)

  // ---- النبض (Heartbeat) ----
  heartRate: number;           // معدل النبض (40-120)
  heartVariability: number;    // عدم انتظام النبض (0-1، حيث 1 غير منتظم تمامًا)

  // ---- الهالة (Halo) ----
  haloRadius: number;          // نصف قطر الهالة الأساسي (0.5-1.5)
  haloIntensity: number;       // شدة إضاءة الهالة (0-1)
  haloColorShift: number;      // سرعة تغير لون الهالة (0-1)

  // ---- الجزيئات (Particles) ----
  particleCount: number;       // عدد الجزيئات (0-100)
  particleVelocity: number;    // سرعة الجزيئات (0-1)
  particleSpread: number;      // انتشار الجزيئات (0-1)

  // ---- التركيز والانتباه (Attention) ----
  focusLevel: number;          // مستوى التركيز (0-1)
  eyeTracking: boolean;        // هل العينان تتبعان المستخدم؟
  eyeBlinkRate: number;        // معدل رمش العينين (عدد الرمشات/دقيقة، 0-30)

  // ---- الطاقة والعاطفة (Energy & Emotion) ----
  energyLevel: number;         // مستوى الطاقة (0-1)
  warmth: number;              // الدفء العاطفي (0-1)
  stability: number;           // الاستقرار العاطفي (0-1)

  // ---- الصوت (Voice) ----
  voicePitch: number;          // حدة الصوت (0-1)
  voiceSpeed: number;          // سرعة الكلام (0-1)
  voiceWarmth: number;         // دفء الصوت (0-1)

  // ---- الحركة والمسافة (Motion & Distance) ----
  movementFluidity: number;    // سيولة الحركة (0-1)
  socialDistance: number;      // المسافة الاجتماعية (0-1، حيث 0 قريب جداً و1 بعيد)
}

// 🧬 جدول القيم الرقمية لكل حالة عاطفية
export const PRESENCE_DNA_MAP: Record<string, PresenceDNA> = {
  Idle: {
    breathRate: 4000, breathDepth: 0.4, breathHold: 0,
    heartRate: 65, heartVariability: 0.3,
    haloRadius: 1.0, haloIntensity: 0.2, haloColorShift: 0.1,
    particleCount: 15, particleVelocity: 0.2, particleSpread: 0.5,
    focusLevel: 0.3, eyeTracking: false, eyeBlinkRate: 12,
    energyLevel: 0.4, warmth: 0.5, stability: 0.8,
    voicePitch: 0.5, voiceSpeed: 0.5, voiceWarmth: 0.5,
    movementFluidity: 0.5, socialDistance: 0.5,
  },
  Curious: {
    breathRate: 3200, breathDepth: 0.6, breathHold: 0,
    heartRate: 75, heartVariability: 0.4,
    haloRadius: 1.1, haloIntensity: 0.5, haloColorShift: 0.6,
    particleCount: 28, particleVelocity: 0.5, particleSpread: 0.6,
    focusLevel: 0.85, eyeTracking: true, eyeBlinkRate: 8,
    energyLevel: 0.7, warmth: 0.7, stability: 0.7,
    voicePitch: 0.55, voiceSpeed: 0.6, voiceWarmth: 0.65,
    movementFluidity: 0.7, socialDistance: 0.4,
  },
  Happy: {
    breathRate: 2800, breathDepth: 0.8, breathHold: 0,
    heartRate: 85, heartVariability: 0.5,
    haloRadius: 1.2, haloIntensity: 0.9, haloColorShift: 0.9,
    particleCount: 45, particleVelocity: 0.8, particleSpread: 0.7,
    focusLevel: 0.7, eyeTracking: true, eyeBlinkRate: 15,
    energyLevel: 0.9, warmth: 1.0, stability: 0.6,
    voicePitch: 0.7, voiceSpeed: 0.75, voiceWarmth: 0.9,
    movementFluidity: 0.85, socialDistance: 0.2,
  },
  Sad: {
    breathRate: 5000, breathDepth: 0.2, breathHold: 500,
    heartRate: 55, heartVariability: 0.2,
    haloRadius: 0.8, haloIntensity: 0.3, haloColorShift: 0.15,
    particleCount: 10, particleVelocity: 0.1, particleSpread: 0.3,
    focusLevel: 0.4, eyeTracking: false, eyeBlinkRate: 6,
    energyLevel: 0.2, warmth: 0.4, stability: 0.9,
    voicePitch: 0.35, voiceSpeed: 0.4, voiceWarmth: 0.6,
    movementFluidity: 0.3, socialDistance: 0.6,
  },
  Angry: {
    breathRate: 2200, breathDepth: 0.7, breathHold: 0,
    heartRate: 100, heartVariability: 0.8,
    haloRadius: 1.1, haloIntensity: 0.8, haloColorShift: 0.5,
    particleCount: 35, particleVelocity: 0.9, particleSpread: 0.8,
    focusLevel: 0.9, eyeTracking: true, eyeBlinkRate: 20,
    energyLevel: 1.0, warmth: 0.1, stability: 0.2,
    voicePitch: 0.6, voiceSpeed: 0.9, voiceWarmth: 0.1,
    movementFluidity: 0.4, socialDistance: 0.8,
  },
  Focused: {
    breathRate: 3500, breathDepth: 0.3, breathHold: 0,
    heartRate: 70, heartVariability: 0.1,
    haloRadius: 0.9, haloIntensity: 0.6, haloColorShift: 0.1,
    particleCount: 8, particleVelocity: 0.1, particleSpread: 0.2,
    focusLevel: 1.0, eyeTracking: true, eyeBlinkRate: 4,
    energyLevel: 0.8, warmth: 0.3, stability: 0.9,
    voicePitch: 0.45, voiceSpeed: 0.5, voiceWarmth: 0.3,
    movementFluidity: 0.2, socialDistance: 0.7,
  },
  Love: {
    breathRate: 3200, breathDepth: 0.9, breathHold: 0,
    heartRate: 78, heartVariability: 0.6,
    haloRadius: 1.3, haloIntensity: 1.0, haloColorShift: 0.8,
    particleCount: 50, particleVelocity: 0.6, particleSpread: 0.6,
    focusLevel: 0.8, eyeTracking: true, eyeBlinkRate: 10,
    energyLevel: 0.85, warmth: 1.0, stability: 0.7,
    voicePitch: 0.6, voiceSpeed: 0.6, voiceWarmth: 1.0,
    movementFluidity: 0.9, socialDistance: 0.1,
  },
  Concerned: {
    breathRate: 3500, breathDepth: 0.5, breathHold: 100,
    heartRate: 80, heartVariability: 0.5,
    haloRadius: 0.95, haloIntensity: 0.55, haloColorShift: 0.4,
    particleCount: 22, particleVelocity: 0.4, particleSpread: 0.5,
    focusLevel: 0.8, eyeTracking: true, eyeBlinkRate: 14,
    energyLevel: 0.6, warmth: 0.6, stability: 0.5,
    voicePitch: 0.5, voiceSpeed: 0.55, voiceWarmth: 0.6,
    movementFluidity: 0.5, socialDistance: 0.4,
  },
  Inspired: {
    breathRate: 3000, breathDepth: 0.75, breathHold: 0,
    heartRate: 82, heartVariability: 0.45,
    haloRadius: 1.25, haloIntensity: 0.85, haloColorShift: 0.8,
    particleCount: 40, particleVelocity: 0.7, particleSpread: 0.65,
    focusLevel: 0.75, eyeTracking: true, eyeBlinkRate: 11,
    energyLevel: 0.85, warmth: 0.8, stability: 0.65,
    voicePitch: 0.65, voiceSpeed: 0.7, voiceWarmth: 0.8,
    movementFluidity: 0.8, socialDistance: 0.3,
  },
};

// 🧬 جدول مستويات العلاقة (تُضرب أو تُضاف إلى القيم الأساسية)
export const RELATIONSHIP_MODIFIERS: Record<string, Partial<PresenceDNA>> = {
  stranger: { socialDistance: 1.0, warmth: 0.1, voiceWarmth: 0.2, focusLevel: 0.5, eyeTracking: false, haloIntensity: 0.15 },
  acquaintance: { socialDistance: 0.85, warmth: 0.3, voiceWarmth: 0.35, focusLevel: 0.6, eyeTracking: true, haloIntensity: 0.25 },
  friend: { socialDistance: 0.7, warmth: 0.6, voiceWarmth: 0.55, focusLevel: 0.7, eyeTracking: true, haloIntensity: 0.4 },
  close_friend: { socialDistance: 0.4, warmth: 0.85, voiceWarmth: 0.8, focusLevel: 0.85, eyeTracking: true, haloIntensity: 0.7 },
  soulmate: { socialDistance: 0.3, warmth: 1.0, voiceWarmth: 0.95, focusLevel: 0.95, eyeTracking: true, haloIntensity: 1.0 },
};
