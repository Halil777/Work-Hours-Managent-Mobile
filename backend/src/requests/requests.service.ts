import { Injectable } from '@nestjs/common';

export type RequestStatus = 'ожидает' | 'одобрено' | 'отклонено';
export type RequestType = 'Отпуск' | 'Больничный' | 'Сверхурочная' | 'Компенсация';

export interface RequestItem {
  id: string;
  type: RequestType;
  startDate: string;
  endDate: string;
  days: number;
  status: RequestStatus;
}

@Injectable()
export class RequestsService {
  private items: RequestItem[] = [];

  list() {
    return this.items;
  }

  create(it: { type: RequestType; startDate: string; endDate: string; }) {
    const days = this.daysBetween(it.startDate, it.endDate);
    const newItem: RequestItem = {
      id: Math.random().toString(36).slice(2, 9),
      type: it.type,
      startDate: it.startDate,
      endDate: it.endDate,
      days,
      status: 'ожидает',
    };
    this.items.unshift(newItem);
    return newItem;
  }

  cancel(id: string) {
    const idx = this.items.findIndex(i => i.id === id);
    if (idx >= 0) {
      this.items[idx].status = 'отклонено';
      return this.items[idx];
    }
    return undefined;
  }

  private daysBetween(a: string, b: string) {
    const start = new Date(a);
    const end = new Date(b);
    const diff = Math.ceil((end.getTime() - start.getTime()) / 86400000);
    return diff >= 0 ? diff + 1 : 1;
  }
}
