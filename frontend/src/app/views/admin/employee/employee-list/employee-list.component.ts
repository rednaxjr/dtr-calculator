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
import {  EmployeeService } from '../../../../services/employee/employee.service'; 
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
  employee_list:any=[];
  search = '';
  loading = true;
  columns = ['employee_id', 'name', 'position', 'department', 'status', 'actions'];

  constructor(
    private employeeService: EmployeeService,
    private dialog: MatDialog,
    private confirm: ConfirmationService,
    private router: Router
  ) {}

  async ngOnInit() { 
    
  }
 
  add_employee() {
  this.router.navigateByUrl('/admin/employees/details');
  }
   
}
