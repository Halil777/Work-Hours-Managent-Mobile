// src/screens/hours/DailyHoursScreen.tsx
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  FlatList,
  LayoutAnimation,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  UIManager,
  View,
} from 'react-native';
import { Calendar } from 'react-native-calendars';
import { fetchDaily } from '../../services/hours.service';

type DayItem = {
  id: string;
  date: string;        // "YYYY-MM-DD"
  start?: string;      // "HH:mm" (может отсутствовать)
  end?: string;        // "HH:mm" (может отсутствовать)
  breakMinutes?: number;
  note?: string | null;
};

const CARD_MIN_HEIGHT = 84;
const USE_NATIVE_DRIVER = Platform.OS !== 'web';

// Web üçin kölege (`shadow*` deprecated), native üçin köne shadow/elevation
const cardShadow = Platform.select({
  web: { boxShadow: '0 6px 16px rgba(0,0,0,0.08)' },
  default: { shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 8, elevation: 3 },
}) as any;
const cardShadowActive = Platform.select({
  web: { boxShadow: '0 10px 22px rgba(37,99,235,0.25)' },
  default: { elevation: 5, shadowOpacity: 0.14 },
}) as any;

export default function DailyHoursScreen() {
  // Android New Architecture-de no-op duýduryşyny aýyrmak üçin: Fabric bar bolsa çagyrylama
  useEffect(() => {
    const isFabric = !!(global as any).nativeFabricUIManager;
    if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental && !isFabric) {
      UIManager.setLayoutAnimationEnabledExperimental(true);
    }
  }, []);

  const monthISO = new Date().toISOString().slice(0, 7); // "YYYY-MM"
  const { data, isLoading, isError, refetch } = useQuery<DayItem[]>({
    queryKey: ['daily', monthISO],
    queryFn: () => fetchDaily(monthISO),
  });

  const [showCalendar, setShowCalendar] = useState(true);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  // date -> missingHours
  const [complaints, setComplaints] = useState<Record<string, number>>({});
  const hasComplaint = (date: string) => complaints[date] !== undefined;

  // kart içindäki şablon redaktory
  const [activeEditorDate, setActiveEditorDate] = useState<string | null>(null);
  const [editorValue, setEditorValue] = useState<string>('');

  // toast
  const [toast, setToast] = useState<string | null>(null);
  const toastAnim = useRef(new Animated.Value(0)).current;

  const listRef = useRef<FlatList<DayItem>>(null);

  const indexByDate = useMemo(() => {
    const map: Record<string, number> = {};
    (data ?? []).forEach((d, idx) => { map[d.date] = idx; });
    return map;
  }, [data]);

  useEffect(() => {
    if (data && data.length > 0) {
      const today = new Date().toISOString().slice(0, 10);
      if (indexByDate[today] !== undefined) setSelectedDate(today);
    }
  }, [data, indexByDate]);

  useEffect(() => {
    if (!selectedDate) return;
    const idx = indexByDate[selectedDate];
    if (idx !== undefined && listRef.current) {
      listRef.current.scrollToIndex({ index: idx, animated: true });
    }
  }, [selectedDate, indexByDate]);

  const markedDates = useMemo(() => {
    if (!data) return {};
    const md: any = {};
    data.forEach(d => {
      md[d.date] = {
        marked: true,
        dotColor: hasComplaint(d.date) ? '#ef4444' : '#2563eb',
        selected: selectedDate === d.date,
        selectedColor: hasComplaint(d.date) ? '#ef4444' : '#2563eb',
      };
    });
    return md;
  }, [data, selectedDate, complaints]);

  const toMinutes = (hhmm?: string) => {
    if (!hhmm) return undefined;
    const [h, m] = hhmm.split(':').map(Number);
    return h * 60 + m;
  };
  const workedMinutes = (item: DayItem) => {
    const s = toMinutes(item.start);
    const e = toMinutes(item.end);
    if (s === undefined || e === undefined) return undefined;
    const br = item.breakMinutes ?? 0;
    return Math.max(0, (e - s) - br);
  };
  const formatHM = (mins?: number) => {
    if (mins === undefined) return '—';
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return `${h} ч ${m} м`;
  };

  const showToast = (msg: string) => {
    setToast(msg);
    toastAnim.setValue(0);
    Animated.timing(toastAnim, { toValue: 1, duration: 200, useNativeDriver: USE_NATIVE_DRIVER }).start(() => {
      setTimeout(() => {
        Animated.timing(toastAnim, { toValue: 0, duration: 200, useNativeDriver: USE_NATIVE_DRIVER })
          .start(() => setToast(null));
      }, 1400);
    });
  };

  const toggleEditor = (date: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    if (activeEditorDate === date) {
      setActiveEditorDate(null);
      return;
    }
    const prev = complaints[date];
    setEditorValue(prev !== undefined ? String(prev) : '');
    setActiveEditorDate(date);
  };

  const submitEditor = (date: string) => {
    const normalized = editorValue.replace(/[^\d.,]/g, '').replace(',', '.');
    const num = Number(normalized);
    if (!normalized || Number.isNaN(num) || num <= 0) {
      showToast('Введите корректное число');
      return;
    }
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setComplaints(prev => ({ ...prev, [date]: num }));
    setActiveEditorDate(null);
    showToast('Отправлено успешно');
  };

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
        <Text style={styles.loadingText}>Загрузка…</Text>
      </View>
    );
  }
  if (isError) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>Не удалось загрузить данные</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={() => refetch()}>
          <Ionicons name="refresh" size={16} color="#fff" />
          <Text style={styles.retryText}>Повторить</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const renderItem = ({ item }: { item: DayItem }) => {
    const mins = workedMinutes(item);
    const isSelected = selectedDate === item.date;
    const complaint = hasComplaint(item.date);
    const editorOpen = activeEditorDate === item.date;

    return (
      <View style={[styles.card, isSelected && styles.cardActive, complaint && styles.cardComplaint]}>
        <TouchableOpacity activeOpacity={0.9} onPress={() => setSelectedDate(item.date)}>
          <View style={styles.cardRowTop}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              {complaint && <Ionicons name="alert-circle" size={16} color="#ef4444" />}
              <Text style={styles.cardDate}>{item.date}</Text>
            </View>
            <View style={[styles.badge, complaint && styles.badgeComplaint]}>
              <Ionicons name="time-outline" size={14} color={complaint ? '#ef4444' : '#2563eb'} />
              <Text style={[styles.badgeText, complaint && { color: '#ef4444' }]}>{formatHM(mins)}</Text>
            </View>
          </View>

          {(item.start && item.end) ? (
            <View style={styles.cardRowMid}>
              <Text style={styles.cardText}>{item.start} → {item.end}</Text>
            </View>
          ) : null}
        </TouchableOpacity>

        <View style={styles.cardRowBottom}>
          <TouchableOpacity
            style={[styles.complainBtn, complaint && styles.complainBtnAlt]}
            onPress={() => toggleEditor(item.date)}
            activeOpacity={0.9}
          >
            <Ionicons name={complaint ? 'create' : 'alert-circle-outline'} size={14} color={complaint ? '#0f172a' : '#2563eb'} />
            <Text style={[styles.complainText, complaint && { color: '#0f172a' }]}>
              {activeEditorDate === item.date ? 'Скрыть форму' : (complaint ? 'Изменить жалобу' : 'Сообщить о недостающих часах')}
            </Text>
          </TouchableOpacity>
        </View>

        {editorOpen && (
          <View style={styles.inlineEditor}>
            <Text style={styles.inlineTitle}>Недостающие часы</Text>
            <Text style={styles.inlineSub}>Укажите число часов для даты {item.date}</Text>

            <View style={styles.inlineRow}>
              <TouchableOpacity
                style={styles.stepBtn}
                onPress={() => setEditorValue(v => {
                  const n = Number((v || '0').replace(',', '.'));
                  const next = isNaN(n) ? 0 : Math.max(0, n - 1);
                  return String(next);
                })}
              >
                <Ionicons name="remove" size={16} color="#0f172a" />
              </TouchableOpacity>

              <View style={styles.inputRow}>
                <Ionicons name="hourglass-outline" size={18} color="#64748b" />
                <TextInput
                  value={editorValue}
                  onChangeText={(val) => setEditorValue(val.replace(/[^\d.,]/g, ''))}
                  keyboardType={Platform.select({ ios: 'decimal-pad', android: 'numeric' })}
                  placeholder="Например: 2"
                  style={styles.input}
                  maxLength={4}
                />
                <Text style={styles.unitText}>ч</Text>
              </View>

              <TouchableOpacity
                style={styles.stepBtn}
                onPress={() => setEditorValue(v => {
                  const n = Number((v || '0').replace(',', '.'));
                  const next = isNaN(n) ? 1 : n + 1;
                  return String(next);
                })}
              >
                <Ionicons name="add" size={16} color="#0f172a" />
              </TouchableOpacity>
            </View>

            <View style={styles.inlineActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => toggleEditor(item.date)}>
                <Text style={styles.cancelText}>Отмена</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.submitBtn} onPress={() => submitEditor(item.date)}>
                <Ionicons name="send" size={16} color="#fff" />
                <Text style={styles.submitText}>Отправить</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={styles.screen}>
      <View style={styles.container}>
        <View style={styles.headerRow}>
          <View style={styles.headerLeft}>
            <Text style={styles.headerTitle}>Ежедневные часы</Text>
            <Text style={styles.headerSub}>{monthISO} — выберите дату, чтобы перейти к записи</Text>
          </View>
          <TouchableOpacity onPress={() => setShowCalendar(v => !v)} style={styles.headerBtn} activeOpacity={0.85}>
            <Ionicons name={showCalendar ? 'calendar' : 'calendar-outline'} size={18} color="#fff" />
            <Text style={styles.headerBtnText}>{showCalendar ? 'Скрыть' : 'Календарь'}</Text>
          </TouchableOpacity>
        </View>

        {showCalendar && (
          <View style={styles.calendarCard}>
            <Calendar
              onDayPress={(d) => setSelectedDate(d.dateString)}
              markedDates={markedDates}
              // Arrow-lary özümiz çyzýarys — Image+tintColor duýduryşyny aýyrýar
              renderArrow={(dir) => (
                <Ionicons name={dir === 'left' ? 'chevron-back' : 'chevron-forward'} size={18} color="#2563eb" />
              )}
              theme={{
                todayTextColor: '#2563eb',
                selectedDayBackgroundColor: '#2563eb',
                arrowColor: '#2563eb',
                textDayFontSize: 12,
                textMonthFontWeight: '800',
              }}
              style={{ borderRadius: 12 }}
            />
          </View>
        )}

        <FlatList
          ref={listRef}
          data={data ?? []}
          keyExtractor={(i) => i.id}
          contentContainerStyle={styles.listContent}
          // dyn. beýiklik sebäpli — takmynan baha + failure fallback
          getItemLayout={(_, index) => ({ length: CARD_MIN_HEIGHT, offset: CARD_MIN_HEIGHT * index, index })}
          onScrollToIndexFailed={(info) => {
            listRef.current?.scrollToOffset({ offset: CARD_MIN_HEIGHT * info.index, animated: true });
            setTimeout(() => listRef.current?.scrollToIndex({ index: info.index, animated: true }), 50);
          }}
          ListEmptyComponent={
            <View style={styles.emptyWrap}>
              <Ionicons name="document-text-outline" size={28} color="#94a3b8" />
              <Text style={styles.emptyText}>Нет записей за выбранный период</Text>
            </View>
          }
          renderItem={renderItem}
        />
      </View>

      {toast && (
        <Animated.View
          // pointerEvents prop köne — web-de style arkaly goýýarys
          style={[
            styles.toast,
            Platform.OS === 'web' ? ({ pointerEvents: 'none' } as any) : null,
            {
              opacity: toastAnim,
              transform: [{
                translateY: toastAnim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }),
              }],
            },
          ]}
        >
          <Ionicons name="checkmark-circle" size={18} color="#16a34a" />
          <Text style={styles.toastText}>{toast}</Text>
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#0f172a' },
  container: { flex: 1, paddingHorizontal: 12, paddingTop: 8, paddingBottom: 12 },

  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0f172a' },
  loadingText: { marginTop: 8, color: '#e2e8f0' },
  errorText: { color: '#fecaca', fontWeight: '700' },
  retryBtn: {
    marginTop: 10, backgroundColor: '#2563eb', paddingHorizontal: 12, paddingVertical: 10,
    borderRadius: 10, flexDirection: 'row', alignItems: 'center', gap: 8,
  },
  retryText: { color: '#fff', fontWeight: '700' },

  headerRow: { paddingHorizontal: 4, paddingVertical: 8, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headerLeft: { flexShrink: 1, paddingRight: 8 },
  headerTitle: { color: '#fff', fontSize: 18, fontWeight: '800' },
  headerSub: { color: '#94a3b8', fontSize: 12, marginTop: 2 },
  headerBtn: { backgroundColor: '#2563eb', paddingHorizontal: 10, paddingVertical: 8, borderRadius: 10, flexDirection: 'row', alignItems: 'center', gap: 6 },
  headerBtnText: { color: '#fff', fontWeight: '700', fontSize: 12 },

  calendarCard: {
    marginTop: 6, marginHorizontal: 4, backgroundColor: '#0b1224',
    borderRadius: 12, borderWidth: StyleSheet.hairlineWidth, borderColor: '#1f2a44', overflow: 'hidden',
  },

  listContent: { paddingHorizontal: 4, paddingTop: 10, paddingBottom: 28 },

  card: {
    minHeight: CARD_MIN_HEIGHT,
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    ...cardShadow, // <-- shadow* ýerinde
  },
  cardActive: { borderColor: '#2563eb', ...cardShadowActive },
  cardComplaint: { borderColor: '#ef4444', backgroundColor: '#fff1f2' },

  cardRowTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardDate: { fontSize: 15, fontWeight: '800', color: '#0f172a' },

  badge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999,
    backgroundColor: '#eff6ff', borderWidth: 1, borderColor: '#bfdbfe',
  },
  badgeComplaint: { backgroundColor: '#fee2e2', borderColor: '#fecaca' },
  badgeText: { color: '#2563eb', fontWeight: '800', fontSize: 12 },

  cardRowMid: { marginTop: 6 },
  cardText: { color: '#0f172a', fontSize: 14, fontWeight: '600' },

  cardRowBottom: { marginTop: 8, flexDirection: 'row' },
  complainBtn: {
    paddingHorizontal: 10, paddingVertical: 8, borderRadius: 10,
    borderWidth: 1, borderColor: '#bfdbfe', backgroundColor: '#eff6ff',
    flexDirection: 'row', alignItems: 'center', gap: 6,
  },
  complainBtnAlt: { backgroundColor: '#fde68a', borderColor: '#fcd34d' },
  complainText: { color: '#2563eb', fontWeight: '700', fontSize: 12 },

  inlineEditor: { marginTop: 10, padding: 10, borderRadius: 12, borderWidth: 1, borderColor: '#e2e8f0', backgroundColor: '#f8fafc' },
  inlineTitle: { fontSize: 14, fontWeight: '800', color: '#0f172a' },
  inlineSub: { fontSize: 12, color: '#475569', marginTop: 2 },

  inlineRow: { marginTop: 10, flexDirection: 'row', alignItems: 'center', gap: 8 },
  stepBtn: { width: 36, height: 40, borderRadius: 10, backgroundColor: '#e2e8f0', alignItems: 'center', justifyContent: 'center' },

  inputRow: {
    flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8,
    borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, backgroundColor: '#fff',
  },
  input: { flex: 1, fontSize: 16, color: '#0f172a' },
  unitText: { fontSize: 14, color: '#475569', fontWeight: '700' },

  inlineActions: { marginTop: 10, flexDirection: 'row', gap: 10 },
  cancelBtn: { flex: 1, backgroundColor: '#f1f5f9', borderRadius: 12, alignItems: 'center', justifyContent: 'center', paddingVertical: 12 },
  cancelText: { color: '#0f172a', fontWeight: '700' },
  submitBtn: { flex: 1, backgroundColor: '#2563eb', borderRadius: 12, alignItems: 'center', justifyContent: 'center', paddingVertical: 12, flexDirection: 'row', gap: 8 },
  submitText: { color: '#fff', fontWeight: '700' },

  // boş sanaw üçin stil — TS ýalňyşlygyny düzedýär
  emptyWrap: { alignItems: 'center', paddingVertical: 40, gap: 8 },
  emptyText: { color: '#94a3b8', fontSize: 13, fontWeight: '600' },

  // Toast
  toast: {
    position: 'absolute', top: 18, left: 16, right: 16,
    backgroundColor: '#f8fafc', borderRadius: 12, paddingVertical: 10, paddingHorizontal: 12,
    borderWidth: 1, borderColor: '#e2e8f0', flexDirection: 'row', alignItems: 'center', gap: 8,
  },
  toastText: { color: '#0f172a', fontWeight: '700' },
});
