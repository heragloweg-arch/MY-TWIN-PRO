import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  ActivityIndicator, StyleSheet, Animated, RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTwinStore } from '../../store/useTwinStore';
import { useTheme } from '../../utils/theme';
import { router } from 'expo-router';
import { apiPost, apiGet } from '../../lib/httpClient';
import {
  ArrowLeft, CheckSquare, Plus, Zap, BatteryCharging, Clock,
  Target, Cloud, Sun, Activity, Check, Trash2, RefreshCw,
} from 'lucide-react-native';

const T = {
  ar: {
    title: 'مدير الحياة', greeting: 'يومك اليوم', tasks: 'المهام',
    habits: 'العادات', weather: 'الطقس', suggestions: 'اقتراحات',
    newTask: 'مهمة جديدة', placeholder: 'اكتب مهمتك...',
    add: 'إضافة', loading: 'جاري التحميل...', noTasks: 'لا توجد مهام',
    complete: 'إنجاز', delete: 'حذف',
  },
  en: {
    title: 'Life OS', greeting: 'Your Day', tasks: 'Tasks',
    habits: 'Habits', weather: 'Weather', suggestions: 'Suggestions',
    newTask: 'New Task', placeholder: 'Write your task...',
    add: 'Add', loading: 'Loading...', noTasks: 'No tasks',
    complete: 'Done', delete: 'Delete',
  },
};

