import { eachDayOfInterval, endOfMonth, format, startOfMonth } from 'date-fns';
import { MonthSummary, WorkDay } from '../types/hours';

export async function fetchDaily(monthISO: string): Promise<WorkDay[]> {
  await new Promise(r => setTimeout(r, 300));
  const start = startOfMonth(new Date(monthISO + '-01'));
  const end = endOfMonth(start);
  return eachDayOfInterval({ start, end }).map((d, i) => ({
    id: String(i),
    date: format(d, 'yyyy-MM-dd'),
    start: '09:00',
    end: i % 6 === 0 ? '00:00' : '18:00', // dynç günlerine nol
    breakMinutes: 60,
    note: i % 5 === 0 ? 'Meeting day' : undefined,
  }));
}

export async function fetchSummary(monthISO: string): Promise<MonthSummary> {
  const days = await fetchDaily(monthISO);
  const totalHours = days.reduce((acc, d) => acc + (d.end === '00:00' ? 0 : 8), 0);
  return { month: monthISO, totalHours, overtimeHours: Math.max(0, totalHours - 160) };
}
