import type { ServiceRecord } from '@/lib/serviceRecords';

export interface DailyCount {
  label: string;
  count: number;
}

export interface ServiceStats {
  total: number;
  thisMonth: number;
  attentionCases: number;
  lastSevenDays: DailyCount[];
}

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export function computeServiceStats(records: ServiceRecord[], now: Date): ServiceStats {
  const today = startOfDay(now);
  const dayKeys = Array.from({ length: 7 }, (_, index) => {
    const day = new Date(today);
    day.setDate(today.getDate() - (6 - index));
    return day;
  });

  const countsByDay = new Map<number, number>();
  let thisMonth = 0;
  let attentionCases = 0;

  for (const record of records) {
    const attended = new Date(record.attendedAt);
    if (Number.isNaN(attended.getTime())) continue;

    if (attended.getMonth() === now.getMonth() && attended.getFullYear() === now.getFullYear()) {
      thisMonth += 1;
    }
    if (record.connectionMode === 'recovery' || record.connectionMode === 'dfu') {
      attentionCases += 1;
    }
    const dayKey = startOfDay(attended).getTime();
    countsByDay.set(dayKey, (countsByDay.get(dayKey) ?? 0) + 1);
  }

  return {
    total: records.length,
    thisMonth,
    attentionCases,
    lastSevenDays: dayKeys.map((day) => ({
      label: day.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', ''),
      count: countsByDay.get(day.getTime()) ?? 0,
    })),
  };
}
