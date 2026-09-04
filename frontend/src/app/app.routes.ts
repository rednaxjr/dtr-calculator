import { Routes } from '@angular/router';
import { AuthGuard } from './services/guards/auth.guard';
import { IndexLayoutComponent } from './component/layout/index-layout/index-layout.component';
import { AdminLayoutComponent } from './component/layout/admin-layout/admin-layout.component';
import { IndexComponent } from './views/index/index.component';
import { DashboardComponent } from './views/admin/dashboard/dashboard.component';
import { EmployeeListComponent } from './views/admin/employee/employee-list/employee-list.component';

import { DtrListComponent } from './views/admin/dtr/dtr-list/dtr-list.component';
import { DtrUploadComponent } from './views/admin/dtr/dtr-upload/dtr-upload.component';
import { EmployeeDetailsComponent } from './views/admin/employee/employee-details/employee-details.component';

export const routes: Routes = [
  {
    path: '',
    component: IndexLayoutComponent,
    children: [
      { path: '', component: IndexComponent, data: { title: '', parent: '' } },
    ],
  },

  {
    path: 'admin',
    component: AdminLayoutComponent,
    // canActivate: [AuthGuard],
    children: [ 
      { path: 'dashboard', component: DashboardComponent,data: { title: 'Dashboard', parent: 'Dashboard', description:null } },
      { path: 'employees', component: EmployeeListComponent, data: { title: 'Employee' , parent: 'Employees',  description:"Manage the list of employees" } },
      { path: 'employees/details/:id', component: EmployeeDetailsComponent, data: { title: 'Employees Details' , parent: 'Employees', description:null } },
      { path: 'dtr', component: DtrListComponent, data: { title: 'DTR Files', parent: 'DTR Files', description:null } },
      { path: 'dtr/upload/:id', component: DtrUploadComponent, data: { title: 'Upload DTR', parent: 'DTR Files', description:"Upload and manage employee Daily Time Records" } },
    ],
  },



  { path: '**', redirectTo: '/login' },
];
