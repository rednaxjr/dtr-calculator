import { Component, ContentChild, Input, OnChanges, SimpleChanges, TemplateRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';

export interface CalendarDay {
  date: number;
  weekday: number;
  weekdayLabel: string;
  weekdayFull: string;
  isWeekend: boolean;
  /** resolved status: an override when set, otherwise Weekend / Work Day */
  status: string;
}

export const WEEKDAY_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
export const WEEKDAY_FULL = [
  'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'
];
export const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

/**
 * Every date in a month, with its resolved status. Shared by the calendar view
 * and by callers that need the same data while the calendar isn't rendered
 * (the upload submit payload), so both always agree.
 */
export function build_calendar_days(
  year: any,
  month: any,
  statuses: Record<number, string> | null = null,
): CalendarDay[] {
  const y = Number(year);
  const m = Number(month);

  if (!Number.isInteger(y) || !Number.isInteger(m)) return [];
  if (m < 1 || m > 12) return [];

  // day 0 of the next month resolves to the last day of this one,
  // so leap years and 28/29/30/31 day months are all handled here.
  const daysInMonth = new Date(y, m, 0).getDate();
  const days: CalendarDay[] = [];

  for (let date = 1; date <= daysInMonth; date++) {
    const weekday = new Date(y, m - 1, date).getDay();
    const isWeekend = weekday === 0 || weekday === 6;

    days.push({
      date,
      weekday,
      weekdayLabel: WEEKDAY_SHORT[weekday],
      weekdayFull: WEEKDAY_FULL[weekday],
      isWeekend,
      status: statuses?.[date] ?? (isWeekend ? 'Weekend' : 'Work Day'),
    });
  }

  return days;
}

@Component({
  selector: 'app-month-calendar',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  templateUrl: './month-calendar.component.html',
  styleUrl: './month-calendar.component.scss'
})
export class MonthCalendarComponent implements OnChanges {

  /** Four digit year, e.g. 2026 */
  @Input() year: any = null;
  /** Month number, 1 = January ... 12 = December */
  @Input() month: any = null;
  /**
   * Status overrides for this month, keyed by day-of-month. Pass a new object
   * to re-render — the calendar rebuilds whenever this reference changes.
   */
  @Input() statuses: Record<number, string> | null = null;
  @ContentChild(TemplateRef) dayTemplate?: TemplateRef<any>;

  readonly weekdayHeaders = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

  private readonly monthNames = MONTH_NAMES;

  days: CalendarDay[] = [];
  leadingBlanks: number[] = [];
  monthLabel = '';

  ngOnChanges(changes: SimpleChanges) {
    if (changes['year'] || changes['month'] || changes['statuses']) this.generate();
  }

  get hasPeriod(): boolean {
    return this.days.length > 0;
  }

  get workdayCount(): number {
    return this.days.filter(d => d.status === 'Work Day').length;
  }

  get weekendCount(): number {
    return this.days.filter(d => d.status === 'Weekend').length;
  }

  get holidayCount(): number {
    return this.days.filter(d => d.status === 'Holiday').length;
  }

  private generate() {
    this.days = build_calendar_days(this.year, this.month, this.statuses);
    this.leadingBlanks = [];
    this.monthLabel = '';

    if (this.days.length === 0) return;

    this.monthLabel = this.monthNames[Number(this.month) - 1];

    const firstWeekday = new Date(Number(this.year), Number(this.month) - 1, 1).getDay();
    this.leadingBlanks = Array.from({ length: firstWeekday }, (_, i) => i);
  }
}
