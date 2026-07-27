import { Component, signal, OnDestroy, ViewChild, ElementRef, OnInit, TemplateRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { FormBuilder, FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatMenuModule } from '@angular/material/menu';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { map } from 'rxjs/internal/operators/map';
import { ValidationService } from '../../../../services/validation/validation.service';
import { BreadcrumbsComponent } from '../../../../component/parts/breadcrumbs/breadcrumbs.component';
import { EmployeeService } from '../../../../services/employee/employee.service';
import { ConfirmationService } from '../../../../services/general/confirmation.service';


@Component({
  selector: 'app-employee-details',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatButtonModule,
    MatIconModule,
    MatDialogModule,
    FormsModule,
    ReactiveFormsModule,
    MatMenuModule,
    BreadcrumbsComponent

  ],
  templateUrl: './employee-details.component.html',
  styleUrl: './employee-details.component.scss'
})
export class EmployeeDetailsComponent {
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
  months = [
    { number: 1, month: 'January' },
    { number: 2, month: 'February' },
    { number: 3, month: 'March' },
    { number: 4, month: 'April' },
    { number: 5, month: 'May' },
    { number: 6, month: 'June' },
    { number: 7, month: 'July' },
    { number: 8, month: 'August' },
    { number: 9, month: 'September' },
    { number: 10, month: 'October' },
    { number: 11, month: 'November' },
    { number: 12, month: 'December' }
  ];
  salary_type = [
    { number: 1, value: 'Monthly' },
    { number: 2, value: 'Semi-monthly' },
    { number: 3, value: 'Bi-weekly' },
    { number: 4, value: 'Weekly' },
  ];


  salary_id: any = 0;
  salary: any;
  pag_ibig: any;
  phil_health: any;
  sss: any;



  constructor(
    private fb: FormBuilder,
    public router: Router,
    public activeRoute: ActivatedRoute,
    private dialog: MatDialog,
    private breakpointObserver: BreakpointObserver,
    public validation_service: ValidationService,
    public employee_service: EmployeeService,
    private confirmation_service: ConfirmationService
  ) {
  }
  ngOnInit(): void {
    this.breakpointObserver
      .observe([Breakpoints.HandsetPortrait, Breakpoints.Small, Breakpoints.Medium])
      .pipe(map((result) => result.matches))
      .subscribe((matches) => {
        this.isMobile.set(matches)
      })
    this.activeRoute.params.subscribe((paramsId: any) => {
      this.url_id = paramsId.id;
    });
    this.banner = [
      { text: null, icon: "home", value: 0, link: "/admin/employees", },
      { text: "Personal Information", icon: null, value: 1 },
      { text: "Compensation Details", icon: null, value: 2 },
    ];
  }
  view_number(data: any) {
    console.log(data);
    this.view_number_data = data.value;
  }



  get filteredBanner() {
    return this.banner.filter((item: any) => item.value <= this.view_number_data);
  }
  get_username() {
    const first = this.fname?.trim().charAt(0).toLowerCase() ?? '';
    const last = this.lname?.trim().toLowerCase().replace(/\s+/g, '') ?? '';
    this.username = first && last ? `${first}.${last}` : first || last;
  }



  select_month(data: any) {
    this.month = data;
  }

  block_numbers = (e: KeyboardEvent) => this.validation_service.validate_text_only(e);
  block_letters = (e: KeyboardEvent) => this.validation_service.block_letters(e);

  onNameInput(field: 'fname' | 'lname' | 'mname') {
    const map: { [key: string]: () => string } = {
      fname: () => this.validation_service.validateFirstName(this.fname),
      lname: () => this.validation_service.validateLastName(this.lname),
      mname: () => this.validation_service.validateMiddleName(this.mname),
    };
    this.errors[field] = map[field]();
    console.log(this.errors)
  }

  onDateInput() {
    const dateErrors = this.validation_service.validateDateFields({
      birth_month: this.birth_month,
      birth_day: this.birth_day,
      birth_year: this.birth_year,
    });
    this.errors = { ...this.errors, ...dateErrors };
  }

  submit() {
    this.errors = {
      ...this.errors,
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
              this.router.navigate(['/admin/employees']);
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
  next_view() {
    if (this.view_number_data === 1) {
      this.errors = {
        ...this.validation_service.validateNameFields({
          fname: this.fname,
          lname: this.lname,
          mname: this.mname,
        }),
        ...this.validation_service.validateDateFields({
          birth_month: this.birth_month,
          birth_day: this.birth_day,
          birth_year: this.birth_year,
        }),
      };

      if (!this.validation_service.isValid(this.errors)) return;
    }

    if (this.view_number_data === 2) {
      this.errors = {
        ...this.errors,
        salary_id: this.salary_id === 0 ? '* Select a salary type' : '',
        salary: this.validation_service.validate_required_number_only(this.salary, 'Basic salary'),
      };

      if (!this.validation_service.isValid(this.errors)) return;
    }

    this.view_number_data++;
  }
  prev_view() {
    this.view_number_data = this.view_number_data - 1;
  }
}
