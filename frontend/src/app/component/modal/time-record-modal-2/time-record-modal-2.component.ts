import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { DayRow, FieldDef, FieldStatus, StatusMeta } from './time-record-modal-2.interface';

/**
 * Minimalist time-record editor.
 *
 * The rows are the month's calendar days — parsed out of month_data.days —
 * not the rows the uploaded file happened to contain, so a date the file
 * skipped is still visible and the Weekend / Holiday marking always matches
 * the month saved on the record.
 *
 * Dialog data: { employee, month_data }.
 */
@Component({
  selector: 'app-time-record-modal-2',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatIconModule,
    MatTooltipModule,
    MatSnackBarModule,
    MatMenuModule,
    MatDividerModule,
  ],
  templateUrl: './time-record-modal-2.component.html',
  styleUrl: './time-record-modal-2.component.scss',
})
export class TimeRecordModal2Component {

  employee: any;
  month_data: any = null;
  rows: DayRow[] = [];

  saving = false;

  private original: any;
  private auto_filled = new Set<string>();

  private readonly AM_START = 8 * 60;   // 08:00
  private readonly AM_END = 12 * 60;    // 12:00
  private readonly PM_START = 13 * 60;  // 13:00

  /** every time column stored on a log, including the two with no UI column */
  private readonly TIME_KEYS = ['amIn', 'amOut', 'pmIn', 'pmOut', 'otIn', 'otOut'];

  readonly status_options = [
    { value: 'Present', label: 'Present' },
    { value: 'Absent', label: 'Absent' },
    { value: 'Leave', label: 'Leave' },
    { value: 'Half Day', label: 'Half Day' },
    { value: 'Official Business', label: 'Official Business' },
    { value: 'Holiday', label: 'Holiday' },
  ];

  readonly status_meta: Record<string, StatusMeta> = {
    'Present': {
      icon: 'check_circle', locked: false, dot: '#1b5e20',
      tooltip: 'Present',
    },
    'Absent': {
      icon: 'event_busy', locked: true, dot: '#dc2626',
      tooltip: 'Employee was absent on this day.',
    },
    'Leave': {
      icon: 'beach_access', locked: true, dot: '#2563eb',
      tooltip: 'Employee was on approved leave on this day.',
    },
    'Half Day': {
      icon: 'hourglass_bottom', locked: false, halfDay: true, dot: '#7c3aed',
      tooltip: 'Half day — one session is not required.',
    },
    'Official Business': {
      icon: 'work', locked: true, dot: '#0891b2',
      tooltip: 'Employee was on official business on this day.',
    },
    'Holiday': {
      icon: 'celebration', locked: true, dot: '#F9A825',
      tooltip: 'Holiday — non-working day.',
    },
  };

  // OT In / OT Out are intentionally not shown; their values are folded into
  // PM Out on parse (see ParserService.resolvePmOut) and again by auto_fill
  // below, which also catches the rows the parser left alone.
  readonly fields: FieldDef[] = [
    { key: 'amIn', label: 'AM In', session: 'AM', required: false, lateAfter: this.AM_START },
    { key: 'amOut', label: 'AM Out', session: 'AM', required: false, lateAfter: null, fillValue: '12:00' },
    { key: 'pmIn', label: 'PM In', session: 'PM', required: false, lateAfter: this.PM_START, fillValue: '13:00' },
    { key: 'pmOut', label: 'PM Out', session: 'PM', required: true, lateAfter: null },
  ];

  constructor(
    private dialog_ref: MatDialogRef<TimeRecordModal2Component>,
    private snack_bar: MatSnackBar,
    @Inject(MAT_DIALOG_DATA) public data: any,
  ) {
    this.employee = JSON.parse(JSON.stringify(data?.employee ?? data));
    this.month_data = data?.month_data ?? null;

    this.rows = this.build_rows();
    this.normalize_statuses();
    this.auto_fill();

    // snapshot after normalising and auto-filling, so a status the calendar
    // supplied and a value derived from the row's own punches read as the
    // baseline rather than as an unsaved edit
    this.original = JSON.parse(JSON.stringify(this.employee));
  }

