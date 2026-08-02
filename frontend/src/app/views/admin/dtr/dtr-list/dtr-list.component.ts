import { Component, OnInit } from '@angular/core';
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

@Component({
  selector: 'app-dtr-list',
  standalone: true,
  imports: [CommonModule, RouterModule, MatButtonModule, MatIconModule, MatTableModule, TableLandscapeComponent],
  templateUrl: './dtr-list.component.html',
  styleUrl: './dtr-list.component.scss',
})
export class DtrListComponent implements OnInit {
  dtr_list: any = [];
  loading = true;
  headers = ['filename', 'period', 'employees', 'uploaded_at', 'actions'];

  constructor(
    private dtr_service: DtrService,
    private confirm: ConfirmationService,
    private router: Router,
    private route: ActivatedRoute,
    private dialog: MatDialog,
  ) { }



  async ngOnInit() {
    await this.load_dtrs();
  }

  async load_dtrs() {

    return this.dtr_service.get_all_dtr(null).subscribe((res: any) => {

    })
  }


  // add_dtr() {
  //   this.router.navigate(['/admin/dtr/upload']);
  // }
  edit_data(data: any) {

  }
  view_data(data: any) {

  }
  delete_data(data: any) {

  }
  add_dtr() {
    const title = "Add"
    let dialogRef = this.dialog.open(MonthDataComponent, {
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
}