export default function TaskManager() {
  const insets = useSafeAreaInsets();
  const { lang, userId, hasHydrated } = useTwinStore();
  const isAr = lang === 'ar';
  const isDark = useTheme().isDark;
  const t = T[lang] || T['ar'];

  const [dashboard, setDashboard] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const colors = useMemo(() => ({
    bg: isDark ? '#0A0014' : '#FAFAF8', card: isDark ? '#1A1226' : '#FFFFFF',
    text: isDark ? '#FFFFFF' : '#2D2D2D', subtext: isDark ? '#A78BFA' : '#6B7280',
    accent: '#10B981', accentLight: '#10B98120', border: isDark ? '#2D1B4D' : '#E8E8E3',
    inputBg: isDark ? '#161122' : '#FDFDF9', success: '#10B981', warning: '#F59E0B',
    danger: '#EF4444',
  }), [isDark]);

  const fetchDashboard = async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const res = await apiGet(`/api/pass/dashboard?user_id=${userId}`);
      setDashboard(res);
      Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }).start();
    } catch (e) {}
    setLoading(false);
    setRefreshing(false);
  };

  useEffect(() => { if (hasHydrated) fetchDashboard(); }, [hasHydrated]);

  const handleAddTask = async () => {
    if (!newTaskTitle.trim()) return;
    await apiPost('/api/pass/tasks/create', { user_id: userId, title: newTaskTitle.trim() });
    setNewTaskTitle('');
    fetchDashboard();
  };

  const handleComplete = async (taskId: string) => {
    await apiPost(`/api/pass/tasks/complete?user_id=${userId}&task_id=${taskId}`);
    fetchDashboard();
  };

  const handleDelete = async (taskId: string) => {
    await apiGet(`/api/pass/tasks/${taskId}?user_id=${userId}`);
    fetchDashboard();
  };

  if (!hasHydrated || loading) {
    return (
      <View style={[st.root, { paddingTop: insets.top, backgroundColor: colors.bg, justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={colors.accent} />
        <Text style={{ color: colors.subtext, marginTop: 12 }}>{t.loading}</Text>
      </View>
    );
  }

  return (
    <View style={[st.root, { paddingTop: insets.top, backgroundColor: colors.bg }]}>
      <View style={[st.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()}><ArrowLeft size={24} stroke={colors.text} /></TouchableOpacity>
        <Text style={[st.headerTitle, { color: colors.text }]}>{t.title}</Text>
        <TouchableOpacity onPress={fetchDashboard}><RefreshCw size={20} stroke={colors.subtext} /></TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={st.content} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchDashboard(); }} />}>
        <Animated.View style={{ opacity: fadeAnim }}>
          
          {/* الترحيب */}
          <Text style={[st.greeting, { color: colors.text }]}>{dashboard?.daily_plan?.greeting || t.greeting}</Text>

          {/* البطاقات العلوية */}
          <View style={st.topCards}>
            <View style={[st.topCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <BatteryCharging size={22} stroke={colors.warning} />
              <Text style={[st.topValue, { color: colors.text }]}>{dashboard?.daily_plan?.energy || 60}%</Text>
              <Text style={[st.topLabel, { color: colors.subtext }]}>طاقة</Text>
            </View>
            <View style={[st.topCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Sun size={22} stroke={colors.warning} />
              <Text style={[st.topValue, { color: colors.text }]}>{dashboard?.weather?.temperature || '—'}°</Text>
              <Text style={[st.topLabel, { color: colors.subtext }]}>{t.weather}</Text>
            </View>
            <View style={[st.topCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Target size={22} stroke={colors.success} />
              <Text style={[st.topValue, { color: colors.text }]}>{dashboard?.tasks?.filter((t: any) => t.status === 'completed').length || 0}/{dashboard?.tasks?.length || 0}</Text>
              <Text style={[st.topLabel, { color: colors.subtext }]}>{t.tasks}</Text>
            </View>
          </View>

          {/* اقتراحات */}
          {dashboard?.suggestions?.length > 0 && (
            <View style={[st.suggestionsCard, { backgroundColor: colors.accentLight }]}>
              <Zap size={16} stroke={colors.accent} />
              <Text style={[st.suggestionText, { color: colors.accent }]}>{dashboard.suggestions[0]}</Text>
            </View>
          )}

          {/* إضافة مهمة */}
          <View style={[st.addCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <TextInput
              style={[st.input, { backgroundColor: colors.inputBg, color: colors.text }]}
              placeholder={t.placeholder}
              placeholderTextColor={colors.subtext}
              value={newTaskTitle}
              onChangeText={setNewTaskTitle}
              onSubmitEditing={handleAddTask}
            />
            <TouchableOpacity style={[st.addBtn, { backgroundColor: colors.accent }]} onPress={handleAddTask}>
              <Plus size={20} stroke="#FFF" />
              <Text style={st.addBtnText}>{t.add}</Text>
            </TouchableOpacity>
          </View>

          {/* قائمة المهام */}
          <Text style={[st.sectionTitle, { color: colors.text }]}>{t.tasks}</Text>
          {dashboard?.tasks?.length > 0 ? dashboard.tasks.map((task: any) => (
            <View key={task.id} style={[st.taskCard, { backgroundColor: colors.card, borderColor: colors.border, opacity: task.status === 'completed' ? 0.5 : 1 }]}>
              <View style={st.taskInfo}>
                <CheckSquare size={18} stroke={task.status === 'completed' ? colors.success : colors.subtext} />
                <Text style={[st.taskTitle, { color: colors.text, textDecorationLine: task.status === 'completed' ? 'line-through' : 'none' }]}>{task.title}</Text>
              </View>
              <View style={st.taskActions}>
                {task.status !== 'completed' && (
                  <TouchableOpacity onPress={() => handleComplete(task.id)} style={[st.taskBtn, { backgroundColor: colors.success + '20' }]}>
                    <Check size={16} stroke={colors.success} />
                  </TouchableOpacity>
                )}
                <TouchableOpacity onPress={() => handleDelete(task.id)} style={[st.taskBtn, { backgroundColor: colors.danger + '20' }]}>
                  <Trash2 size={16} stroke={colors.danger} />
                </TouchableOpacity>
              </View>
            </View>
          )) : (
            <Text style={[st.emptyText, { color: colors.subtext }]}>{t.noTasks}</Text>
          )}

        </Animated.View>
      </ScrollView>
    </View>
  );
}

const st = StyleSheet.create({
  root: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 0.5 },
  headerTitle: { fontSize: 18, fontWeight: '700' },
  content: { padding: 16, paddingBottom: 60 },
  greeting: { fontSize: 22, fontWeight: '800', marginBottom: 16 },
  topCards: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  topCard: { flex: 1, borderRadius: 16, borderWidth: 1, padding: 12, alignItems: 'center', gap: 4 },
  topValue: { fontSize: 18, fontWeight: '800' },
  topLabel: { fontSize: 11, fontWeight: '600' },
  suggestionsCard: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 12, borderRadius: 14, marginBottom: 16 },
  suggestionText: { flex: 1, fontSize: 13, fontWeight: '600' },
  addCard: { flexDirection: 'row', gap: 10, padding: 12, borderRadius: 16, borderWidth: 1, marginBottom: 20 },
  input: { flex: 1, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10, fontSize: 15 },
  addBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 16, borderRadius: 12 },
  addBtnText: { color: '#FFF', fontWeight: '700' },
  sectionTitle: { fontSize: 17, fontWeight: '700', marginBottom: 12 },
  taskCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 14, borderRadius: 14, borderWidth: 1, marginBottom: 8 },
  taskInfo: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  taskTitle: { fontSize: 15, fontWeight: '500' },
  taskActions: { flexDirection: 'row', gap: 8 },
  taskBtn: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  emptyText: { textAlign: 'center', marginTop: 20, fontSize: 14 },
});
