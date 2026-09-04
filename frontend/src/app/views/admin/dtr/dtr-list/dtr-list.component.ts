import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { DtrService } from '../../../../services/dtr/dtr.service';
import { DtrFile } from '../../../../services/dtr/dtr.interface';
import { ConfirmationService } from '../../../../services/general/confirmation.service';
import { TableLandscapeComponent } from "../../../../component/table/table-landscape/table-landscape.component";
import { MonthDataComponent } from '../../../../component/modal/month-data/month-data.component';
import { MatDialog } from '@angular/material/dialog';
import { YearService } from '../../../../services/year/year.service';
import { MonthService } from '../../../../services/month/month.service';
import { MonthDataService } from '../../../../services/month_data/month-data.service';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-dtr-list',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, MatButtonModule, MatIconModule, MatTableModule, TableLandscapeComponent],
  templateUrl: './dtr-list.component.html',
  styleUrl: './dtr-list.component.scss',
})
export class DtrListComponent implements OnInit, OnDestroy {
  dtr_list: any = [];
  loading = true;
  headers = ['month', 'year', 'logs','workdays', 'holidays', 'actions', ];
  year_list: any = [];
  month_data_list: any = [];
  all_month_data: any = [];
  month_list: any = []
  filter_year: any = new Date().getFullYear();
  year_id: any;
  filter_month: any = 'all';

  filter_month_list: any = [];

  /** the row saved a moment ago, flashed until the fade finishes */
  flash: { key: string; type: 'added' | 'updated' } | null = null;
  private flash_timer: any;

  constructor(
    private dtr_service: DtrService,
    private confirm: ConfirmationService,
    private router: Router,
    private route: ActivatedRoute,
    private dialog: MatDialog,
    private year_service: YearService,
    private month_service: MonthService,
    private month_data_service: MonthDataService,
  ) { }



  async ngOnInit() {
    this.filter_month_list = this.month_service.get_months();

    this.get_year();
    this.get_month();
    this.get_all_month_data();
  }

  row_flash = (item: any): string => {
    if (!this.flash) return '';
    return this.row_key(item) === this.flash.key ? `row-flash-${this.flash.type}` : '';
  };

  private row_key(item: any): string {
    return `${item?.year_id}-${item?.month_id}`;
  }

  private flash_row(saved: any) {
    clearTimeout(this.flash_timer);
    this.flash = {
      key: `${saved.year_id}-${saved.month_id}`,
      type: saved.action === 'added' ? 'added' : 'updated',
    };
    this.flash_timer = setTimeout(() => { this.flash = null; }, 2600);
  }

  ngOnDestroy() {
    clearTimeout(this.flash_timer);
  }

  get_all_month_data() {
    this.month_data_service.get_all_month_data(null).subscribe((res: any) => {
      this.all_month_data = res.data;
    });
  }

  get_year() {
    this.year_service.get_year().subscribe((res: any) => {
      this.year_list = res.data ?? [];
      this.filter_year = 0; 
      this.get_month_data();
    });

  }
  get_month() {
    return this.month_service.get_month().subscribe((res: any) => {
      this.month_list = res.data;
    })
  }
  get_month_data(saved?: any) {
    const data = {
      year: this.filter_year
    }
    return this.month_data_service.get_month_data(data).subscribe((res: any) => {
      this.month_data_list = res.data ?? [];
      if (saved) this.flash_row(saved);
    })
  }

  filter_by_year(year: any) {
    this.filter_year = year;
    
    this.get_month_data();
  }

  filter_by_month(month: any) {
    this.filter_month = month;
  }



  view_data(data: any) { 
    const title = "Update"
    let dialogRef = this.dialog.open(MonthDataComponent, {
      width: '75vw',
      maxWidth: '75vw',
      height: '75vh',
      maxHeight: '75vh',
      panelClass: 'fullscreen-dialog',
      autoFocus: true,
      disableClose: true,
      data: {
        title: title,
        year_list: this.year_list,
        month_list: this.month_list,
        month_data_list: this.all_month_data,
        month_data: data,
      }
    });
    dialogRef.afterClosed().subscribe(res => {
      if (res) this.refresh_month_data();
    });
  }
  refresh_month_data(saved?: any) {
    this.get_month_data(saved);
    this.get_all_month_data();
  }
  delete_data(data: any) {

  }
  add_month_data() {
    const title = "Add"
    let dialogRef = this.dialog.open(MonthDataComponent, {
      width: '75vw',
      maxWidth: '75vw',
      height: '75vh',
      maxHeight: '75vh',
      panelClass: 'fullscreen-dialog',
      autoFocus: true,
      disableClose: true,
      data: {
        title: title,
        year_list: this.year_list,
        month_list: this.month_list,
        month_data_list: this.all_month_data,
        month_data: null,
      }
    });
    dialogRef.afterClosed().subscribe(res => {
      if (res) this.refresh_month_data(res);
    });

  }
}
