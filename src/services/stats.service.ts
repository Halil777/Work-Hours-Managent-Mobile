import { LeaderboardEntry } from '../types/stats';

export async function fetchTopWeekly(): Promise<LeaderboardEntry[]> {
  await new Promise(r => setTimeout(r, 400));
  return Array.from({ length: 10 }).map((_, i) => ({
    id: String(i + 1),
    name: `Worker ${i + 1}`,
    hours: 40 - i,
  }));
}

export async function fetchTopMonthly(): Promise<LeaderboardEntry[]> {
  await new Promise(r => setTimeout(r, 400));
  return Array.from({ length: 10 }).map((_, i) => ({
    id: String(i + 1),
    name: `Worker ${i + 1}`,
    hours: 160 - i * 5,
  }));
}
