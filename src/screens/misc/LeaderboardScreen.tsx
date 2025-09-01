import { useQuery } from '@tanstack/react-query';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { fetchTopMonthly, fetchTopWeekly } from '../../services/stats.service';
import { LeaderboardEntry } from '../../types/stats';

export default function LeaderboardScreen() {
  const [mode, setMode] = useState<'weekly' | 'monthly'>('weekly');

  const { data, isLoading, isError, refetch } = useQuery<LeaderboardEntry[]>({
    queryKey: ['leaderboard', mode],
    queryFn: () => (mode === 'weekly' ? fetchTopWeekly() : fetchTopMonthly()),
  });

  const renderItem = ({ item, index }: { item: LeaderboardEntry; index: number }) => (
    <View style={styles.row}>
      <Text style={styles.rank}>{index + 1}</Text>
      <Text style={styles.name}>{item.name}</Text>
      <Text style={styles.hours}>{item.hours} ч</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.switchRow}>
        <TouchableOpacity
          style={[styles.switchBtn, mode === 'weekly' && styles.switchBtnActive]}
          onPress={() => setMode('weekly')}
        >
          <Text style={[styles.switchText, mode === 'weekly' && styles.switchTextActive]}>Неделя</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.switchBtn, mode === 'monthly' && styles.switchBtnActive]}
          onPress={() => setMode('monthly')}
        >
          <Text style={[styles.switchText, mode === 'monthly' && styles.switchTextActive]}>Месяц</Text>
        </TouchableOpacity>
      </View>

      {isLoading && <ActivityIndicator style={{ marginTop: 20 }} />}
      {isError && (
        <TouchableOpacity style={styles.errorBtn} onPress={() => refetch()}>
          <Text style={styles.errorText}>Ошибка. Повторить?</Text>
        </TouchableOpacity>
      )}
      {data && (
        <FlatList
          data={data}
          keyExtractor={item => item.id}
          renderItem={renderItem}
          contentContainerStyle={{ paddingVertical: 12 }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  switchRow: {
    flexDirection: 'row',
    alignSelf: 'center',
    marginBottom: 12,
    backgroundColor: '#e5e7eb',
    borderRadius: 8,
  },
  switchBtn: { paddingVertical: 6, paddingHorizontal: 16, borderRadius: 8 },
  switchBtnActive: { backgroundColor: '#2563eb' },
  switchText: { fontSize: 14, fontWeight: '700', color: '#1f2937' },
  switchTextActive: { color: '#fff' },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: '#e5e7eb',
  },
  rank: { width: 24, fontWeight: '700', color: '#2563eb' },
  name: { flex: 1, fontSize: 16 },
  hours: { fontWeight: '700' },
  errorBtn: {
    marginTop: 20,
    alignSelf: 'center',
    padding: 10,
    backgroundColor: '#ef4444',
    borderRadius: 6,
  },
  errorText: { color: '#fff' },
});
