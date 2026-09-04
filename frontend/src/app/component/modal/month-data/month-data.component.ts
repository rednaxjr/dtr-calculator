import { Component, signal, OnDestroy, ViewChild, ElementRef, OnInit, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { FormBuilder, FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';

import { MatIconModule } from '@angular/material/icon';
import { MAT_DIALOG_DATA, MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { DtrService } from '../../../services/dtr/dtr.service';
import { MonthCalendarComponent, build_calendar_days, MONTH_NAMES } from '../../parts/month-calendar/month-calendar.component';
import { CalendarStatusComponent } from '../calendar-status/calendar-status.component';
import { ValidationService } from '../../../services/validation/validation.service';
import { ConfirmationService } from '../../../services/general/confirmation.service';
import { EmployeeService } from '../../../services/employee/employee.service';
import { MonthService } from '../../../services/month/month.service';
import { SalaryTypeService } from '../../../services/salary-type/salary-type.service';
import { YearService } from '../../../services/year/year.service';
import { CalendarStatusService } from '../../../services/calendar-status/calendar-status.service';
import { MonthDataService } from '../../../services/month_data/month-data.service';

CalendarStatusComponent
MonthCalendarComponent
DtrService

@Component({
  selector: 'app-month-data',
  standalone: true,
  imports: [CommonModule, RouterModule, MatButtonModule, MatIconModule, MatDialogModule, MatSnackBarModule, FormsModule, MonthCalendarComponent, TableLandscapeComponent],
  templateUrl: './month-data.component.html',
  styleUrl: './month-data.component.scss'
})
export class MonthDataComponent {


  headers: any = ["id", "name", "late", "present", "actions"]
  isDragging = signal(false);
  file_name: any = "";
  saving = false;
  banner: any;
  view_number_data: any = 1;
  url_id: any = null;
  sections = [
    { title: 'File Information', id: 1 },
    { title: 'DTR Records', id: 2 },
  ];

  activeTab = 0;
  dropdownOpen = false;
  year_list: any = [];
  year_list_backup: any = [];
  month_list: any = [];
  month_list_backup: any = [];

  year_id: any = null;
  month_id: any = null;
  year_value: any = null;
  month_number: any = null;

  /** dtr_count per month id, loaded for the selected year */
  month_counts: Record<number, number> = {};

  /** months already saved to month_data, so they can't be added twice */
  existing_month_data: any = [];

  /** the month_data row being viewed / updated, null when adding a new one */
  month_data: any = null;

  calendar_statuses: Record<number, string> = {};

  new_data: any;
  constructor(
    @Inject(MAT_DIALOG_DATA) public data: any,
    public dialog: MatDialogRef<MonthDataComponent>,
    private dialog_service: MatDialog,
    public validation_service: ValidationService,
    private confirmation_service: ConfirmationService,
    private employee_service: EmployeeService,
    private month_service: MonthService,
    private salary_type_service: SalaryTypeService,
    private year_service: YearService,
    private calender_status_service: CalendarStatusService,
    private month_data_service: MonthDataService,
    private router: Router

  ) {
    this.year_list = data.year_list;
    this.year_list_backup = this.year_list;
    this.month_list = data.month_list;
    this.month_list_backup = this.month_list;
    this.existing_month_data = data.month_data_list;
    this.month_data = data.month_data;
  }

  ngOnInit() {
    if (this.month_data) this.load_month_data(this.month_data);
  }

  load_month_data(data: any) {
    this.year_id = Number(data.year_id);
    this.month_id = Number(data.month_id);

    this.year_value = Number(
      data.year ?? this.year_list.find((y: any) => y.id === data.year_id)?.name
    ); 
    this.month_number = Number(
      data.month_number ?? this.month_list_backup.find((m: any) => m.id === data.month_id)?.number
    );

    this.month_list = this.month_list_backup
      .filter((m: any) => Number(m.year_id) === Number(this.year_id))
      .sort((a: any, b: any) => Number(a.number) - Number(b.number));

    for (const day of JSON.parse(data.days)) {
      const default_status = day.is_weekend ? 'Weekend' : 'Work Day';
      if (day.status && day.status !== default_status) {
        this.calender_status_service.set_status(
          this.year_value, this.month_number, day.day, day.status
        );
      }
    } 
    this.sync_calendar_statuses();
  }
  on_year_change(id: any) {
    const item = this.year_list.find((y: any) => y.id === id);
    if (!item) return;

    this.year_id = item.id;
    this.year_value = Number(item.name);
    this.month_id = null;
    this.month_number = null;
    this.month_counts = {};
    this.calendar_statuses = {};

    this.month_list = this.month_list_backup;

    this.month_list = this.month_list.filter((m: any) => Number(m.year_id) === Number(item.id))
      .sort((a: any, b: any) => Number(a.number) - Number(b.number));
    this.year_service.get_year_month(item).subscribe((res: any) => {
      const counts: Record<number, number> = {};
      for (const row of res.data ?? []) counts[row.id] = Number(row.dtr_count ?? 0);
      this.month_counts = counts;
    }); 

  }

  on_month_change(id: any) {
    const item = this.month_list.find((m: any) => m.id === id);
    if (item) this.select_month(item);
  }

  month_count_for(item: any): number {
    return this.month_counts[item?.id] ?? Number(item?.dtr_count ?? 0);
  }

  has_month_data(item: any): boolean {
    if (!item?.id) return false;
    return this.existing_month_data.some(
      (row: any) => Number(row.month_id) === Number(item.id)
    );
  }


  select_month(data: any) {
    if (this.is_month_disabled(data)) return;

    this.month_id = data.id;
    this.month_number = Number(data.number);

    this.sync_calendar_statuses();
  }
  is_month_disabled(item: any): boolean {
    return !this.is_month_elapsed(item)
      || this.has_month_data(item)
      || this.month_count_for(item) > 0;
  }

  get has_selectable_month(): boolean {
    return this.month_list.some((m: any) => !this.is_month_disabled(m));
  }

  get month_placeholder(): string {
    if (this.year_id === null) return 'Select Year First';
    if (!this.has_selectable_month) return 'No available months for this year';
    return 'Select Month';
  }
  private sync_calendar_statuses() {
    this.calendar_statuses = this.calender_status_service.month_map(this.year_value, this.month_number); 
  }

  is_month_elapsed(item: any): boolean {
    if (!this.year_value) return false;

    const year = Number(this.year_value);
    const month = Number(item?.number);
    if (!Number.isFinite(year) || !Number.isFinite(month)) return false;

    const now = new Date();
    const current_year = now.getFullYear();
    const current_month = now.getMonth() + 1;

    if (year < current_year) return true;
    if (year > current_year) return false;
    return month < current_month;
  }

  month_option_label(item: any): string {
    if (!this.is_month_elapsed(item)) return `${item.name} — Unavailable`;
    if (this.has_month_data(item)) return `${item.name} — Already Added`;
    if (this.month_count_for(item) > 0) return `${item.name} — Already Uploaded`;
    return item.name;
  }

  day_status(day: any): string {
    return this.calendar_statuses[day?.date] ?? (day?.isWeekend ? 'Weekend' : 'Work Day');
  }

  update_status(day: any) {
    if (!this.year_value || !this.month_number) return;

    const ref = this.dialog_service.open(CalendarStatusComponent, {
      width: '50vw',
      maxWidth: '50vw',
      height: '50vh',
      maxHeight: '50vh',
      panelClass: 'fullscreen-dialog',
      autoFocus: true,
      disableClose: true,
      data: {
        year: this.year_value,
        month: this.month_number,
        month_label: this.month_list.find((m: any) => m.id === this.month_id)?.name ?? '',
        day,
        status: this.day_status(day),
      },
    });

    ref.afterClosed().subscribe((result: any) => {
      if (!result) return;
      const is_default = result.status === (day.isWeekend ? 'Weekend' : 'Work Day');
      this.calender_status_service.set_status(
        this.year_value, this.month_number, day.date, is_default ? null : result.status
      );

      this.sync_calendar_statuses();
    });
  }


  submit() {
    const days = build_calendar_days(this.year_value, this.month_number, this.calendar_statuses);
    const count_of = (status: string) => days.filter(day => day.status === status).length;
    const data = {
      year_id: this.year_id,
      month_id: this.month_id,
      year: this.year_value,
      month: this.month_number,
      month_name: MONTH_NAMES[Number(this.month_number) - 1],
      total_days: days.length,
      workday_count: count_of('Work Day'),
      weekend_count: count_of('Weekend'),
      holiday_count: count_of('Holiday'),
      days: days.map(day => ({
        day: day.date,
        weekday: day.weekdayFull,
        is_weekend: day.isWeekend,
        status: day.status,
      })),
    }
    if (this.data.title == "Add") { 
      return this.month_data_service.add_month_data(data).subscribe({
        next: (res: any) => {
          if (res.success) {
            this.confirmation_service.confirm({
              title: 'Month Data Added',
              message: 'Month data has been successfully added.',
              confirmText: 'OK',
              type: 'success',
            }).subscribe((confirmed: boolean) => {
              if (confirmed) {
                // the caller flashes the saved row, so say which one it was
                this.dialog.close({
                  action: 'added',
                  year_id: this.year_id,
                  month_id: this.month_id,
                });
              }
            });
          }
        },
        error: (err: any) => {
          if (err.status === 409) {
            this.confirmation_service.confirm({
              title: 'Already Exists',
              message: err.error.message,
              confirmText: 'OK',
            });
          } else {
            this.confirmation_service.confirm({
              title: 'Something went wrong',
              message: 'An error occurred while saving the month data. Please try again.',
              confirmText: 'OK',
              type: 'danger',
            });
          }
        }
      });
    } else { 
      return this.month_data_service.update_month_data(data).subscribe({
        next: (res: any) => {
          if (res.success) {
            this.confirmation_service.confirm({
              title: 'Month Data Updated',
              message: 'Month data has been successfully updated.',
              confirmText: 'OK',
              type: 'success',
            }).subscribe((confirmed: boolean) => {
              if (confirmed) {
                this.dialog.close({
                  action: 'updated',
                  year_id: this.year_id,
                  month_id: this.month_id,
                });
              }
            });
          }
        },
        error: (err: any) => {
          if (err.status === 409) {
            this.confirmation_service.confirm({
              title: 'Already Exists',
              message: err.error.message,
              confirmText: 'OK',
            });
          } else {
            this.confirmation_service.confirm({
              title: 'Something went wrong',
              message: 'An error occurred while saving the month data. Please try again.',
              confirmText: 'OK',
              type: 'danger',
            });
          }
        }
      });
    }

  }
  /** logs come back from the API as a JSON string */
  private parse_logs(raw: any): any[] {
    if (Array.isArray(raw)) return raw;
    if (!raw) return [];

    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  view_logs(row: any) {
    this.dialog_service.open(TimeRecordModal2Component, {
      data: { employee: row, month_data: this.month_data },
      width: '75vw',
      height: '92vh',
      maxWidth: '75vw',
      maxHeight: '92vh',
      panelClass: 'time-record-dialog',
    });
  }

  /** the month's days as saved on the record, or [] when none were stored */
  private calendar_days_for_export(): any[] {
    const raw = this.month_data?.days;
    if (!raw) return [];

    try {
      const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  /** logs carry the date as "12 Sa", so take the leading number */
  private day_number(date: any): number | null {
    const match = String(date ?? '').match(/\d+/);
    return match ? Number(match[0]) : null;
  }

  private month_label(): string {
    const month = this.month_data?.month
      ?? this.month_list_backup.find((m: any) => m.id === this.month_id)?.name
      ?? MONTH_NAMES[Number(this.month_number) - 1]
      ?? '';
    const year = this.month_data?.year ?? this.year_value ?? '';
    return month && year ? `${month}, ${year}` : `${month}${year}`.trim();
  }

  /** Excel forbids : \ / ? * [ ] in a tab name and caps it at 31 characters */
  private sheet_name(name: any, used: Set<string>): string {
    const base = String(name ?? 'Employee')
      .replace(/[:\\\/?*\[\]]/g, ' ')
      .trim()
      .slice(0, 31) || 'Employee';

    let candidate = base;
    let n = 2;
    while (used.has(candidate.toLowerCase())) {
      const suffix = ` (${n++})`;
      candidate = base.slice(0, 31 - suffix.length) + suffix;
    }

    used.add(candidate.toLowerCase());
    return candidate;
  }
 
  download() {
    if (!this.dtr_logs.length) return;

    const label = this.month_label();
    const days = this.calendar_days_for_export();
    const book = utils.book_new();

    const summary: any[][] = [
      [`DTR Records — ${label}`],
      [],
      ['Employee', 'Present', 'Absent'],
      ...this.dtr_logs.map((row: any) => [
        row.name ?? '',
        Number(row.present ?? 0),
        Number(row.absent ?? 0),
      ]),
    ];
    const summary_sheet = utils.aoa_to_sheet(summary);
    summary_sheet['!cols'] = [{ wch: 32 }, { wch: 10 }, { wch: 10 }];
    utils.book_append_sheet(book, summary_sheet, 'Summary');

    const used = new Set<string>(['summary']);
    for (const row of this.dtr_logs) {
      utils.book_append_sheet(
        book,
        this.build_dtr_sheet(row, days, label),
        this.sheet_name(row.name, used),
      );
    }

    const buffer = write(book, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `DTR_${label.replace(/[\s,]+/g, '_') || 'Records'}.xlsx`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(url), 0);
  }
 
  private build_dtr_sheet(row: any, days: any[], month_label: string): any {
    const by_day = new Map<number, any>();
    for (const log of row.logs ?? []) {
      const day = this.day_number(log?.date);
      if (day !== null && !by_day.has(day)) by_day.set(day, log);
    }

    // the month's days when it has them, so a date the file skipped still
    // gets a line; otherwise fall back to whatever the file did carry
    const entries = days.length
      ? days.map((entry: any) => ({
        day: Number(entry.day),
        weekday: String(entry.weekday ?? ''),
        is_weekend: !!entry.is_weekend,
        status: entry.status,
        log: by_day.get(Number(entry.day)) ?? null,
      }))
      : (row.logs ?? []).map((log: any, index: number) => ({
        day: this.day_number(log?.date) ?? index + 1,
        weekday: '',
        is_weekend: false,
        status: null,
        log,
      }));

    let total = 0;
    const body: any[][] = [];

    for (const entry of entries) {
      const log = entry.log;
      const has_am = !!(log?.amIn || log?.amOut);
      const has_pm = !!(log?.pmIn || log?.pmOut);

      const calendar_status = entry.status ?? (entry.is_weekend ? 'Weekend' : 'Work Day');

      let note = '';
      if (calendar_status === 'Holiday') note = 'Holiday';
      else if (log?.status && log.status !== 'Present') note = log.status;
      else if (entry.is_weekend) note = entry.weekday.slice(0, 3);

      let am_arrival = log?.amIn ?? '';
      let pm_arrival = log?.pmIn ?? '';

      // the note takes the arrival cell of whichever session has no punches,
      // the way "Sat" or "Leave" is written across the paper form
      if (note) {
        if (!has_am) am_arrival = note;
        else if (!has_pm) pm_arrival = note;
      }

      if (calendar_status !== 'Holiday') {
        if (log?.status === 'Half Day') total += 0.5;
        else if (has_am || has_pm) total += 1;
      }

      // Undertime is left for the signatory to fill in, as on the paper form
      body.push([entry.day, am_arrival, log?.amOut ?? '', pm_arrival, log?.pmOut ?? '', '', '']);
    }

    const regular_days = days.length
      ? days.filter((day: any) =>
        (day.status ?? (day.is_weekend ? 'Weekend' : 'Work Day')) === 'Work Day').length
      : Number(this.month_data?.work_days ?? 0);
    const saturdays = days.filter((day: any) =>
      String(day.weekday ?? '').startsWith('Sat')).length;

    const blank = () => ['', '', '', '', '', '', ''];
    const aoa: any[][] = [];
    const at = (line: any[]) => { aoa.push(line); return aoa.length - 1; };

    const title_row = at(['DAILY TIME RECORD', '', '', '', '', '', '']);
    const rule_row = at(['-----o0o-----', '', '', '', '', '', '']);
    at(blank());
    const name_row = at([row.name ?? '', '', '', '', '', '', '']);
    const name_caption_row = at(['(Name)', '', '', '', '', '', '']);
    at(blank());
    const month_row = at(['For the month of', '', month_label, '', '', '', '']);
    const arrival_row = at(['Official hours for arrival', '', 'Regular days', '', '', regular_days, '']);
    const departure_row = at(['and departure', '', 'Saturdays', '', '', saturdays, '']);
    at(blank());

    const head_row = at(['Day', 'A.M.', '', 'P.M.', '', 'Undertime', '']);
    const sub_row = at(['', 'Arrival', 'Depar-\nture', 'Arrival', 'Depar-\nture', 'Hours', 'Min-\nutes']);

    const first_body = aoa.length;
    for (const line of body) at(line);
    const last_body = aoa.length - 1;

    const total_text = `${total % 1 ? total.toFixed(1) : total} days`;
    const total_row = at(['', '', '', 'Total', '', total_text, '']);
    at(blank());

    const cert_rows = [
      at(['I certify on my honor that the above is a true and correct report of the hours', '', '', '', '', '', '']),
      at(['of work performed, record of which was made daily at the time of arrival', '', '', '', '', '', '']),
      at(['and departure from office.', '', '', '', '', '', '']),
    ];
    at(blank());
    const verified_row = at(['VERIFIED as to the prescribed office hours:', '', '', '', '', '', '']);
    at(blank());
    at(blank());
    const sign_row = at(blank());
    const in_charge_row = at(['', 'in Charge', '', '', '', '', '']);

    const sheet = utils.aoa_to_sheet(aoa);

    const thin = { style: 'thin', color: { rgb: '000000' } };
    const grid = { top: thin, bottom: thin, left: thin, right: thin };
    const underline = { bottom: thin };
    const center = { horizontal: 'center', vertical: 'center' };

    const style = (r: number, c: number, s: any) => {
      const address = utils.encode_cell({ r, c });
      if (!sheet[address]) sheet[address] = { t: 's', v: '' };
      sheet[address].s = s;
    };
    const style_row = (r: number, s: any) => {
      for (let c = 0; c < 7; c++) style(r, c, s);
    };

    style(title_row, 0, { font: { bold: true, sz: 14 }, alignment: center });
    style(rule_row, 0, { font: { sz: 9 }, alignment: center });
    style_row(name_row, { font: { bold: true, sz: 12 }, alignment: center, border: underline });
    style(name_caption_row, 0, { font: { sz: 8 }, alignment: center });

    style(month_row, 0, { font: { italic: true, sz: 9 } });
    style_row(arrival_row, { font: { italic: true, sz: 9 } });
    style_row(departure_row, { font: { italic: true, sz: 9 } });
    style(month_row, 2, { font: { italic: true, sz: 9 }, alignment: center, border: underline });
    style(arrival_row, 2, { font: { italic: true, sz: 9 }, alignment: center });
    style(departure_row, 2, { font: { italic: true, sz: 9 }, alignment: center });
    style(arrival_row, 5, { font: { sz: 9 }, alignment: center, border: grid });
    style(departure_row, 5, { font: { sz: 9 }, alignment: center, border: grid });

    const head_style = {
      font: { bold: true, sz: 9 },
      alignment: { ...center, wrapText: true },
      border: grid,
    };
    style_row(head_row, head_style);
    style_row(sub_row, head_style);

    for (let r = first_body; r <= last_body; r++) {
      style_row(r, { font: { sz: 9 }, alignment: center, border: grid });
    }

    style(total_row, 3, { font: { bold: true, sz: 9 }, alignment: { horizontal: 'right' } });
    style(total_row, 5, { font: { bold: true, sz: 9 }, alignment: center, border: grid });
    style(total_row, 6, { border: grid });

    for (const r of cert_rows) style(r, 0, { font: { italic: true, sz: 8 } });
    style(verified_row, 0, { font: { italic: true, sz: 8 } });
    for (let c = 1; c < 6; c++) style(sign_row, c, { border: underline });
    style(in_charge_row, 1, { font: { italic: true, sz: 8 }, alignment: center });

    const span = (r1: number, c1: number, r2: number, c2: number) =>
      ({ s: { r: r1, c: c1 }, e: { r: r2, c: c2 } });

    sheet['!merges'] = [
      span(title_row, 0, title_row, 6),
      span(rule_row, 0, rule_row, 6),
      span(name_row, 0, name_row, 6),
      span(name_caption_row, 0, name_caption_row, 6),
      span(month_row, 0, month_row, 1),
      span(month_row, 2, month_row, 4),
      span(arrival_row, 0, arrival_row, 1),
      span(arrival_row, 2, arrival_row, 4),
      span(arrival_row, 5, arrival_row, 6),
      span(departure_row, 0, departure_row, 1),
      span(departure_row, 2, departure_row, 4),
      span(departure_row, 5, departure_row, 6),
      span(head_row, 0, sub_row, 0),
      span(head_row, 1, head_row, 2),
      span(head_row, 3, head_row, 4),
      span(head_row, 5, head_row, 6),
      span(total_row, 3, total_row, 4),
      span(total_row, 5, total_row, 6),
      ...cert_rows.map(r => span(r, 0, r, 6)),
      span(verified_row, 0, verified_row, 6),
      span(sign_row, 1, sign_row, 5),
      span(in_charge_row, 1, in_charge_row, 5),
    ];

    sheet['!cols'] = [
      { wch: 5 }, { wch: 10 }, { wch: 10 }, { wch: 10 }, { wch: 10 }, { wch: 8 }, { wch: 8 },
    ];
    sheet['!rows'] = [];
    sheet['!rows'][sub_row] = { hpt: 26 };

    return sheet;
  }

  select_tab(data: any) {
    this.activeTab = data.id - 1;
    this.dropdownOpen = false;
  }

  upload() {
    this.router.navigateByUrl('/admin/dtr/upload/' + this.month_id);
    this.dialog.close();
  }

}
