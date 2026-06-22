import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';
import { IndexLayoutComponent } from './component/layout/index-layout/index-layout.component';
import { AdminLayoutComponent } from './component/layout/admin-layout/admin-layout.component';
import { IndexComponent } from './views/index/index.component';
import { LoginComponent } from './views/admin/login/login.component';
import { DashboardComponent } from './views/dashboard/dashboard.component';
import { EmployeeListComponent } from './views/employees/employee-list/employee-list.component';
import { DtrListComponent } from './views/dtr/dtr-list/dtr-list.component';
import { DtrUploadComponent } from './views/dtr/dtr-upload/dtr-upload.component';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },

  {
    path: 'admin',
    component: AdminLayoutComponent,
    canActivate: [authGuard],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', component: DashboardComponent },
      { path: 'employees', component: EmployeeListComponent },
      { path: 'dtr', component: DtrListComponent },
      { path: 'dtr/upload', component: DtrUploadComponent },
    ],
  },

  {
    path: '',
    component: IndexLayoutComponent,
    children: [
      { path: '', component: IndexComponent, data: { title: 'Document', parent: 'document' } },
    ],
  },

  { path: '**', redirectTo: '/login' },
];
