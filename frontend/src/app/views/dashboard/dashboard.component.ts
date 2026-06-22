import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { EmployeeService } from '../../services/employee/employee.service';
import { DtrService } from '../../services/dtr/dtr.service';
import { AuthService } from '../../services/auth.service';

interface StatCard {
  label: string;
  value: number | string;
  icon: string;
  color: string;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, MatIconModule, MatButtonModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
})
export class DashboardComponent implements OnInit {
  stats: StatCard[] = [];
  loading = true;

  constructor(
    private employeeService: EmployeeService,
    private dtrService: DtrService,
    public auth: AuthService,
  ) {}

  async ngOnInit() {
    const [employees, dtrFiles] = await Promise.all([
      this.employeeService.getAll(),
      this.dtrService.getAllFiles(),
    ]);
    const active = employees.filter(e => e.status === 'active').length;
    this.stats = [
      { label: 'Total Employees', value: employees.length, icon: 'people', color: 'bg-blue-500' },
      { label: 'Active Employees', value: active, icon: 'person_check', color: 'bg-green-500' },
      { label: 'DTR Files Uploaded', value: dtrFiles.length, icon: 'description', color: 'bg-indigo-500' },
      { label: 'Inactive Employees', value: employees.length - active, icon: 'person_off', color: 'bg-gray-500' },
    ];
    this.loading = false;
  }
}
