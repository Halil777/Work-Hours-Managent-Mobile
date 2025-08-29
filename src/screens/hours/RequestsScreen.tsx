// src/screens/requests/RequestsScreen.tsx
import { Ionicons } from '@expo/vector-icons';
import React, { useMemo, useRef, useState } from 'react';
import {
    Animated, Easing,
    FlatList, Modal,
    Platform,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { Calendar } from 'react-native-calendars';

type RequestType = 'Отпуск' | 'Больничный' | 'Сверхурочная' | 'Компенсация';
type RequestStatus = 'ожидает' | 'одобрено' | 'отклонено';

type RequestItem = {
  id: string;
  type: RequestType;
  startDate: string; // YYYY-MM-DD
  endDate: string;   // YYYY-MM-DD
  days: number;      // inclusive count
  status: RequestStatus;
};

// react-native-calendars üçin lokal gün tipi
type LocalDateObject = {
  dateString: string;
  day: number;
  month: number;
  year: number;
  timestamp: number;
};

const cardShadow = Platform.select({
  web: { boxShadow: '0 6px 16px rgba(0,0,0,0.08)' },
  default: { shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 8, elevation: 3 },
}) as any;

function fmtRange(a: string, b: string) {
  return a === b ? a : `${a} — ${b}`;
}
function daysBetweenInclusive(a: string, b: string) {
  const start = new Date(a);
  const end = new Date(b);
  const diff = Math.ceil((end.getTime() - start.getTime()) / 86400000);
  return diff >= 0 ? diff + 1 : 1;
}
function uid() {
  return Math.random().toString(36).slice(2, 9);
}

export default function RequestsScreen() {
  // Demo başlangyç maglumatlar
  const [items, setItems] = useState<RequestItem[]>([
    { id: uid(), type: 'Отпуск', startDate: '2025-08-20', endDate: '2025-08-23', days: 4, status: 'одобрено' },
    { id: uid(), type: 'Сверхурочная', startDate: '2025-08-21', endDate: '2025-08-21', days: 1, status: 'ожидает' },
  ]);

  // ——— Modal (täze arza) ýagdaýlary
  const [open, setOpen] = useState(false);
  const [reqType, setReqType] = useState<RequestType>('Отпуск');
  const [rangeStart, setRangeStart] = useState<string | null>(null);
  const [rangeEnd, setRangeEnd] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // animasiýa
  const sheetAnim = useRef(new Animated.Value(0)).current;
  const openSheet = () => {
    setOpen(true);
    Animated.timing(sheetAnim, {
      toValue: 1, duration: 220, easing: Easing.out(Easing.cubic),
      useNativeDriver: Platform.OS !== 'web',
    }).start();
  };
  const closeSheet = () => {
    Animated.timing(sheetAnim, {
      toValue: 0, duration: 180, easing: Easing.in(Easing.cubic),
      useNativeDriver: Platform.OS !== 'web',
    }).start(() => setOpen(false));
  };
  const translateY = sheetAnim.interpolate({ inputRange: [0, 1], outputRange: [300, 0] });
  const sheetOpacity = sheetAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 1] });

  // Calendar: aralyk saýlama (range pick)
  const onDayPress = (d: LocalDateObject) => {
    setError(null);
    const date = d.dateString;
    if (!rangeStart || (rangeStart && rangeEnd)) {
      setRangeStart(date);
      setRangeEnd(null);
    } else if (rangeStart && !rangeEnd) {
      if (date < rangeStart) {
        // tersine saýlasa — başy täzeläli
        setRangeStart(date);
      } else {
        setRangeEnd(date);
      }
    }
  };

  // Calendar bellik “period” görnüşinde
  const markedDates = useMemo(() => {
    if (!rangeStart) return {};
    const result: Record<string, any> = {};
    const start = new Date(rangeStart);
    const last = rangeEnd ? new Date(rangeEnd) : start;
    const step = new Date(start);
    const color = '#c7d2fe'; // açyk mämişi
    const textColor = '#0f172a';

    while (step <= last) {
      const ds = step.toISOString().slice(0, 10);
      result[ds] = {
        startingDay: ds === rangeStart,
        endingDay: ds === (rangeEnd ?? rangeStart),
        color,
        textColor,
      };
      step.setDate(step.getDate() + 1);
    }
    return result;
  }, [rangeStart, rangeEnd]);

  const onSubmit = () => {
    if (!rangeStart || !rangeEnd) {
      setError('Выберите диапазон дат');
      return;
    }
    const dcount = daysBetweenInclusive(rangeStart, rangeEnd);
    const newItem: RequestItem = {
      id: uid(),
      type: reqType,
      startDate: rangeStart,
      endDate: rangeEnd,
      days: dcount,
      status: 'ожидает',
    };
    setItems(prev => [newItem, ...prev]);
    // reset
    setReqType('Отпуск');
    setRangeStart(null);
    setRangeEnd(null);
    setError(null);
    closeSheet();
  };

  const cancelPending = (id: string) => {
    setItems(prev => prev.map(it => (it.id === id ? { ...it, status: 'отклонено' } : it)));
  };

  // Statistika (şu ýyl boýunça)
  const year = new Date().getFullYear();
  const stats = useMemo(() => {
    const inYear = items.filter(it => it.startDate.startsWith(String(year)));
    const planned = inYear.length;
    const approved = inYear.filter(it => it.status === 'одобрено').length;
    const declined = inYear.filter(it => it.status === 'отклонено').length;
    return { planned, approved, declined };
  }, [items, year]);

  const renderItem = ({ item }: { item: RequestItem }) => {
    const statusStyle =
      item.status === 'одобрено' ? styles.badgeOk :
      item.status === 'отклонено' ? styles.badgeErr :
      styles.badgePend;

    const iconName =
      item.type === 'Отпуск' ? 'sunny-outline' :
      item.type === 'Больничный' ? 'medkit-outline' :
      item.type === 'Сверхурочная' ? 'flash-outline' :
      'timer-outline';

    return (
      <View style={[styles.card, cardShadow]}>
        <View style={styles.cardTopRow}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Ionicons name={iconName as any} size={18} color="#0f172a" />
            <Text style={styles.cardTitle}>{item.type}</Text>
          </View>
          <View style={[styles.badge, statusStyle]}>
            <Text style={styles.badgeText}>
              {item.status === 'ожидает' ? 'Ожидает' : item.status === 'одобрено' ? 'Одобрено' : 'Отклонено'}
            </Text>
          </View>
        </View>

        <Text style={styles.cardDates}>{fmtRange(item.startDate, item.endDate)}</Text>
        <Text style={styles.cardSub}>{item.days} дн.</Text>

        {item.status === 'ожидает' && (
          <TouchableOpacity onPress={() => cancelPending(item.id)} style={styles.cancelBtn} activeOpacity={0.9}>
            <Ionicons name="close-circle-outline" size={16} color="#b91c1c" />
            <Text style={styles.cancelText}>Отменить заявку</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  return (
    <View style={styles.screen}>
      {/* Header + stats */}
      <View style={[styles.header, cardShadow]}>
        <Text style={styles.headerTitle}>Заявки</Text>
        <TouchableOpacity onPress={openSheet} style={styles.addBtn} activeOpacity={0.9}>
          <Ionicons name="add" size={18} color="#fff" />
          <Text style={styles.addBtnText}>Новая</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.statRow}>
        <View style={[styles.statCard, cardShadow]}>
          <Text style={styles.statNum}>{stats.planned}</Text>
          <Text style={styles.statLabel}>Запланировано</Text>
        </View>
        <View style={[styles.statCard, cardShadow]}>
          <Text style={styles.statNum}>{stats.approved}</Text>
          <Text style={styles.statLabel}>Одобрено</Text>
        </View>
        <View style={[styles.statCard, cardShadow]}>
          <Text style={styles.statNum}>{stats.declined}</Text>
          <Text style={styles.statLabel}>Отклонено</Text>
        </View>
      </View>

      {/* List */}
      <FlatList
        contentContainerStyle={{ padding: 12, paddingBottom: 28 }}
        data={items}
        keyExtractor={(it) => it.id}
        renderItem={renderItem}
        ListEmptyComponent={
          <View style={styles.emptyBox}>
            <Ionicons name="document-text-outline" size={26} color="#94a3b8" />
            <Text style={styles.emptyText}>Пока нет заявок</Text>
          </View>
        }
      />

      {/* Create request sheet */}
      <Modal visible={open} transparent animationType="none" onRequestClose={closeSheet} statusBarTranslucent>
        <View style={styles.overlay}>
          <TouchableOpacity style={styles.overlayTap} activeOpacity={1} onPress={closeSheet} />
          <Animated.View style={[styles.sheet, { transform: [{ translateY }], opacity: sheetOpacity }]}>
            <View style={styles.handle} />
            <Text style={styles.sheetTitle}>Новая заявка</Text>

            {/* Type picker */}
            <View style={styles.typesRow}>
              {(['Отпуск', 'Больничный', 'Сверхурочная', 'Компенсация'] as RequestType[]).map((t) => {
                const active = t === reqType;
                return (
                  <TouchableOpacity
                    key={t}
                    onPress={() => setReqType(t)}
                    style={[styles.typeChip, active && styles.typeChipActive]}
                    activeOpacity={0.9}
                  >
                    <Text style={[styles.typeChipText, active && { color: '#0f172a' }]}>{t}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Calendar range */}
            <View style={styles.calendarWrap}>
              <Calendar
                onDayPress={onDayPress}
                markedDates={markedDates}
                markingType="period"
                theme={{
                  selectedDayBackgroundColor: '#6366f1',
                  todayTextColor: '#2563eb',
                  arrowColor: '#2563eb',
                }}
              />
            </View>

            {!!error && <Text style={styles.errorText}>{error}</Text>}

            <View style={styles.sheetActions}>
              <TouchableOpacity style={styles.cancelBtn2} onPress={closeSheet}>
                <Text style={styles.cancelBtn2Text}>Отмена</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.submitBtn} onPress={onSubmit} activeOpacity={0.9}>
                <Ionicons name="send" size={16} color="#fff" />
                <Text style={styles.submitBtnText}>Отправить</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#0f172a' },

  header: {
    margin: 12,
    backgroundColor: '#1d4ed8',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  headerTitle: { color: '#fff', fontWeight: '900', fontSize: 16 },
  addBtn: {
    backgroundColor: '#2563eb', paddingHorizontal: 10, paddingVertical: 8,
    borderRadius: 10, flexDirection: 'row', alignItems: 'center', gap: 6,
  },
  addBtnText: { color: '#fff', fontWeight: '800', fontSize: 12 },

  statRow: { flexDirection: 'row', gap: 10, paddingHorizontal: 12 },
  statCard: {
    flex: 1, backgroundColor: '#fff', borderRadius: 14, borderWidth: 1, borderColor: '#e2e8f0',
    padding: 12, alignItems: 'center', ...cardShadow,
  },
  statNum: { color: '#0f172a', fontWeight: '900', fontSize: 18 },
  statLabel: { color: '#475569', fontSize: 11, marginTop: 2 },

  card: {
    backgroundColor: '#fff', borderRadius: 14, borderWidth: 1, borderColor: '#e2e8f0',
    padding: 12, marginBottom: 10, ...cardShadow,
  },
  cardTopRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  cardTitle: { color: '#0f172a', fontWeight: '900', fontSize: 14 },
  badge: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999 },
  badgeText: { fontWeight: '800', fontSize: 12, color: '#0f172a' },
  badgeOk:  { backgroundColor: '#dcfce7', borderWidth: 1, borderColor: '#bbf7d0' },
  badgeErr: { backgroundColor: '#fee2e2', borderWidth: 1, borderColor: '#fecaca' },
  badgePend:{ backgroundColor: '#fef9c3', borderWidth: 1, borderColor: '#fde68a' },

  cardDates: { color: '#334155', marginTop: 8, fontWeight: '700' },
  cardSub:   { color: '#64748b', marginTop: 2 },

  cancelBtn: {
    alignSelf: 'flex-start', marginTop: 10, paddingHorizontal: 10, paddingVertical: 8,
    borderRadius: 10, borderWidth: 1, borderColor: '#fecaca', backgroundColor: '#fff1f2',
    flexDirection: 'row', alignItems: 'center', gap: 6,
  },
  cancelText: { color: '#b91c1c', fontWeight: '800', fontSize: 12 },

  // ListEmptyComponent üçin
  emptyBox: {
    paddingVertical: 36,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  emptyText: { color: '#94a3b8', fontWeight: '700' },

  // Modal sheet
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  overlayTap: { flex: 1 },
  sheet: {
    backgroundColor: '#fff',
    paddingTop: 8, paddingHorizontal: 14, paddingBottom: 14 + (Platform.OS === 'ios' ? 10 : 0),
    borderTopLeftRadius: 16, borderTopRightRadius: 16,
  },
  handle: { alignSelf: 'center', width: 44, height: 4, borderRadius: 2, backgroundColor: '#e2e8f0', marginBottom: 8 },
  sheetTitle: { fontSize: 16, fontWeight: '900', color: '#0f172a', marginBottom: 8 },

  typesRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  typeChip: {
    borderWidth: 1, borderColor: '#e2e8f0', backgroundColor: '#f8fafc',
    paddingHorizontal: 10, paddingVertical: 8, borderRadius: 10,
  },
  typeChipActive: { backgroundColor: '#fde68a', borderColor: '#fcd34d' },
  typeChipText: { color: '#334155', fontWeight: '800', fontSize: 12 },

  calendarWrap: {
    marginTop: 10, borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 12, overflow: 'hidden',
  },

  errorText: { marginTop: 8, color: '#ef4444', fontWeight: '700' },

  sheetActions: { flexDirection: 'row', gap: 10, marginTop: 12 },
  cancelBtn2: {
    flex: 1, backgroundColor: '#f1f5f9', borderRadius: 12, alignItems: 'center', justifyContent: 'center', paddingVertical: 12,
  },
  cancelBtn2Text: { color: '#0f172a', fontWeight: '800' },
  submitBtn: {
    flex: 1, backgroundColor: '#2563eb', borderRadius: 12, alignItems: 'center', justifyContent: 'center', paddingVertical: 12, flexDirection: 'row', gap: 8,
  },
  submitBtnText: { color: '#fff', fontWeight: '800' },
});
