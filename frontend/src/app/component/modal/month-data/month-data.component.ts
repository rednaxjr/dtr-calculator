import { Component, signal, OnDestroy, ViewChild, ElementRef, OnInit, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
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
  imports: [CommonModule, RouterModule, MatButtonModule, MatIconModule, MatDialogModule, MatSnackBarModule, FormsModule, MonthCalendarComponent],
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
    private month_data_service: MonthDataService

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
  private load_month_data(data: any) {
    this.year_id = Number(data.year_id);
    this.month_id = Number(data.month_id);
    console.log(data)

    this.year_value = Number(
      data.year ?? this.year_list.find((y: any) => y.id === data.year_id)?.name
    );
    console.log("year_value", this.year_value)
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
    console.log()
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
    console.log("month_counts", this.month_counts);
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
    console.log("calendar_statuses", this.calendar_statuses);
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
    console.log(data)
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
              this.dialog.close();
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
