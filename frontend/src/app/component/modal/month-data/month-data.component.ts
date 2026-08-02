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
  year_value: any = null;
  month_number: any = null;

  calendar_statuses: Record<number, string> = {};


  constructor(
    @Inject(MAT_DIALOG_DATA) public data: any,
    public dialog: MatDialogRef<MonthDataComponent>,
    public validation_service: ValidationService,
    private confirmation_service: ConfirmationService,
    private employee_service: EmployeeService,
    private month_service: MonthService,
    private salary_type_service: SalaryTypeService,
    private year_service: YearService,
    private calender_status_service: CalendarStatusService

  ) {

  }
  
  ngOninit(){
    this.get_year() ;
  }
  get_year() {
    this.year_service.get_year().subscribe((res: any) => {
      this.year_list = res.data;
    })

  }
  on_year_change(id: any) {
    const item = this.year_list.find((y: any) => y.id === id);
    if (item) this.select_year(item);
  }

  on_month_change(id: any) {
    const item = this.month_list.find((m: any) => m.id === id);
    if (item) this.select_month(item);


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
  is_month_disabled(item: any): boolean {
    return !this.is_month_elapsed(item) || item?.dtr_count > 0;
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
  get has_selectable_month(): boolean {
    return this.month_list.some((m: any) => !this.is_month_disabled(m));
  }

  get month_placeholder(): string {
    if (this.year_id === null) return 'Select a year first';
    if (!this.has_selectable_month) return 'No completed months for this year';
    return 'Select month';
  }
  month_option_label(item: any): string {
    if (!this.is_month_elapsed(item)) return `${item.name} — Unavailable`;
    if (item.dtr_count > 0) return `${item.name} — Already Uploaded`;
    return item.name;
  }


  submit() {

  }
}
