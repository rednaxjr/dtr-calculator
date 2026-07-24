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
    MatMenuModule

  ],
  templateUrl: './employee-details.component.html',
  styleUrl: './employee-details.component.scss'
})
export class EmployeeDetailsComponent {
  isMobile = signal(false)
  url_id: any = null;
  errors :any={};


  @ViewChild('email_address_content') email_address_content!: TemplateRef<any>;
  @ViewChild('email_address_buttons') email_address_buttons!: TemplateRef<any>;
  @ViewChild('qr_content') qr_content!: TemplateRef<any>;
  @ViewChild('qr_buttons') qr_buttons!: TemplateRef<any>;
  email_reg: any = '';
  fname: any;
  lname: any;
  mname: any;
  b_date: any;
  username: any;
  email: any;
  user_id: any;
  file_id: any;
  templateMap!: {
    [key: string]: { content: TemplateRef<any>, buttons: TemplateRef<any> }
  };
  banner: any = [];
  birth_month: any = 0;
  birth_day: any;
  birth_year: any;
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




  constructor(
    private fb: FormBuilder,
    public router: Router,
    public activeRoute: ActivatedRoute,
    private dialog: MatDialog,
    private breakpointObserver: BreakpointObserver,
    private validation_service: ValidationService,
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
      { text: null, icon: "home", link: "/admin/dashboard", },
      { text: "Client list", icon: null, link: "/admin/client", },
      { text: "Client's Information", icon: null, link: "/admin/client-info/" + this.url_id, },
    ];
  }


  get_username() {
    const first = this.fname?.trim().charAt(0).toLowerCase() ?? '';
    const last = this.lname?.trim().toLowerCase().replace(/\s+/g, '') ?? '';
    this.username = first && last ? `${first}.${last}` : first || last;
  }

  save() {
    const data = {
      fname: this.fname,
      lname: this.lname,
      mname: this.mname,
      email: this.email,
      b_date: this.b_date,
    }
  }

  select_month(data: any) {
    this.month = data;
  }

  block_numbers = (e: KeyboardEvent) => this.validation_service.validate_text_only(e);
  blockLetters = (e: KeyboardEvent) => this.validation_service.blockLetters(e);

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

    // proceed with submit logic...
  }
}
