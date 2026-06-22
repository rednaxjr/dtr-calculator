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
import { Employee, EmployeeService } from '../../../services/employee/employee.service';
import { EmployeeModalComponent } from '../../../component/modal/employee-modal/employee-modal.component';
import { ConfirmationService } from '../../../services/general/confirmation.service';

@Component({
  selector: 'app-employee-list',
  standalone: true,
  imports: [CommonModule, FormsModule, MatTableModule, MatButtonModule, MatIconModule,
    MatInputModule, MatFormFieldModule, MatChipsModule],
  templateUrl: './employee-list.component.html',
  styleUrl: './employee-list.component.scss',
})
export class EmployeeListComponent implements OnInit {
  employees: Employee[] = [];
  filtered: Employee[] = [];
  search = '';
  loading = true;
  columns = ['employee_id', 'name', 'position', 'department', 'status', 'actions'];

  constructor(
    private employeeService: EmployeeService,
    private dialog: MatDialog,
    private confirm: ConfirmationService,
  ) {}

  async ngOnInit() {
    await this.load();
  }

  async load() {
    this.loading = true;
    this.employees = await this.employeeService.getAll();
    this.applySearch();
    this.loading = false;
  }

  applySearch() {
    const q = this.search.toLowerCase();
    this.filtered = q
      ? this.employees.filter(e =>
          `${e.first_name} ${e.last_name} ${e.employee_id} ${e.department} ${e.position}`.toLowerCase().includes(q))
      : [...this.employees];
  }

  openAdd() {
    this.dialog.open(EmployeeModalComponent, { data: { mode: 'add' }, width: '480px' })
      .afterClosed().subscribe(result => { if (result) this.load(); });
  }

  openEdit(emp: Employee) {
    this.dialog.open(EmployeeModalComponent, { data: { mode: 'edit', employee: emp }, width: '480px' })
      .afterClosed().subscribe(result => { if (result) this.load(); });
  }

  deleteEmployee(emp: Employee) {
    this.confirm.confirm({
      title: 'Delete Employee',
      message: `Remove ${emp.first_name} ${emp.last_name}?`,
      confirmText: 'Delete',
      cancelText: 'Cancel',
      type: 'danger',
      isCancel: true,
    }).subscribe(async confirmed => {
      if (confirmed && emp.id) {
        await this.employeeService.delete(emp.id);
        await this.load();
      }
    });
  }
}
