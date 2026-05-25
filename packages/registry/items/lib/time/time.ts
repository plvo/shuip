export const MINUTE_STEP = 5;

export const HOUR_OPTIONS: string[] = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'));

export const MINUTE_OPTIONS: string[] = Array.from({ length: 60 / MINUTE_STEP }, (_, i) =>
  String(i * MINUTE_STEP).padStart(2, '0'),
);

export type TimeRangeValue = { start: string; end: string };

export function splitTime(time: string): { hour: string; minute: string } {
  const [hour = '', minute = ''] = time.split(':');
  return { hour, minute };
}

export function joinTime(hour: string, minute: string): string {
  if (!hour && !minute) return '';
  return `${hour || '00'}:${minute || '00'}`;
}

export function toMinutes(time: string): number | null {
  const { hour, minute } = splitTime(time);
  if (!hour || !minute) return null;
  const h = Number(hour);
  const m = Number(minute);
  if (Number.isNaN(h) || Number.isNaN(m)) return null;
  return h * 60 + m;
}

export function fromMinutes(total: number): string {
  const clamped = Math.max(0, Math.min(total, 24 * 60 - MINUTE_STEP));
  const h = Math.floor(clamped / 60);
  const m = clamped % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

export function addOneHour(time: string): string {
  const minutes = toMinutes(time);
  if (minutes === null) return time;
  return fromMinutes(minutes + 60);
}

export function nextSlot(time: string): string {
  const minutes = toMinutes(time);
  if (minutes === null) return time;
  return fromMinutes(minutes + MINUTE_STEP);
}

export function isHourDisabled(hour: string, bounds?: { min?: string; max?: string }): boolean {
  if (!hour) return false;
  const h = Number(hour);
  if (Number.isNaN(h)) return false;
  const hourStart = h * 60;
  const hourEnd = h * 60 + 55;
  const min = bounds?.min ? toMinutes(bounds.min) : null;
  const max = bounds?.max ? toMinutes(bounds.max) : null;
  if (min !== null && hourEnd < min) return true;
  if (max !== null && hourStart > max) return true;
  return false;
}

export function isMinuteDisabled(minute: string, hour: string, bounds?: { min?: string; max?: string }): boolean {
  if (!hour || !minute) return false;
  const t = toMinutes(joinTime(hour, minute));
  if (t === null) return false;
  const min = bounds?.min ? toMinutes(bounds.min) : null;
  const max = bounds?.max ? toMinutes(bounds.max) : null;
  if (min !== null && t < min) return true;
  if (max !== null && t > max) return true;
  return false;
}