  // ---- rows ----------------------------------------------------------------

  /** The month's days as saved on month_data. */
  private calendar_days(): any[] {
    const raw = this.month_data?.days;
    if (!raw) return [];

    try {
      const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  private day_of(date: any): number | null {
    const match = String(date ?? '').match(/\d+/);
    return match ? Number(match[0]) : null;
  }

  private build_rows(): DayRow[] {
    const days = this.calendar_days();

    // no saved month yet — fall back to the file's own rows so the editor is
    // never blank; the weekday then comes off the date ("12 Sa")
    if (days.length === 0) return this.rows_from_logs();

    const by_day = new Map<number, { log: any; index: number }>();

    (this.employee.logs ?? []).forEach((log: any, index: number) => {
      const day = this.day_of(log.date);
      if (day !== null && !by_day.has(day)) by_day.set(day, { log, index });
    });

    return days
      .map((entry: any) => {
        const day = Number(entry.day);
        const match = by_day.get(day);
        const weekday = String(entry.weekday ?? '');
        const is_weekend = !!entry.is_weekend;

        return {
          day,
          weekday,
          weekday_short: weekday.slice(0, 3),
          is_weekend,
          calendar_status: entry.status ?? (is_weekend ? 'Weekend' : 'Work Day'),
          log: match?.log ?? null,
          log_index: match?.index ?? -1,
        };
      })
      .sort((a, b) => a.day - b.day);
  }

  private rows_from_logs(): DayRow[] {
    return (this.employee.logs ?? []).map((log: any, index: number) => {
      const suffix = String(log?.date ?? '').trim().match(/([A-Za-z]{2})$/)?.[1].toLowerCase();
      const is_weekend = suffix === 'sa' || suffix === 'su' || suffix === 'so';

      return {
        day: this.day_of(log.date) ?? index + 1,
        weekday: suffix ? suffix.toUpperCase() : '',
        weekday_short: suffix ? suffix[0].toUpperCase() + suffix[1] : '',
        is_weekend,
        calendar_status: is_weekend ? 'Weekend' : 'Work Day',
        log,
        log_index: index,
      };
    });
  }

  /**
   * Give every log a status: the calendar wins on a Holiday, otherwise the
   * imported Present / Absent flag stands.
   */
  private normalize_statuses(): void {
    for (const row of this.rows) {
      if (!row.log) continue;

      if (row.calendar_status === 'Holiday') {
        row.log.status = 'Holiday';
        continue;
      }
      if (!row.log.status) row.log.status = row.log.absent ? 'Absent' : 'Present';
    }
  }

  // ---- auto fill -----------------------------------------------------------

  /**
   * Fill what the imported row leaves implicit: a morning punch that landed in
   * another column becomes AM In, and the OT pair resolves PM Out.
   *
   * Runs once, before the baseline snapshot, so the derived values read as the
   * record rather than as unsaved edits. Rows with no log and fields the row's
   * status disables are skipped — a locked day carries no times at all, and the
   * off session of a half day is not required.
   */
  private auto_fill(): void {
    const am_in = this.fields.find(field => field.key === 'amIn')!;
    const pm_out = this.fields.find(field => field.key === 'pmOut')!;

    for (const row of this.rows) {
      if (!row.log) continue;

      if (!this.is_field_disabled(row, am_in)) this.fill_am_in(row);
      if (!this.is_field_disabled(row, pm_out)) this.fill_pm_out(row);
    }
  }

  /**
   * An empty AM In on a day that still has a punch between 08:00 and 12:00:
   * that punch is the arrival the file filed under the wrong column, so copy
   * it over. The columns are searched in their own order — AM Out first, then
   * PM In and the rest — so the leftmost morning punch wins. 12:00 itself is
   * left out: it is the canonical AM Out, not an arrival.
   *
   * The source column keeps its value; it is written back on export.
   */
  private fill_am_in(row: DayRow): void {
    if (!this.is_blank(row.log.amIn)) return;

    for (const key of this.TIME_KEYS) {
      if (key === 'amIn') continue;

      const mins = this.to_minutes(row.log[key]);
      if (mins === null) continue;
      if (mins < this.AM_START || mins >= this.AM_END) continue;

      row.log.amIn = row.log[key];
      return;
    }
  }

  /**
   * PM Out follows the OT pair, in the order OT Out → OT In → the PM Out the
   * file already carries. OT Out is the last punch of the day, so it stands as
   * PM Out whether or not OT In was recorded and whether or not PM Out already
   * has a value. OT In only stands in when there is no OT Out and PM Out is
   * blank — it marks when overtime began, so it never displaces a real PM Out.
   *
   * Same copy as ParserService.resolvePmOut, plus the case that one skips: a
   * PM Out that is already filled.
   */
  private fill_pm_out(row: DayRow): void {
    const log = row.log;

    if (!this.is_blank(log.otOut)) log.pmOut = log.otOut;
    else if (this.is_blank(log.pmOut) && !this.is_blank(log.otIn)) log.pmOut = log.otIn;
  }

  // ---- header summary ------------------------------------------------------

  get period_label(): string {
    return this.month_data?.name ?? '';
  }

  get work_day_count(): number {
    return this.rows.filter(row => row.calendar_status === 'Work Day').length;
  }

  get holiday_count(): number {
    return this.rows.filter(row => row.calendar_status === 'Holiday').length;
  }

  get missing_count(): number {
    return this.rows.filter(row => !row.log).length;
  }

  // ---- status --------------------------------------------------------------

  meta(log: any): StatusMeta {
    return this.status_meta[log?.status] ?? this.status_meta['Present'];
  }

  /** What the row reads as: the calendar's word on rest days, else the status. */
  status_label(row: DayRow): string {
    if (row.is_weekend) return 'Rest Day';
    if (!row.log) return 'No record';
    return row.log.status ?? 'Present';
  }

  status_dot(row: DayRow): string {
    if (row.is_weekend) return '#9ca3af';
    if (!row.log) return '#d1d5db';
    return this.meta(row.log).dot;
  }

  can_change_status(row: DayRow): boolean {
    return !!row.log && !row.is_weekend && !this.saving;
  }

  set_status(row: DayRow, value: string): void {
    if (!this.can_change_status(row)) return;

    row.log.status = value;
    if (value !== 'Half Day') delete row.log.halfSession;
    if (value === 'Absent' || value === 'Holiday') this.clear_time_fields(row);
  }

  set_half_day(row: DayRow, session: 'AM' | 'PM'): void {
    if (!this.can_change_status(row)) return;
    row.log.status = 'Half Day';
    row.log.halfSession = session;
  }

  is_half_day(row: DayRow): boolean {
    return row.log?.status === 'Half Day';
  }

  half_session(row: DayRow): 'AM' | 'PM' {
    return row.log?.halfSession === 'PM' ? 'PM' : 'AM';
  }

  /**
   * Blank every time column on a row, whatever the value came from — the
   * imported file, fill_all_blank, or a manual edit. OT In / OT Out go too:
   * they have no column here but are written back on export.
   */
  private clear_time_fields(row: DayRow): void {
    for (const key of this.TIME_KEYS) {
      row.log[key] = '';
      if (row.log_index >= 0) this.auto_filled.delete(`${row.log_index}-${key}`);
    }
  }

  is_locked(row: DayRow): boolean {
    if (!row.log) return true;
    if (row.is_weekend) return true;
    return this.meta(row.log).locked;
  }

  // ---- fields --------------------------------------------------------------

  is_field_disabled(row: DayRow, field: FieldDef): boolean {
    if (this.saving) return true;
    if (this.is_locked(row)) return true;

    if (this.is_half_day(row)) {
      const off_session = this.half_session(row) === 'PM' ? 'AM' : 'PM';
      if (field.session === off_session) return true;
    }
    return false;
  }

  field_tooltip(row: DayRow, field: FieldDef): string {
    if (row.is_weekend) return 'Rest day — non-working';
    if (!row.log) return 'The uploaded file has no row for this date';

    if (this.is_field_disabled(row, field)) {
      if (this.is_half_day(row)) {
        const off = this.half_session(row) === 'PM' ? 'morning' : 'afternoon';
        return `Half day — ${off} session is not required.`;
      }
      return this.meta(row.log).tooltip;
    }

    const status = this.status_tooltip(row, field);
    return this.is_modified(row, field)
      ? `${status} · was ${this.original_value(row, field)}`
      : status;
  }

  private to_minutes(value: any): number | null {
    if (value === null || value === undefined || String(value).trim() === '') return null;
    const match = String(value).trim().match(/^(\d{1,2}):(\d{2})/);
    if (!match) return null;
    return Number(match[1]) * 60 + Number(match[2]);
  }

  private is_blank(value: any): boolean {
    return value === null || value === undefined || String(value).trim() === '';
  }

  get_status(log: any, field: FieldDef): FieldStatus {
    const value = log?.[field.key];

    if (this.is_blank(value)) return field.required ? 'blank-required' : 'blank-optional';

    if (field.lateAfter !== null) {
      const mins = this.to_minutes(value);
      if (mins !== null) return mins > field.lateAfter ? 'late' : 'ontime';
    }

    return field.lateAfter !== null ? 'ontime' : 'neutral';
  }

  input_classes(row: DayRow, field: FieldDef): Record<string, boolean> {
    if (!row.log) return {};
    const status = this.get_status(row.log, field);

    return {
      'trm-input--late': status === 'late',
      'trm-input--missing': status === 'blank-required' && !this.is_field_disabled(row, field),
      'trm-input--edited': this.is_modified(row, field),
    };
  }

  status_tooltip(row: DayRow, field: FieldDef): string {
    switch (this.get_status(row.log, field)) {
      case 'late': return 'Late';
      case 'ontime': return 'On time';
      case 'blank-required': return 'Required';
      case 'blank-optional': return 'Optional';
      default: return '';
    }
  }

  // ---- column fill ---------------------------------------------------------

  is_fillable(field: FieldDef): boolean {
    return !!field.fillValue;
  }

  can_fill_any_blank(field: FieldDef): boolean {
    if (!this.is_fillable(field)) return false;
    return this.rows.some(
      row => !this.is_field_disabled(row, field) && this.is_blank(row.log[field.key])
    );
  }

  fill_all_blank(field: FieldDef): void {
    if (!this.is_fillable(field)) return;

    for (const row of this.rows) {
      if (this.is_field_disabled(row, field)) continue;
      if (!this.is_blank(row.log[field.key])) continue;

      row.log[field.key] = field.fillValue;
      if (row.log_index >= 0) this.auto_filled.add(`${row.log_index}-${field.key}`);
    }
  }

  /** True once a cell in this column was auto-filled and not yet cleared. */
  has_auto_filled(field: FieldDef): boolean {
    return this.rows.some(row => this.is_auto_filled(row, field));
  }

  /** Restore every auto-filled cell in this column to its original value. */
  clear_auto_filled(field: FieldDef): void {
    for (const row of this.rows) {
      if (!this.is_auto_filled(row, field)) continue;

      row.log[field.key] = this.original?.logs?.[row.log_index]?.[field.key] ?? '';
      this.auto_filled.delete(`${row.log_index}-${field.key}`);
    }
  }

  is_auto_filled(row: DayRow, field: FieldDef): boolean {
    return row.log_index >= 0 && this.auto_filled.has(`${row.log_index}-${field.key}`);
  }

  /** Blank editable cells left in a column — recomputed on every CD pass. */
  blank_count(field: FieldDef): number {
    let count = 0;

    for (const row of this.rows) {
      if (this.is_field_disabled(row, field)) continue;
      if (this.is_blank(row.log[field.key])) count++;
    }
    return count;
  }

  // ---- edits ---------------------------------------------------------------

  private norm(value: any): string {
    return this.is_blank(value) ? '' : String(value).trim();
  }

  is_edited(row: DayRow, field: FieldDef): boolean {
    if (row.log_index < 0) return false;
    const before = this.original?.logs?.[row.log_index]?.[field.key];
    return this.norm(before) !== this.norm(row.log[field.key]);
  }

  is_modified(row: DayRow, field: FieldDef): boolean {
    if (!row.log || this.is_field_disabled(row, field)) return false;
    return this.is_edited(row, field);
  }

  original_value(row: DayRow, field: FieldDef): string {
    const value = this.original?.logs?.[row.log_index]?.[field.key];
    return this.is_blank(value) ? '—' : String(value).trim();
  }

  is_status_edited(row: DayRow): boolean {
    if (row.log_index < 0) return false;
    const before = this.original?.logs?.[row.log_index];
    return before?.status !== row.log.status || before?.halfSession !== row.log.halfSession;
  }

  get edited_count(): number {
    let count = 0;

    for (const row of this.rows) {
      if (this.is_status_edited(row)) count++;
      for (const field of this.fields) {
        if (this.is_modified(row, field)) count++;
      }
    }
    return count;
  }

  /**
   * Dates whose Holiday state changed here, so the parent can cascade them to
   * every other employee.
   */
  private holiday_diffs(): { added: string[]; removed: string[] } {
    const added: string[] = [];
    const removed: string[] = [];

    for (const row of this.rows) {
      if (row.log_index < 0) continue;

      const before = this.original?.logs?.[row.log_index]?.status;
      const after = row.log.status;
      if (before === after) continue;

      if (after === 'Holiday') added.push(row.log.date);
      else if (before === 'Holiday') removed.push(row.log.date);
    }

    return { added, removed };
  }

  // ---- save ----------------------------------------------------------------

  private required_fields(row: DayRow): FieldDef[] {
    if (this.is_half_day(row)) {
      return this.half_session(row) === 'PM'
        ? this.fields.filter(field => field.key === 'pmOut')
        : this.fields.filter(field => field.key === 'amOut');
    }
    return this.fields.filter(field => field.required);
  }

  private validate(): string | null {
    for (const row of this.rows) {
      if (this.is_locked(row)) continue;

      const editable = this.fields.filter(field => !this.is_field_disabled(row, field));
      const has_any = editable.some(field => !this.is_blank(row.log[field.key]));
      if (!has_any) continue;

      const missing = this.required_fields(row)
        .filter(field => this.is_blank(row.log[field.key]))
        .map(field => field.label);

      if (missing.length) {
        return `${row.day} ${row.weekday_short}: missing required ${missing.join(' & ')}.`;
      }
    }
    return null;
  }

  async save() {
    if (this.saving) return;

    const error = this.validate();
    if (error) {
      this.snack_bar.open(error, 'Dismiss', { duration: 5000, panelClass: 'tr-snack-error' });
      return;
    }

    this.saving = true;

    try {
      await this.persist();

      const holidays = this.holiday_diffs();
      const message = holidays.added.length
        ? `Saved. ${holidays.added.length} holiday${holidays.added.length > 1 ? 's' : ''} applied to all employees.`
        : 'Time records saved successfully.';

      this.snack_bar.open(message, 'OK', { duration: 3000, panelClass: 'tr-snack-success' });

      this.dialog_ref.close({
        employee: this.employee,
        holidaysAdded: holidays.added,
        holidaysRemoved: holidays.removed,
      });
    } catch {
      this.saving = false;
      this.snack_bar.open('Failed to save time records. Please try again.', 'Retry', {
        duration: 5000,
        panelClass: 'tr-snack-error',
      });
    }
  }

  private persist(): Promise<void> {
    return Promise.resolve();
  }

  close() {
    this.dialog_ref.close(null);
  }
}
