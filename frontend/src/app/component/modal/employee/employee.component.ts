import { Component, signal, OnDestroy, ViewChild, ElementRef, OnInit, TemplateRef, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { FormBuilder, FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatMenuModule } from '@angular/material/menu';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog, MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { map } from 'rxjs/internal/operators/map';
import { ValidationService } from '../../../services/validation/validation.service';
import { ConfirmationService } from '../../../services/general/confirmation.service';
import { EmployeeService } from '../../../services/employee/employee.service';
import { MonthService } from '../../../services/month/month.service';
import { SalaryTypeService } from '../../../services/salary-type/salary-type.service';
import { Month } from '../../models/month.model';
import { SalaryType } from '../../models/salary-type.model';
@Component({
  selector: 'app-employee',
  standalone: true,
  imports: [CommonModule, FormsModule, MatButtonModule, MatIconModule, MatDialogModule],
  templateUrl: './employee.component.html',
  styleUrl: './employee.component.scss'
})
export class EmployeeComponent {
  sections = [
    { title: 'Personal Information', id: 1 },
    { title: 'Compensation Details', id: 2 },
  ];
  section_fields: string[][] = [
    ['fname', 'mname', 'lname', 'birth_month', 'birth_day', 'birth_year'],
    ['salary_id', 'salary'],
  ];
  activeTab = 0;
  dropdownOpen = false;



  isMobile = signal(false)
  url_id: any = null;
  errors: any = {};
  view_number_data: any = 1;
  banner: any;

  @ViewChild('email_address_content') email_address_content!: TemplateRef<any>;
  @ViewChild('email_address_buttons') email_address_buttons!: TemplateRef<any>;
  @ViewChild('qr_content') qr_content!: TemplateRef<any>;
  @ViewChild('qr_buttons') qr_buttons!: TemplateRef<any>;
  email_reg: any = '';
  fname: any = '';
  lname: any = '';
  mname: any = '';
  birth_day: any = '';
  birth_year: any = '';
  b_date: any;
  username: any;
  email: any;
  user_id: any;
  file_id: any;
  templateMap!: {
    [key: string]: { content: TemplateRef<any>, buttons: TemplateRef<any> }
  };
  birth_month: any = 0;
  month: any;
  months: Month[] = [];
  salary_type: SalaryType[] = [];


  salary_id: any = 0;
  salary: any;
  pag_ibig: any;
  phil_health: any;
  sss: any;


  constructor(
    @Inject(MAT_DIALOG_DATA) public data: any,
    public dialogRef: MatDialogRef<EmployeeComponent>,
    public validation_service: ValidationService,
    private confirmation_service: ConfirmationService,
    private employee_service: EmployeeService,
    private month_service: MonthService,
    private salary_type_service: SalaryTypeService,

  ) {
    this.months = this.month_service.get_months();
    this.salary_type = this.salary_type_service.get_salary_types();
  }



  ngOnInit() {
  }

  selectTab(index: number) {
    this.activeTab = index;
    this.dropdownOpen = false;
  }
  get_section_error_count(index: number): number {
    const fields = this.section_fields[index] || [];
    return fields.filter(field => !!this.errors[field]).length;
  }
  get_username() {
    const first = this.fname?.trim().charAt(0).toLowerCase() ?? '';
    const last = this.lname?.trim().toLowerCase().replace(/\s+/g, '') ?? '';
    this.username = first && last ? `${first}.${last}` : first || last;
  } 
  
  on_input(field: 'fname' | 'lname' | 'mname' | 'day' | 'month' | 'year') {
    const map: { [key: string]: () => string } = {
      fname: () => this.validation_service.validateFirstName(this.fname),
      lname: () => this.validation_service.validateLastName(this.lname),
      mname: () => this.validation_service.validateMiddleName(this.mname),
      day: () => this.validation_service.validateDay(this.birth_day),
      month: () => this.validation_service.validateMonth(this.birth_month),
      year: () => this.validation_service.validateYear(this.birth_year),

    };
    this.errors[field] = map[field]();
    console.log(this.errors)
  }
  submit() {

    this.errors = {

      mname: this.validation_service.validate_required_text_only(this.mname),
      lname: this.validation_service.validate_required_text_only(this.lname),
      fname: this.validation_service.validate_required_text_only(this.fname),
      salary_id: this.salary_id === 0 ? '* Select a salary type' : '',
      salary: this.validation_service.validate_required_number_only(this.salary, 'Basic salary'),
    };

    if (!this.validation_service.isValid(this.errors)) return;

    const data = {
      fname: this.fname,
      mname: this.mname,
      lname: this.lname,
      birth_month: this.birth_month,
      birth_day: this.birth_day,
      birth_year: this.birth_year,
      username: this.username,
      salary: this.salary,
      salary_id: this.salary_id,
      sss: this.sss,
      pag_ibig: this.pag_ibig,
      phil_health: this.phil_health,
    };

    return this.employee_service.add_employee(data).subscribe({
      next: (res: any) => {
        if (res.success) {
          this.confirmation_service.confirm({
            title: 'Employee Added',
            message: 'Employee has been successfully added.',
            confirmText: 'OK',
            type: 'success',
          }).subscribe((confirmed: boolean) => {
            if (confirmed) {
              this.dialogRef.close();
            }
          });
        }
      },
      error: (err: any) => {
        if (err.status === 409) {
          // Duplicate user or employee
          this.confirmation_service.confirm({
            title: 'Already Exists',
            message: err.error.message,
            confirmText: 'OK',
          });
        } else {
          this.confirmation_service.confirm({
            title: 'Something went wrong',
            message: 'An error occurred while saving the employee. Please try again.',
            confirmText: 'OK',
            type: 'danger',
          });
        }
      }
    });
  }

}
