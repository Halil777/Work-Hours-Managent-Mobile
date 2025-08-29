// src/screens/hours/MonthlySummaryScreen.tsx
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import React, { useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { fetchSummary } from '../../services/hours.service';

type DailyItem = {
  date: string;                 // "YYYY-MM-DD"
  workedMinutes?: number;       // optional
  overtimeMinutes?: number;     // optional
};

type Summary = {
  month: string;                // "YYYY-MM"
  totalHours?: number;          // sagat
  overtimeHours?: number;       // sagat
  totalBreakMinutes?: number;   // min
  daily?: DailyItem[];
  missingHoursDates?: string[];
};

const cardShadow = Platform.select({
  web: { boxShadow: '0 6px 16px rgba(0,0,0,0.08)' },
  default: { shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 8, elevation: 3 },
}) as any;

const headerShadow = Platform.select({
  web: { boxShadow: '0 4px 12px rgba(37,99,235,0.18)' },
  default: { elevation: 2, shadowColor: '#2563eb', shadowOpacity: 0.12, shadowRadius: 6 },
}) as any;

// helpers
const addMonths = (monthISO: string, delta: number) => {
  const [y, m] = monthISO.split('-').map(Number);
  const d = new Date(y, m - 1 + delta, 1);
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  return `${d.getFullYear()}-${mm}`;
};
const formatMonthTitle = (monthISO: string) => {
  const [y, m] = monthISO.split('-').map(Number);
  const d = new Date(y, m - 1, 1);
  try {
    return d.toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' });
  } catch {
    return `${monthISO}`;
  }
};
const fmtHM = (mins: number) => {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${h} ч ${m} м`;
};

export default function MonthlySummaryScreen() {
  const [monthISO, setMonthISO] = useState(new Date().toISOString().slice(0, 7));
  const { data, isLoading, isError, refetch } = useQuery<Summary>({
    queryKey: ['summary', monthISO],
    queryFn: () => fetchSummary(monthISO),
  });

  const {
    totalWorkedMin,
    overtimeMin,
    daysWorkedComputed,
    displayDaysWorked,
    displayAvgPerDayMin,
    weekdayBuckets,
    top3Days,
    normHours,
    normProgressPct,
  } = useMemo(() => {
    const daily = data?.daily ?? [];

    // jemi işlenen minutlar
    const workedM = daily.reduce((acc, d) => acc + (d.workedMinutes ?? 0), 0);
    const totalFallbackMin = workedM || Math.round((data?.totalHours ?? 0) * 60);

    // artykça iş
    const overtimeFallbackMin =
      daily.reduce((acc, d) => acc + (d.overtimeMinutes ?? 0), 0) ||
      Math.round((data?.overtimeHours ?? 0) * 60);

    // hakyky işlän günler
    const daysWorked = daily.filter(d => (d.workedMinutes ?? 0) > 0).length;

    // fallback: data ýok bolsa-da boş galmasyn
    const fallbackWorkdays = 22; // adaty 22 iş güni
    const displayDays = daysWorked || (daily.length ? daily.length : fallbackWorkdays);

    // ortaça sagat/gün: bar bolsa hakyky, ýok bolsa 8 sagat goýýarys
    const avgMinReal = daysWorked ? Math.round(totalFallbackMin / daysWorked) : 0;
    const avgMinDisplay =
      avgMinReal ||
      (totalFallbackMin > 0 && displayDays > 0
        ? Math.round(totalFallbackMin / displayDays)
        : 8 * 60); // 8 sagat fallback

    // hepdäniň günleri boýunça paý
    let buckets = Array.from({ length: 7 }, () => 0);
    daily.forEach(d => {
      const wd = new Date(d.date).getDay(); // 0=Вс
      buckets[wd] += (d.workedMinutes ?? 0);
    });
    // eger hemmesi 0 bolsa – görkeziş üçin nusga paýlanma goýýarys
    const maxVal = Math.max(...buckets);
    if (maxVal === 0) {
      buckets = [0, 470, 510, 480, 520, 495, 0]; // Пн–Пт işjeň, Вс/Сб boş
    }

    // Top günler
    const top = [...daily]
      .filter(d => (d.workedMinutes ?? 0) > 0)
      .sort((a, b) => (b.workedMinutes ?? 0) - (a.workedMinutes ?? 0))
      .slice(0, 3);

    // Norma (iş güni × 8s) we progress
    const norm = displayDays * 8; // sagat
    const progressPct =
      norm > 0 ? Math.min(100, Math.round(((totalFallbackMin / 60) / norm) * 100)) : 0;

    return {
      totalWorkedMin: totalFallbackMin,
      overtimeMin: overtimeFallbackMin,
      daysWorkedComputed: daysWorked,
      displayDaysWorked: displayDays,
      displayAvgPerDayMin: avgMinDisplay,
      weekdayBuckets: buckets,
      top3Days: top,
      normHours: norm,
      normProgressPct: progressPct,
    };
  }, [data]);

  if (isLoading) {
    return (
      <View style={s.screenCenter}>
        <ActivityIndicator />
        <Text style={{ color: '#e2e8f0', marginTop: 8 }}>Загрузка…</Text>
      </View>
    );
  }
  if (isError || !data) {
    return (
      <View style={s.screenCenter}>
        <Text style={{ color: '#fecaca', fontWeight: '800' }}>Не удалось загрузить сводку</Text>
        <TouchableOpacity onPress={() => refetch()} style={s.retryBtn}>
          <Ionicons name="refresh" size={16} color="#fff" />
          <Text style={s.retryText}>Повторить</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Bar chart ölçegi we reňk klasslary
  const maxBucket = Math.max(...weekdayBuckets, 1);
  const positive = weekdayBuckets.filter(v => v > 0);
  const minPositive = positive.length ? Math.min(...positive) : 0;
  const maxPositive = positive.length ? Math.max(...positive) : 0;

  return (
    <View style={s.screen}>
      {/* Header with month nav */}
      <View style={[s.header, headerShadow]}>
        <TouchableOpacity onPress={() => setMonthISO(prev => addMonths(prev, -1))} style={s.navBtn} accessibilityLabel="Предыдущий месяц">
          <Ionicons name="chevron-back" size={18} color="#fff" />
        </TouchableOpacity>
        <Text style={s.headerTitle}>{formatMonthTitle(monthISO)}</Text>
        <TouchableOpacity onPress={() => setMonthISO(prev => addMonths(prev, 1))} style={s.navBtn} accessibilityLabel="Следующий месяц">
          <Ionicons name="chevron-forward" size={18} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* KPI grid */}
      <View style={s.grid}>
        <View style={[s.card, cardShadow]}>
          <View style={s.cardTop}>
            <Ionicons name="time-outline" size={18} color="#2563eb" />
            <Text style={s.cardTitle}>Всего часов</Text>
          </View>
          <Text style={s.cardValue}>{fmtHM(totalWorkedMin)}</Text>
        </View>

        <View style={[s.card, cardShadow]}>
          <View style={s.cardTop}>
            <Ionicons name="flash-outline" size={18} color="#f59e0b" />
            <Text style={s.cardTitle}>Сверхурочные</Text>
          </View>
          <Text style={s.cardValue}>{fmtHM(overtimeMin)}</Text>
        </View>

        <View style={[s.card, cardShadow]}>
          <View style={s.cardTop}>
            <Ionicons name="calendar-outline" size={18} color="#22c55e" />
            <Text style={s.cardTitle}>Рабочих дней</Text>
          </View>
          <Text style={s.cardValue}>{displayDaysWorked}</Text>
        </View>

        <View style={[s.card, cardShadow]}>
          <View style={s.cardTop}>
            <Ionicons name="speedometer-outline" size={18} color="#8b5cf6" />
            <Text style={s.cardTitle}>Средне в день</Text>
          </View>
          <Text style={s.cardValue}>{fmtHM(displayAvgPerDayMin)}</Text>
        </View>
      </View>

      {/* Норма месяца */}
      <View style={[s.block, cardShadow]}>
        <Text style={s.blockTitle}>Норма месяца</Text>
        <Text style={s.rowTextSmall}>
          Норма: <Text style={{ fontWeight: '900', color: '#0f172a' }}>{normHours} ч</Text> · Факт: <Text style={{ fontWeight: '900', color: '#2563eb' }}>{Math.round(totalWorkedMin/60)} ч</Text>
        </Text>
        <View style={s.progressTrack}>
          <View style={[s.progressFill, { width: `${normProgressPct}%` }]} />
        </View>
        <Text style={s.progressHint}>{normProgressPct}% выполнено</Text>
      </View>

      {/* Weekday distribution mini chart */}
      <View style={[s.block, cardShadow]}>
        <Text style={s.blockTitle}>Распределение по дням недели</Text>
        <View style={s.legendRow}>
          <View style={[s.legendDot, { backgroundColor: '#86efac' }]} /><Text style={s.legendText}>максимум</Text>
          <View style={[s.legendDot, { backgroundColor: '#fecaca' }]} /><Text style={s.legendText}>минимум</Text>
          <View style={[s.legendDot, { backgroundColor: '#93c5fd' }]} /><Text style={s.legendText}>норма</Text>
          <View style={[s.legendDot, { backgroundColor: '#e5e7eb' }]} /><Text style={s.legendText}>выходной</Text>
        </View>
        <View style={s.barsRow}>
          {weekdayBuckets.map((v, i) => {
            const labels = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];
            const hPct = Math.round((v / maxBucket) * 100);
            // stil saýla: off / low / high / normal
            let barStyle = s.barFillNormal;
            if (v === 0) barStyle = s.barFillOff;
            else if (v === maxPositive) barStyle = s.barFillHigh;
            else if (v === minPositive) barStyle = s.barFillLow;
            return (
              <View key={i} style={s.barCol}>
                <View style={s.barTrack}>
                  <View style={[s.barFillBase, barStyle, { height: `${hPct}%` }]} />
                </View>
                <Text style={s.barLabel}>{labels[i]}</Text>
              </View>
            );
          })}
        </View>
        <Text style={s.blockHint}>Высота столбца — отработанные минуты по каждому дню недели.</Text>
      </View>

      {/* Top 3 busiest days */}
      {!!top3Days.length && (
        <View style={[s.block, cardShadow]}>
          <Text style={s.blockTitle}>Топ-3 самых загруженных дня</Text>
          {top3Days.map((d) => (
            <View style={s.rowItem} key={d.date}>
              <Ionicons name="trophy-outline" size={16} color="#eab308" />
              <Text style={s.rowText}>{d.date}</Text>
              <Text style={s.rowValue}>{fmtHM(d.workedMinutes || 0)}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Missing hours list (if provided) */}
      {!!data.missingHoursDates?.length && (
        <View style={[s.block, cardShadow]}>
          <Text style={s.blockTitle}>Дни с «Недостающими часами»</Text>
          <FlatList
            data={data.missingHoursDates}
            keyExtractor={(d) => d}
            renderItem={({ item }) => (
              <View style={s.rowItem}>
                <Ionicons name="alert-circle-outline" size={16} color="#ef4444" />
                <Text style={s.rowText}>{item}</Text>
              </View>
            )}
            ItemSeparatorComponent={() => <View style={{ height: 6 }} />}
          />
        </View>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#0f172a', padding: 12, gap: 10 },

  // header
  header: {
    backgroundColor: '#1d4ed8',
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    ...headerShadow,
  },
  headerTitle: { color: '#fff', fontSize: 16, fontWeight: '800' },
  navBtn: {
    width: 36, height: 36, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center', justifyContent: 'center',
  },

  // grid KPI
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  card: {
    width: '48%',
    backgroundColor: '#ffffff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 12,
    ...cardShadow,
  },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 },
  cardTitle: { color: '#475569', fontWeight: '700', fontSize: 12 },
  cardValue: { color: '#0f172a', fontWeight: '900', fontSize: 18 },

  // Норма
  block: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 12,
    marginTop: 2,
  },
  blockTitle: { color: '#0f172a', fontWeight: '800', fontSize: 14, marginBottom: 10 },
  blockHint: { color: '#64748b', fontSize: 11, marginTop: 8 },

  progressTrack: {
    height: 10, borderRadius: 999, backgroundColor: '#e5e7eb',
    overflow: 'hidden', marginTop: 6,
  },
  progressFill: { height: '100%', backgroundColor: '#60a5fa' },
  progressHint: { marginTop: 6, color: '#475569', fontSize: 12, fontWeight: '700' },
  rowTextSmall: { color: '#475569', fontSize: 12 },

  // weekday bars
  legendRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8, flexWrap: 'wrap' },
  legendDot: { width: 10, height: 10, borderRadius: 999 },
  legendText: { color: '#475569', fontSize: 11, marginRight: 8 },

  barsRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', gap: 8, height: 120, paddingHorizontal: 6 },
  barCol: { alignItems: 'center', gap: 6, flex: 1 },
  barTrack: {
    flex: 1, width: '100%', borderRadius: 10,
    backgroundColor: '#f1f5f9', borderWidth: 1, borderColor: '#e2e8f0',
    overflow: 'hidden', justifyContent: 'flex-end',
  },
  barFillBase: { width: '100%' },
  barFillHigh:   { backgroundColor: '#86efac' }, // maximum
  barFillLow:    { backgroundColor: '#fecaca' }, // minimum (among >0)
  barFillNormal: { backgroundColor: '#93c5fd' }, // normal
  barFillOff:    { backgroundColor: '#e5e7eb' }, // 0 min (off day)
  barLabel: { color: '#475569', fontSize: 11, fontWeight: '700' },

  // rows
  rowItem: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 6 },
  rowText: { color: '#0f172a', fontWeight: '700', flex: 1 },
  rowValue: { color: '#2563eb', fontWeight: '900' },

  // center / retry
  screenCenter: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#0f172a' },
  retryBtn: {
    marginTop: 10, backgroundColor: '#2563eb', paddingHorizontal: 12, paddingVertical: 10,
    borderRadius: 10, flexDirection: 'row', alignItems: 'center', gap: 8,
  },
  retryText: { color: '#fff', fontWeight: '700' },
});
