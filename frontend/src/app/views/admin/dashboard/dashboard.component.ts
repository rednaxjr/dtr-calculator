import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { EmployeeService } from '../../../services/employee/employee.service';
import { DtrService } from '../../../services/dtr/dtr.service';
import { AuthService } from '../../../services/auth/auth.service';
import {AdminDashboardCardComponent} from '../../../component/parts/admin-dashboard-card/admin-dashboard-card.component';
interface StatCard {
  label: string;
  value: number | string;
  icon: string;
  color: string;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, MatIconModule, MatButtonModule, AdminDashboardCardComponent],
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
  ) { }

  ngOnInit(): void { }
}
