import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatChipsModule } from '@angular/material/chips';
import { EmployeeService } from '../../../../services/employee/employee.service';
import { ConfirmationService } from '../../../../services/general/confirmation.service';
import { Router } from '@angular/router';
import { TableLandscapeComponent } from '../../../../component/table/table-landscape/table-landscape.component';
import { EmployeeComponent } from '../../../../component/modal/employee/employee.component';

@Component({
  selector: 'app-employee-list',
  standalone: true,
  imports: [CommonModule, FormsModule, MatTableModule, MatButtonModule, MatIconModule,
    MatInputModule, MatFormFieldModule, MatChipsModule, TableLandscapeComponent, MatDialogModule],
  templateUrl: './employee-list.component.html',
  styleUrl: './employee-list.component.scss',
})
export class EmployeeListComponent implements OnInit {
  employees: any = [];
  search = '';
  loading = true;
  columns = ['id', 'name', 'actions'];
  headers: any = ['name', 'actions'];
  constructor(
    private dialog: MatDialog,
    private confirm: ConfirmationService,
    private router: Router,
    private employee_service: EmployeeService
  ) { }

  async ngOnInit() {
    this.load_employee();
  }

  load_employee() {
    this.employees = [];
    return this.employee_service.get_employees(null).subscribe((res: any) => {
      this.employees = res.data[0];
      for (let i = 0; i < this.employees.length; i++) {
        const employee = this.employees[i];
        employee.name = employee.lname.charAt(0) + ". " + employee.fname

      }
      console.log(this.employees)
    })
  }

  delete_data(data: any) {
    console.log(data)
  }

  view_data(data: any) {
    this.router.navigateByUrl('/admin/employees/details/' + data.id);
  }
  add_employee() {
    const title = "Add"
    let dialogRef = this.dialog.open(EmployeeComponent, {
      width: '75vw',
      maxWidth: '75vw',
      height: '75vh',
      maxHeight: '75vh',
      panelClass: 'fullscreen-dialog',
      autoFocus: true,
      disableClose: true,
      data: { title: title, }
    });
    dialogRef.afterClosed().subscribe(res => {
    });

  }
  edit_data(data: any) {
    const title = "Update"
    let dialogRef = this.dialog.open(EmployeeComponent, {
      width: '75vw',
      maxWidth: '75vw',
      height: '75vh',
      maxHeight: '75vh',
      panelClass: 'fullscreen-dialog',
      autoFocus: true,
      disableClose: true,
      data: { title: title, data: data }
    });
    dialogRef.afterClosed().subscribe(res => {
    });

  }
}
