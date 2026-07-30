import { Component, Input, AfterViewInit, ViewChild, ContentChild, TemplateRef, OnInit, SimpleChanges, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatIconModule } from '@angular/material/icon';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';

@Component({
  selector: 'app-employee-breadcrumbs',
  standalone: true,
  imports: [
    MatTableModule,
    MatPaginatorModule,
    MatIconModule,
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    MatSortModule
  ],
  templateUrl: './employee-breadcrumbs.component.html',
  styleUrl: './employee-breadcrumbs.component.scss'
})
export class EmployeeBreadcrumbsComponent {
  @Input() data: any[] = [];
  @Input() view_number: any;
  @Output() select_view = new EventEmitter<any>();
  constructor(
    public router: Router,
  ) {
  }

  select_data(data: any) {
    this.select_view.emit(data);
  }

}
