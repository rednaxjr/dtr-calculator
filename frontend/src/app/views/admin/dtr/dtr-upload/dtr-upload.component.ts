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

@Component({
  selector: 'app-dtr-upload',
  standalone: true,
  imports: [CommonModule, RouterModule, MatButtonModule, MatIconModule, MatDialogModule, MatSnackBarModule, DtrBannerComponent, FormsModule, TableLandscapeComponent],
  templateUrl: './dtr-upload.component.html',
  styleUrl: './dtr-upload.component.scss',
})
export class DtrUploadComponent implements OnDestroy, OnInit {

  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;
  headers: any = ["id", "name", "late", "present", "absent", "actions"]
  isDragging = signal(false);
  file_name: any = "";
  saving = false;
  banner: any;
  view_number_data: any = 1;
  url_id: any = null;

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
  employees: any = [];



  constructor(
    public parser: ParserService,
    public dialog: MatDialog,
    private snackBar: MatSnackBar,
    private year_service: YearService,
    private employee_service: EmployeeService
  ) {
    this.banner = [
      { text: null, icon: "home", value: 0, link: "/admin/dtr", },
      { text: "Upload File", icon: null, value: 1 },
      { text: "Details", icon: null, value: 2 },
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

    if (this.fileInput) this.fileInput.nativeElement.value = '';
  }

  saveExcel() {
    this.parser.saveToExcel();

  }

  onDragOver(e: DragEvent) {
    e.preventDefault();
    this.isDragging.set(true);
  }

  async onDrop(e: DragEvent) {
    e.preventDefault();
    this.isDragging.set(false);
    const file = e.dataTransfer?.files[0];
    if (file) await this.getResult(file);
  }

  onFileSelected(e: Event) {
    const input = e.target as HTMLInputElement;
    const file = input.files?.[0];
    if (file) this.getResult(file);
    input.value = '';
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

    console.log(this.parser.employees);
  }

  getLates(emp: any): number {
    let count = 0;
    for (const log of emp.logs) {
      const mins = this.toMinutes(log.amIn);
      if (mins !== null && mins > 8 * 60) count++;
    }
    return count;
  }

  getDaysPresent(emp: any): number {
    return emp.logs.filter((log: any) => {
      if (log.status) return log.status !== 'Absent';
      return !!(log.amIn || log.amOut || log.pmIn || log.pmOut);
    }).length;
  }

  getDaysAbsent(emp: any): number {
    return emp.logs.filter((log: any) => {
      if (log.status) return log.status === 'Absent';
      return !log.amIn && !log.amOut && !log.pmIn && !log.pmOut;
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
      const updated: any = this.parser.employees[index];
      Object.assign(updated, result.employee);
      this.parser.applyHoliday(result.holidaysAdded, result.holidaysRemoved);
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

  next_view() {
    this.view_number_data = 2;
  }

  remove_data(index: number) {
    this.parser.removeEmployee(index);
  }

  submit() {
    for (let i = 0; i < this.parser.employees.length; i++) {

    }
    console.log()
  }

  select_year(data: any) {
    this.year_id = data.id;
    this.year_service.get_year_month(data).subscribe((res: any) => {
      console.log(res.data);
      this.month_list = res.data;
    })

  }

  select_month(data: any) {
    if (data.dtr_count > 0) return;
    this.month_id = data;
    console.log(this.month_id);
  }


}
