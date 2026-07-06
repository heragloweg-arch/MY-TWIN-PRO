import * as Speech from 'expo-speech';
import { Audio } from 'expo-av';
import { Platform } from 'react-native';
import { useTwinStore } from '../store/useTwinStore';
import { apiPost } from '../lib/httpClient';

export type TwinGender = 'male' | 'female';
export type EmotionTone = 'neutral' | 'happy' | 'sad' | 'excited' | 'calm' | 'serious';

// ============================================================
// إعدادات الصوت حسب الجنس واللغة
// ============================================================

const IOS_VOICES: Record<TwinGender, string> = {
  male: 'com.apple.ttsbundle.Maged-compact',
  female: 'com.apple.ttsbundle.Laila-compact',
};

const ANDROID_VOICES: Record<string, Record<TwinGender, string>> = {
  ar: { male: 'ar-xa-x-ard-local', female: 'ar-xa-x-arc-local' },
  en: { male: 'en-US-language', female: 'en-US-language' },
};

const EDGE_VOICES: Record<string, Record<TwinGender, string>> = {
  ar: { male: 'ar-EG-ShakirNeural', female: 'ar-SA-ZariyahNeural' },
  en: { male: 'en-US-GuyNeural', female: 'en-US-JennyNeural' },
};

// ============================================================
// Queue System
// ============================================================

let _speakingQueue: Array<{ text: string; resolve: (value?: unknown) => void }> = [];
let _isProcessingQueue = false;
let _currentSound: Audio.Sound | null = null;

