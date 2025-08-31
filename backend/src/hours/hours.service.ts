import { Injectable } from '@nestjs/common';

export type WorkDay = {
  id: string;
  date: string;
  start: string;
  end: string;
  breakMinutes: number;
  note?: string;
  approved?: boolean;
};

export type MonthSummary = {
  month: string;
  totalHours: number;
  overtimeHours: number;
};

@Injectable()
export class HoursService {
  async daily(month: string): Promise<WorkDay[]> {
    const [year, m] = month.split('-').map(Number);
    const result: WorkDay[] = [];
    const date = new Date(year, m - 1, 1);
    let idx = 0;
    while (date.getMonth() === m - 1) {
      const day = date.getDate();
      const ds = date.toISOString().slice(0, 10);
      result.push({
        id: String(idx++),
        date: ds,
        start: '09:00',
        end: date.getDay() === 0 || date.getDay() === 6 ? '00:00' : '18:00',
        breakMinutes: 60,
        note: day % 5 === 0 ? 'Meeting day' : undefined,
      });
      date.setDate(day + 1);
    }
    return result;
  }

  async summary(month: string): Promise<MonthSummary> {
    const days = await this.daily(month);
    const totalHours = days.reduce((acc, d) => acc + (d.end === '00:00' ? 0 : 8), 0);
    return {
      month,
      totalHours,
      overtimeHours: Math.max(0, totalHours - 160),
    };
  }
}
