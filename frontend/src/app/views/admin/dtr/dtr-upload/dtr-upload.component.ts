import { Component, signal, OnDestroy, ViewChild, ElementRef, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { FormBuilder, FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';

import { MatIconModule } from '@angular/material/icon';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { ParserService } from '../../../../services/parser/parser.service';
import { TimeRecordModalComponent } from '../../../../component/modal/time-record-modal/time-record-modal.component';
import { DtrBannerComponent } from '../../../../component/parts/dtr-banner/dtr-banner.component';
import { YearService } from '../../../../services/year/year.service';
import { EmployeeService } from '../../../../services/employee/employee.service';
import { TableLandscapeComponent } from "../../../../component/table/table-landscape/table-landscape.component";
import { MonthCalendarComponent, build_calendar_days, MONTH_NAMES } from '../../../../component/parts/month-calendar/month-calendar.component';
import { DtrService } from '../../../../services/dtr/dtr.service';
import { CalendarStatusComponent } from '../../../../component/modal/calendar-status/calendar-status.component';
import { CalendarStatusService } from '../../../../services/calendar-status/calendar-status.service';

@Component({
  selector: 'app-dtr-upload',
  standalone: true,
  imports: [CommonModule, RouterModule, MatButtonModule, MatIconModule, MatDialogModule, MatSnackBarModule, DtrBannerComponent, FormsModule, TableLandscapeComponent, MonthCalendarComponent],
  templateUrl: './dtr-upload.component.html',
  styleUrl: './dtr-upload.component.scss',
})
export class DtrUploadComponent implements OnDestroy, OnInit {

  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;
  headers: any = ["id", "name", "late", "present", "actions"]
  isDragging = signal(false);
  file_name: any = "";
  saving = false;
  banner: any;
  view_number_data: any = 1;
  url_id: any = null;

  /** tab strip mirrors the two upload steps, `id` maps to view_number_data */
  sections = [
    { title: 'File Information', id: 1 },
    { title: 'DTR Records', id: 2 },
  ];
  dropdownOpen = false;

  email_reg: any = '';
  fname: any;
  lname: any;
  mname: any;
  contact_number: any;
  username: any;
  email: any;
  password: any;
  package_avail: any = null;
  duration_avail: any = null;;
  showPassword = false;
  user_id: any;


  year_list: any = [];
  month_list: any = [
    { number: 1, name: "January", dtr_count: 0 },
    { number: 2, name: "February", dtr_count: 0 },
    { number: 3, name: "March", dtr_count: 0 },
    { number: 4, name: "April", dtr_count: 0 },
    { number: 5, name: "May", dtr_count: 0 },
    { number: 6, name: "June", dtr_count: 0 },
    { number: 7, name: "July", dtr_count: 0 },
    { number: 8, name: "August", dtr_count: 0 },
    { number: 9, name: "September", dtr_count: 0 },
    { number: 10, name: "October", dtr_count: 0 },
    { number: 11, name: "November", dtr_count: 0 },
    { number: 12, name: "December", dtr_count: 0 },
  ];

  year_id: any = null;
  month_id: any = null;
  /** actual calendar values behind the selected ids, used to build the calendar */
  year_value: any = null;
  month_number: any = null;
  employees: any = [];

  /** calendar status overrides for the selected month, keyed by day-of-month */
  calendar_statuses: Record<number, string> = {};



  constructor(
    public parser: ParserService,
    public dialog: MatDialog,
    private snackBar: MatSnackBar,
    private year_service: YearService,
    private employee_service: EmployeeService,
    private dtr_service: DtrService,
    private calendar_status_service: CalendarStatusService
  ) {
    this.banner = [
      { text: null, icon: "home", value: 0, link: "/admin/dtr", },
      { text: "Upload File", icon: null, value: 1 },
      { text: "Review & Submit", icon: null, value: 2 },
    ];
  }
  ngOnInit() {
    this.get_year();
    this.load_employee();
  }
  get_year() {
    this.year_service.get_year().subscribe((res: any) => {
      this.year_list = res.data;
    })

  }
  load_employee() {

    return this.employee_service.get_employees(null).subscribe((res: any) => {
      this.employees = res.data[0];
      for (let i = 0; i < this.employees.length; i++) {
        const employee = this.employees[i];
      }
    })
  }


  ngOnDestroy() {
    this.parser.clear();
  }

  clearResults() {
    this.parser.clear();
    this.view_number_data = 1;

    if (this.fileInput) this.fileInput.nativeElement.value = '';
  }

  get canUpload(): boolean {
    return !!(this.year_id && this.month_id);
  }

  private ensureUploadAllowed(): boolean {
    if (!this.canUpload) {
      this.snackBar.open('Please select Year and Month before uploading a file.', 'Close', { duration: 3000 });
      return false;
    }
    return true;
  }

  openFilePicker() {
    if (!this.ensureUploadAllowed()) return;
    this.fileInput.nativeElement.click();
  }

  saveExcel() {
    this.parser.saveToExcel();

  }

  onDragOver(e: DragEvent) {
    e.preventDefault();
    if (!this.canUpload) return;
    this.isDragging.set(true);
  }

  async onDrop(e: DragEvent) {
    e.preventDefault();
    this.isDragging.set(false);
    if (!this.ensureUploadAllowed()) return;
    const file = e.dataTransfer?.files[0];
    if (file) await this.getResult(file);
  }

  onFileSelected(e: Event) {
    const input = e.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;
    if (!this.ensureUploadAllowed()) return;
    this.getResult(file);
  }

  async getResult(file: File) {
    this.file_name = file.name;
    await this.parser.parseFile(file);

    for (const parser_data of this.parser.employees as any[]) {
      parser_data.late = this.getLates(parser_data);
      parser_data.present = this.getDaysPresent(parser_data);
      parser_data.absent = this.getDaysAbsent(parser_data);
    }

    for (let i = 0; i < this.employees.length; i++) {
      const employee = this.employees[i];
      const lname = (employee.lname ?? '').trim().toUpperCase();

      for (let j = 0; j < this.parser.employees.length; j++) {
        const parser_data: any = this.parser.employees[j];
        const parsed_name = (parser_data.name ?? '').trim().toUpperCase();

        if (lname === parsed_name) {
          parser_data.id = employee.id;
          parser_data.name = employee.lname.charAt(0) + ". " + employee.fname;
          break;
        }
      }
    }

    this.parser.applyCalendarStatuses(this.calendar_statuses);

    console.log(this.parser.employees);
  }
 
  private readonly NON_WORKING_STATUSES = ['Absent', 'Leave', 'Holiday'];

  /** Log dates read like "1 Mo" / "7 Sa" — the suffix is the weekday. */
  private isWeekendLog(log: any): boolean {
    const match = String(log?.date ?? '').trim().match(/([A-Za-z]{2})$/);
    if (!match) return false;
    const day = match[1].toLowerCase();
    return day === 'sa' || day === 'su' || day === 'so';
  }

  private hasTimeEntry(log: any): boolean {
    return !!(log.amIn || log.amOut || log.pmIn || log.pmOut);
  }

  /**
   * Rest days never count toward any of the three totals. The record modal
   * stamps a status on every log it touches, so the status is checked first
   * and the time entries are only a fallback for records it hasn't seen —
   * otherwise the same record totals differently before and after an edit.
   */
  private isRestDay(log: any): boolean {
    return this.isWeekendLog(log);
  }

  getLates(emp: any): number {
    let count = 0;
    for (const log of emp.logs) {
      if (this.isRestDay(log)) continue;
      if (log.status && this.NON_WORKING_STATUSES.includes(log.status)) continue;

      const mins = this.toMinutes(log.amIn);
      if (mins !== null && mins > 8 * 60) count++;
    }
    return count;
  }

  getDaysPresent(emp: any): number {
    return emp.logs.filter((log: any) => {
      if (this.isRestDay(log)) return false;
      if (log.status) return !this.NON_WORKING_STATUSES.includes(log.status);
      return this.hasTimeEntry(log);
    }).length;
  }

  getDaysAbsent(emp: any): number {
    return emp.logs.filter((log: any) => {
      if (this.isRestDay(log)) return false;
      if (log.status) return log.status === 'Absent';
      return !this.hasTimeEntry(log);
    }).length;
  }

  toMinutes(val: any): number | null {
    if (val === null || val === undefined || val === '') return null;
    const match = String(val).trim().match(/^(\d{1,2}):(\d{2})/);
    if (!match) return null;
    return Number(match[1]) * 60 + Number(match[2]);
  }

  openModal(emp: any, index: number) {
    const ref = this.dialog.open(TimeRecordModalComponent, {
      data: emp,
      width: '98vw',
      height: '98vh',
      maxWidth: '98vw',
      maxHeight: '98vh',
      panelClass: 'time-record-dialog',
    });
    ref.afterClosed().subscribe((result: any) => {
      if (!result) return;

      // fall back to the row object itself if the index didn't come through,
      // so a save can never write onto the wrong record
      const updated: any = this.parser.employees[index] ?? emp;
      if (!updated) return;

      Object.assign(updated, result.employee);
      this.parser.applyHoliday(result.holidaysAdded, result.holidaysRemoved);

      this.record_holidays(result.holidaysAdded, 'Holiday');
      this.record_holidays(result.holidaysRemoved, null);
      this.calendar_statuses = this.calendar_status_service.month_map(this.year_value, this.month_number);

      updated.late = this.getLates(updated);
      updated.present = this.getDaysPresent(updated);
      updated.absent = this.getDaysAbsent(updated);
    });
  }
  get filteredBanner() {
    return this.banner.filter((item: any) => item.value <= this.view_number_data);
  }
  view_number(data: any) {
    console.log(data);
    this.view_number_data = data.value;
  }

  get activeTab(): number {
    const index = Number(this.view_number_data) - 1;
    if (index < 0) return 0;
    if (index >= this.sections.length) return this.sections.length - 1;
    return index;
  }

  selectTab(index: number) {
    const target = this.sections[index]?.id;
    if (!target) return;
    if (target === 2 && !this.ensureUploadAllowed()) return;

    this.view_number_data = target;
    this.dropdownOpen = false;
  }

  get_section_error_count(index: number): number {
    if (index === 0) {
      let missing = 0;
      if (!this.year_id) missing++;
      if (!this.month_id) missing++;
      return missing;
    }

    return this.parser.employees.filter((emp: any) => !emp.id).length;
  }

  next_view() {
    if (!this.ensureUploadAllowed()) return;
    this.view_number_data = 2;
  }

  remove_data(index: number) {
    if (!Number.isInteger(index) || index < 0) return;
    this.parser.removeEmployee(index);
  }

  private build_calendar_payload() {
    const days = build_calendar_days(this.year_value, this.month_number, this.calendar_statuses);

    // a date resolves to exactly one status, so a holiday falling on a weekend
    // counts only as a holiday and the three totals add up to total_days
    const count_of = (status: string) => days.filter(day => day.status === status).length;

    return {
      year_id: this.year_id,
      month_id: this.month_id,
      year: this.year_value,
      month: this.month_number,
      month_name: this.month_number ? MONTH_NAMES[Number(this.month_number) - 1] : null,
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
    };
  }

  private attach_calendar_to_logs(days: any[]) {
    const by_day = new Map<number, any>(days.map(day => [day.day, day]));

    for (const emp of this.parser.employees as any[]) {
      for (const log of emp.logs ?? []) {
        const day = Number(this.parser.dayKey(log.date));
        const match = by_day.get(day);
        if (!match) continue;
        log.day = day;
        log.calendar_status = match.status;
      }
    }
  }

  submit() {
    const calendar = this.build_calendar_payload();
    this.attach_calendar_to_logs(calendar.days);

    for (let i = 0; i < this.parser.employees.length; i++) {
      this.parser.employees[i].year_id = this.year_id;
      this.parser.employees[i].month_id = this.month_id;
    }
    const data = {
      data: this.parser.employees,
      calendar: calendar,
      month_id: this.month_id,
      year_id: this.year_id
    }
    console.log(data)
    return this.dtr_service.add_dtr(data).subscribe((res: any) => {

    })

  }

  /** Resolved status of a calendar day: override, else Weekend / Work Day. */
  day_status(day: any): string {
    return this.calendar_statuses[day?.date] ?? (day?.isWeekend ? 'Weekend' : 'Work Day');
  }

  update_status(day: any) {
    if (!this.year_value || !this.month_number) return;

    const ref = this.dialog.open(CalendarStatusComponent, {
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

      // a status matching the derived default is stored as "no override"
      const isDefault = result.status === (day.isWeekend ? 'Weekend' : 'Work Day');
      this.calendar_status_service.set_status(
        this.year_value, this.month_number, day.date, isDefault ? null : result.status
      );

      this.sync_calendar_statuses();
    });
  }

  /** Write a set of log dates ("1 Mo") into the calendar as day-of-month keys. */
  private record_holidays(dates: string[] = [], status: string | null) {
    if (!this.year_value || !this.month_number) return;

    for (const date of dates ?? []) {
      const day = Number(this.parser.dayKey(date));
      if (!Number.isFinite(day)) continue;
      this.calendar_status_service.set_status(this.year_value, this.month_number, day, status);
    }
  }

 
  private sync_calendar_statuses() {
    this.calendar_statuses = this.calendar_status_service.month_map(this.year_value, this.month_number);
    this.parser.applyCalendarStatuses(this.calendar_statuses);
  }

  on_year_change(id: any) {
    const item = this.year_list.find((y: any) => y.id === id);
    if (item) this.select_year(item);
  }

  on_month_change(id: any) {
    const item = this.month_list.find((m: any) => m.id === id);
    if (item) this.select_month(item);

    if (this.parser.employees.length > 0) {
      this.clearResults();
    }
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

  is_month_disabled(item: any): boolean {
    return !this.is_month_elapsed(item) || item?.dtr_count > 0;
  }

  month_option_label(item: any): string {
    if (!this.is_month_elapsed(item)) return `${item.name} — Unavailable`;
    if (item.dtr_count > 0) return `${item.name} — Already Uploaded`;
    return item.name;
  }

  get has_selectable_month(): boolean {
    return this.month_list.some((m: any) => !this.is_month_disabled(m));
  }

  get month_placeholder(): string {
    if (this.year_id === null) return 'Select a year first';
    if (!this.has_selectable_month) return 'No completed months for this year';
    return 'Select month';
  }

  select_year(data: any) {
    this.year_id = data.id;
    this.year_value = Number(data.name);
    this.month_id = null;
    this.month_number = null;

    this.year_service.get_year_month(data).subscribe((res: any) => {
      this.month_list = res.data;
    })

    this.sync_calendar_statuses();
  }

  select_month(data: any) {
    if (this.is_month_disabled(data)) return;
    this.month_id = data.id;
    this.month_number = Number(data.number);

    this.sync_calendar_statuses();
  }
}
