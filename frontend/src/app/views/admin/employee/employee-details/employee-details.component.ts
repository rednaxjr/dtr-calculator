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
import { AdminDashboardCardComponent } from "../../../../component/parts/admin-dashboard-card/admin-dashboard-card.component";
import { TableLandscapeComponent } from "../../../../component/table/table-landscape/table-landscape.component";
import { MonthService } from '../../../../services/month/month.service';
import { SalaryTypeService } from '../../../../services/salary-type/salary-type.service';
import { Month } from '../../../../component/models/month.model';
import { SalaryType } from '../../../../component/models/salary-type.model';


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
    BreadcrumbsComponent,
    AdminDashboardCardComponent,
    TableLandscapeComponent
  ],
  templateUrl: './employee-details.component.html',
  styleUrl: './employee-details.component.scss'
})
export class EmployeeDetailsComponent {
  headers: any[] = ["month", "lates", "absent", "action"];
  dtr_data: any[] = [];
  new_number: any;
  employee_id: any;
  isMobile = signal(false)
  url_id: any = null;
  banner: any;
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
    public router: Router,
    public activeRoute: ActivatedRoute,
    private dialog: MatDialog,
    public validation_service: ValidationService,
    public employee_service: EmployeeService,
    private confirmation_service: ConfirmationService,
    private month_service: MonthService,
    private salary_type_service: SalaryTypeService
  ) {
    this.months = this.month_service.get_months();
    this.salary_type = this.salary_type_service.get_salary_types();
    this.activeRoute.paramMap.subscribe((params: any) => {
      this.employee_id = params.get('id');
    });
  }
  ngOnInit(): void {

    this.banner = [
      { text: null, icon: "home", value: 0, link: "/admin/employees", },
    ];
    this.load_employee_data();
  }


  load_employee_data() {
    const data = {
      id: this.employee_id,
    }
    return this.employee_service.get_employee_data(data).subscribe((res: any) => {
      const result = res?.data?.[0];
      if (!result) return;
      const birthday = result.birthday ? new Date(result.birthday) : null;
      this.fname = result.fname ?? '';
      this.mname = result.mname ?? '';
      this.lname = result.lname ?? '';
      this.birth_month = result.birth_month ?? (birthday ? birthday.getMonth() + 1 : 0);
      this.birth_day = result.birth_day ?? (birthday ? String(birthday.getDate()).padStart(2, '0') : '');
      this.birth_year = result.birth_year ?? (birthday ? String(birthday.getFullYear()) : '');
      this.username = result.username ?? '';
      this.salary = result.salary ?? '';
      this.salary_id = result.salary_id ?? 0;
      this.sss = result.sss ?? '';
      this.pag_ibig = result.pag_ibig ?? '';
      this.phil_health = result.phil_health ?? '';
    })
  }

  view_data(data: any) {
    this.router.navigateByUrl('/admin/employees/details/' + data.id);
  }

}
