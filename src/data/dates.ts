import type {DateRange, PeriodKind} from './types';

export function dateKey(date = new Date()): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

export function fromDateKey(value: string): Date {
  const [year = 0, month = 0, day = 0] = value.split('-').map(Number);
  return new Date(year, month - 1, day, 12);
}

export function assertDate(value: string): void {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value) || dateKey(fromDateKey(value)) !== value || value < '1900-01-01' || value > '2199-12-31') {
    throw new Error('Укажите корректную дату с 1900 по 2199 год.');
  }
  if (value > dateKey()) { throw new Error('Фактическую операцию нельзя записать будущей датой.'); }
}

export function shortDate(value: string): string {
  return fromDateKey(value).toLocaleDateString('ru-RU');
}

export function period(kind: PeriodKind, anchor = new Date()): DateRange {
  const year = anchor.getFullYear();
  const month = anchor.getMonth();
  let start = new Date(year, month, 1);
  let end = new Date(year, month + 1, 0);
  if (kind === 'week') {
    start = new Date(year, month, anchor.getDate() - (anchor.getDay() + 6) % 7);
    end = new Date(start.getFullYear(), start.getMonth(), start.getDate() + 6);
  } else if (kind === 'quarter') {
    start = new Date(year, Math.floor(month / 3) * 3, 1);
    end = new Date(year, Math.floor(month / 3) * 3 + 3, 0);
  } else if (kind === 'year') {
    start = new Date(year, 0, 1);
    end = new Date(year, 11, 31);
  } else if (kind === 'all') {
    return {kind, start: '1900-01-01', end: '2199-12-31'};
  }
  return {kind, start: dateKey(start), end: dateKey(end)};
}

export function periodLabel(range: DateRange): string {
  return range.kind === 'all' ? 'За всё время' : `${shortDate(range.start)} — ${shortDate(range.end)}`;
}

export function dueDate(day: number): string {
  const now = new Date();
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  return dateKey(new Date(now.getFullYear(), now.getMonth(), Math.min(day, lastDay)));
}
