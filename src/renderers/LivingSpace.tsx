import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableWithoutFeedback } from 'react-native';
import { usePresence } from '../hooks/usePresence';
import { useBreathAnimation } from '../hooks/useBreathAnimation';
import { useEmotionalState } from '../hooks/useEmotionalState';
import { useBondLevel } from '../hooks/useBondLevel';
import { awakeningController, AwakeningState } from '../controllers/AwakeningController';
import { storeSyncBridge } from '../core/StoreSyncBridge';
import CosmicBackground from './zones/CosmicBackground';
import BreathingGlow from './zones/BreathingGlow';
import PresenceBubble from './zones/PresenceBubble';
import LivingAvatar from './zones/LivingAvatar';
import { sendMessage } from '../services/twinApi';

export default function LivingSpace() {
  // ═══════════════════════════════════════
  // Hooks — قراءة حية من جميع المحركات
  // ═══════════════════════════════════════
  const presence = usePresence();
  const breath = useBreathAnimation();
  const emotion = useEmotionalState();
  const bond = useBondLevel();

  // ═══════════════════════════════════════
  // Awakening State
  // ═══════════════════════════════════════
  const [awakening, setAwakening] = useState<AwakeningState>({
    phase: 'presence',
    isComplete: false,
    firstWord: '',
    showInput: false,
    breathVisible: false,
    avatarVisible: false,
    eyesOpen: false,
  });

  // ═══════════════════════════════════════
  // Conversation State
  // ═══════════════════════════════════════
  const [inputText, setInputText] = useState('');
  const [messages, setMessages] = useState<Array<{ id: string; sender: 'user' | 'twin'; text: string }>>([]);
  const [isThinking, setIsThinking] = useState(false);

  // ═══════════════════════════════════════
  // Init
  // ═══════════════════════════════════════
  useEffect(() => {
    // تفعيل جسر المزامنة
    storeSyncBridge.activate();
    storeSyncBridge.syncNow();

    // بدء طقس الاستقبال
    awakeningController.start(setAwakening);

    return () => {
      awakeningController.stop();
      storeSyncBridge.deactivate();
    };
  }, []);

  // ═══════════════════════════════════════
  // Handlers
  // ═══════════════════════════════════════
  const handleFirstInteraction = useCallback(() => {
    awakeningController.onUserFirstInteraction();
  }, []);

  const handleSend = useCallback(async () => {
    if (!inputText.trim()) return;
    const text = inputText.trim();
    setInputText('');
    setMessages(prev => [...prev, { id: Date.now().toString(), sender: 'user', text }]);
    setIsThinking(true);

    try {
      const res = await sendMessage(text);
      const reply = res?.reply || res?.response || 'أنا هنا.';
      setMessages(prev => [...prev, { id: (Date.now() + 1).toString(), sender: 'twin', text: reply }]);
    } catch {
      setMessages(prev => [...prev, { id: (Date.now() + 1).toString(), sender: 'twin', text: 'أحتاج لحظة...' }]);
    } finally {
      setIsThinking(false);
    }
  }, [inputText]);

  // ═══════════════════════════════════════
  // Render
  // ═══════════════════════════════════════
  return (
    <TouchableWithoutFeedback onPress={handleFirstInteraction}>
      <View style={styles.container}>
        {/* Zone 1: Ambient */}
        <CosmicBackground
          breathPhase={breath.phase}
          spaceEnergy={presence.isActive ? 'warm' : 'tranquil'}
        />

        {/* Zone 2: Twin Presence */}
        {awakening.breathVisible && (
          <View style={styles.presenceContainer}>
            <BreathingGlow breathPhase={breath.phase} intensity={breath.intensity} />
            <PresenceBubble breathPhase={breath.phase} presenceLevel={presence.presenceLevel} />
            <LivingAvatar
              breathPhase={breath.phase}
              eyesOpen={awakening.eyesOpen}
              expression={emotion.valence === 'positive' ? 'warm' : 'neutral'}
              presenceLevel={presence.presenceLevel}
              emotionalValence={emotion.valence}
              bondLevel={bond.bondLevel}
            />
          </View>
        )}

        {/* Zone 3: First Contact & Conversation */}
        <View style={styles.conversationContainer}>
          {awakening.firstWord !== '' && !awakening.showInput && (
            <Text style={styles.firstWord}>{awakening.firstWord}</Text>
          )}

          {messages.map(msg => (
            <Text
              key={msg.id}
              style={msg.sender === 'user' ? styles.userMessage : styles.twinMessage}
            >
              {msg.text}
            </Text>
          ))}

          {isThinking && (
            <Text style={styles.thinking}>يفكر...</Text>
          )}
        </View>

        {/* Input */}
        {awakening.showInput && (
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              value={inputText}
              onChangeText={setInputText}
              onSubmitEditing={handleSend}
              placeholder="اكتب رسالتك الأولى..."
              placeholderTextColor="#6B5B8A"
            />
          </View>
        )}
      </View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#050510' },
  presenceContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  conversationContainer: { position: 'absolute', bottom: 160, left: 24, right: 24, alignItems: 'center' },
  firstWord: { color: '#E8E0F0', fontSize: 28, fontWeight: '300', textAlign: 'center' },
  userMessage: { color: '#B8B0C8', fontSize: 18, textAlign: 'right', alignSelf: 'flex-end', marginVertical: 4 },
  twinMessage: { color: '#E8E0F0', fontSize: 20, textAlign: 'left', alignSelf: 'flex-start', marginVertical: 4 },
  thinking: { color: '#6B5B8A', fontSize: 16, fontStyle: 'italic', marginVertical: 8 },
  inputContainer: { position: 'absolute', bottom: 60, left: 24, right: 24, padding: 16, backgroundColor: 'rgba(30,20,50,0.9)', borderRadius: 16 },
  input: { color: '#E8E0F0', fontSize: 18, textAlign: 'right' },
});
