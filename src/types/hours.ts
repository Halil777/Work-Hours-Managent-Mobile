export type WorkDay = {
  id: string;
  date: string;           // ISO "2025-08-28"
  start: string;          // "09:00"
  end: string;            // "18:00"
  breakMinutes: number;   // 60
  note?: string;
  approved?: boolean;     // HR/manager tassyklamasy
};

export type MonthSummary = {
  month: string;          // "2025-08"
  totalHours: number;
  overtimeHours: number;
};
