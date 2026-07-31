import { Injectable } from '@angular/core';

export const CALENDAR_STATUS_OPTIONS = [
  { value: 'Work Day', icon: 'work_history' },
  { value: 'Holiday', icon: 'celebration' },
];

/**
 * Single source of truth for per-date calendar statuses.
 *
 * Only explicit user overrides are stored; a date with no override falls back
 * to Weekend / Work Day, derived from the day of week by the caller. Keys are
 * year + month + day-of-month, which is also how attendance logs are matched
 * (ParserService.dayKey pulls the day number out of a log date like "1 Mo").
 */
@Injectable({
  providedIn: 'root'
})
export class CalendarStatusService {

  private overrides = new Map<string, string>();

  private build_key(year: any, month: any, day: any): string {
    return `${Number(year)}-${Number(month)}-${Number(day)}`;
  }

  /** The status the user explicitly set for a date, or null when untouched. */
  get_status(year: any, month: any, day: any): string | null {
    return this.overrides.get(this.build_key(year, month, day)) ?? null;
  }

  /** Passing a null status clears the override and restores the default. */
  set_status(year: any, month: any, day: any, status: string | null): void {
    const key = this.build_key(year, month, day);
    if (status) this.overrides.set(key, status);
    else this.overrides.delete(key);
  }

  /** Every override in a month, keyed by day-of-month. Always a new object. */
  month_map(year: any, month: any): Record<number, string> {
    const map: Record<number, string> = {};
    if (!year || !month) return map;

    const prefix = `${Number(year)}-${Number(month)}-`;
    for (const [key, status] of this.overrides) {
      if (!key.startsWith(prefix)) continue;
      map[Number(key.slice(prefix.length))] = status;
    }
    return map;
  }

  clear_month(year: any, month: any): void {
    const prefix = `${Number(year)}-${Number(month)}-`;
    for (const key of Array.from(this.overrides.keys())) {
      if (key.startsWith(prefix)) this.overrides.delete(key);
    }
  }
}
