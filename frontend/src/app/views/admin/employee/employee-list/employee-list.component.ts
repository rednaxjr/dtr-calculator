import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatDialog } from '@angular/material/dialog';
import { MatChipsModule } from '@angular/material/chips';
import { EmployeeService } from '../../../../services/employee/employee.service';
import { ConfirmationService } from '../../../../services/general/confirmation.service';
import { Router } from '@angular/router';
import { EmployeeTableComponent } from '../../../../component/table/employee-table/employee-table.component';

@Component({
  selector: 'app-employee-list',
  standalone: true,
  imports: [CommonModule, FormsModule, MatTableModule, MatButtonModule, MatIconModule,
    MatInputModule, MatFormFieldModule, MatChipsModule, EmployeeTableComponent],
  templateUrl: './employee-list.component.html',
  styleUrl: './employee-list.component.scss',
})
export class EmployeeListComponent implements OnInit {
  employee_list: any = [];
  search = '';
  loading = true;
  columns = ['id', 'name', 'actions'];

  constructor(
    private dialog: MatDialog,
    private confirm: ConfirmationService,
    private router: Router,
    private employee_service: EmployeeService
  ) { }

  async ngOnInit() {
    this.load_employee();
  }

  add_employee() {
    this.router.navigateByUrl('/admin/employees/details');
  }

  load_employee() {

    return this.employee_service.get_employees(null).subscribe((res: any) => {
      this.employee_list = res.data[0];
      for (let i = 0; i < this.employee_list.length; i++) {
        const employee = this.employee_list[i];
        employee.full_name = employee.lname+", "+employee.fname

      }
      console.log(this.employee_list)
    })
  }

}
