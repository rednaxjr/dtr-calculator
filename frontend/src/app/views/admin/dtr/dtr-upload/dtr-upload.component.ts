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

@Component({
  selector: 'app-dtr-upload',
  standalone: true,
  imports: [CommonModule, RouterModule, MatButtonModule, MatIconModule, MatDialogModule, MatSnackBarModule, DtrBannerComponent, FormsModule],
  templateUrl: './dtr-upload.component.html',
  styleUrl: './dtr-upload.component.scss',
})
export class DtrUploadComponent implements OnDestroy, OnInit {

  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;

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


  year_list: any = [
    // { name: "2024" },
    // { name: "2025" },
    // { name: "2026" }
  ];
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



  constructor(
    public parser: ParserService,
    public dialog: MatDialog,
    private snackBar: MatSnackBar,
    private year_service: YearService,
  ) {
    this.banner = [
      { text: null, icon: "home", value: 0, link: "/admin/dtr", },
      { text: "Upload File", icon: null, value: 1 },
      { text: "Details", icon: null, value: 2 },
    ];
  }
  ngOnInit() {
    this.get_year();
  }
  get_year() {
    this.year_service.get_year().subscribe((res: any) => {
      this.year_list = res.data;
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
    const employees = this.parser.employees;
    console.log(employees);
    return employees;
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
    return emp.logs.filter((log: any) => log.amIn || log.amOut || log.pmIn || log.pmOut).length;
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
      Object.assign(this.parser.employees[index], result.employee);
      this.parser.applyHoliday(result.holidaysAdded, result.holidaysRemoved);
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
  submit() {

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
