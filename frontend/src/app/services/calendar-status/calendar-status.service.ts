import { Injectable } from '@angular/core';

export const CALENDAR_STATUS_OPTIONS = [
  { value: 'Work Day', icon: 'work_history' },
  { value: 'Holiday', icon: 'celebration' },
]; 
@Injectable({
  providedIn: 'root'
})
export class CalendarStatusService {

  private overrides = new Map<string, string>();

  private build_key(year: any, month: any, day: any): string {
    return `${Number(year)}-${Number(month)}-${Number(day)}`;
  }
 
  get_status(year: any, month: any, day: any): string | null {
    return this.overrides.get(this.build_key(year, month, day)) ?? null;
  }
 
  set_status(year: any, month: any, day: any, status: string | null): void {
    const key = this.build_key(year, month, day);
    if (status) this.overrides.set(key, status);
    else this.overrides.delete(key);
  }
 
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