function stripMarkdown(text: string): string {
  return text
    .replace(/```[\s\S]*?```/g, '')
    .replace(/`[^`]*`/g, '')
    .replace(/[#*_~>{}\[\]|]/g, '')
    .replace(/\n{2,}/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// ============================================================
// TTS عبر Edge TTS (Backend)
// ============================================================

async function speakViaEdgeTTS(text: string, gender: TwinGender, lang: string): Promise<boolean> {
  try {
    const voice = EDGE_VOICES[lang]?.[gender] || EDGE_VOICES['ar']?.[gender] || 'ar-EG-ShakirNeural';
    const response = await apiPost('/api/tts', {
      text: text.slice(0, 800),
      voice_id: voice,
      language: lang,
    });

    if (response?.audio_base64) {
      const FileSystem = require('expo-file-system');
      const path = FileSystem.cacheDirectory + `tts_edge_${Date.now()}.mp3`;
      await FileSystem.writeAsStringAsync(path, response.audio_base64, {
        encoding: FileSystem.EncodingType.Base64,
      });

      // تنظيف الصوت السابق
      if (_currentSound) {
        try { await _currentSound.unloadAsync(); } catch {}
        _currentSound = null;
      }

      const { sound } = await Audio.Sound.createAsync(
        { uri: path },
        { shouldPlay: true }
      );
      _currentSound = sound;

      await new Promise<void>((resolve) => {
        sound.setOnPlaybackStatusUpdate((status: any) => {
          if (status.didJustFinish) {
            sound.unloadAsync().catch(() => {});
            _currentSound = null;
            resolve();
          }
        });
        // Timeout safety
        setTimeout(() => {
          if (_currentSound === sound) {
            sound.unloadAsync().catch(() => {});
            _currentSound = null;
            resolve();
          }
        }, 30000);
      });

      // حذف الملف المؤقت
      try { await FileSystem.deleteAsync(path, { idempotent: true }); } catch {}

      return true;
    }
  } catch (e) {
    console.log('Edge TTS failed, falling back:', e);
  }
  return false;
}

// ============================================================
// ElevenLabs (Premium fallback)
// ============================================================

async function speakViaElevenLabs(text: string, gender: string): Promise<boolean> {
  try {
    const response = await apiPost('/api/tts/elevenlabs', {
      text: text.slice(0, 800),
      voice_gender: gender,
      premium: true,
    });
    if (response?.audio_base64) {
      const FileSystem = require('expo-file-system');
      const path = FileSystem.cacheDirectory + `tts_11l_${Date.now()}.mp3`;
      await FileSystem.writeAsStringAsync(path, response.audio_base64, {
        encoding: FileSystem.EncodingType.Base64,
      });

      if (_currentSound) {
        try { await _currentSound.unloadAsync(); } catch {}
        _currentSound = null;
      }

      const { sound } = await Audio.Sound.createAsync(
        { uri: path },
        { shouldPlay: true }
      );
      _currentSound = sound;

      await new Promise<void>((resolve) => {
        sound.setOnPlaybackStatusUpdate((status: any) => {
          if (status.didJustFinish) {
            sound.unloadAsync().catch(() => {});
            _currentSound = null;
            resolve();
          }
        });
        setTimeout(() => {
          if (_currentSound === sound) {
            sound.unloadAsync().catch(() => {});
            _currentSound = null;
            resolve();
          }
        }, 30000);
      });

      try { await FileSystem.deleteAsync(path, { idempotent: true }); } catch {}
      return true;
    }
  } catch (e) {
    console.log('ElevenLabs failed:', e);
  }
  return false;
}

// ============================================================
// Native TTS Fallback (Expo Speech)
// ============================================================

function speakViaNative(text: string, gender: TwinGender, lang: string): Promise<void> {
  return new Promise((resolve) => {
    Speech.stop();
    const opts: Speech.SpeechOptions = {
      language: lang === 'ar' ? 'ar-SA' : 'en-US',
      pitch: gender === 'female' ? 1.22 : 0.88,
      rate: 0.95,
      onDone: () => resolve(),
      onError: () => resolve(),
      onStopped: () => resolve(),
    };

    if (Platform.OS === 'ios' && IOS_VOICES[gender]) {
      opts.voice = IOS_VOICES[gender];
    }

    Speech.speak(text, opts);

    // Safety timeout
    setTimeout(() => resolve(), 60000);
  });
}

// ============================================================
// Main API — speakResponse
// ============================================================

export async function speakResponse(
  text: string,
  options?: {
    emotion?: EmotionTone;
    onStart?: () => void;
    onDone?: () => void;
    forceNative?: boolean;
  }
): Promise<void> {
  const clean = stripMarkdown(text).slice(0, 800);
  if (!clean.trim()) {
    options?.onDone?.();
    return;
  }

  const store = useTwinStore.getState();
  const gender: TwinGender = store.twinGender === 'male' ? 'male' : 'female';
  const lang = store.lang || 'ar';

  return new Promise((resolve) => {
    _speakingQueue.push({ text: clean, resolve });
    if (!_isProcessingQueue) processQueue(gender, lang);
    options?.onStart?.();
  }).then(() => {
    options?.onDone?.();
  });
}

async function processQueue(gender: TwinGender, lang: string): Promise<void> {
  if (_speakingQueue.length === 0) {
    _isProcessingQueue = false;
    return;
  }
  _isProcessingQueue = true;
  const { text, resolve } = _speakingQueue.shift()!;

  let success = false;

  try {
    // محاولة Edge TTS أولاً
    success = await speakViaEdgeTTS(text, gender, lang);
    if (!success) {
      // ثم ElevenLabs
      success = await speakViaElevenLabs(text, gender);
    }
    if (!success) {
      // أخيراً Native TTS
      await speakViaNative(text, gender, lang);
    }
  } catch (e) {
    console.error('All TTS methods failed:', e);
    // محاولة أخيرة
    try { await speakViaNative(text, gender, lang); } catch {}
  }

  resolve();
  processQueue(gender, lang);
}

// ============================================================
// Control APIs
// ============================================================

export async function stopSpeaking(): Promise<void> {
  try {
    await Speech.stop();
    if (_currentSound) {
      await _currentSound.stopAsync();
      await _currentSound.unloadAsync();
      _currentSound = null;
    }
  } catch {}
}

export async function isSpeaking(): Promise<boolean> {
  try {
    const nativeSpeaking = await Speech.isSpeakingAsync();
    return nativeSpeaking || _isProcessingQueue;
  } catch {
    return _isProcessingQueue;
  }
}

export async function pauseSpeaking(): Promise<void> {
  try {
    if (_currentSound) {
      await _currentSound.pauseAsync();
    }
  } catch {}
}

export async function resumeSpeaking(): Promise<void> {
  try {
    if (_currentSound) {
      await _currentSound.playAsync();
    }
  } catch {}
}

// ============================================================
// Preview Voice (لشاشة Museum)
// ============================================================

export async function previewVoice(
  text: string,
  options?: { gender?: TwinGender; lang?: string; voicePersonality?: string }
): Promise<boolean> {
  const clean = stripMarkdown(text).slice(0, 200);
  if (!clean.trim()) return false;

  const store = useTwinStore.getState();
  const gender = options?.gender || (store.twinGender === 'male' ? 'male' : 'female');
  const lang = options?.lang || store.lang || 'ar';

  // استخدام Edge TTS مباشرة للمعاينة
  return await speakViaEdgeTTS(clean, gender, lang);
}

console.log("✅ Voice Engine initialized");
