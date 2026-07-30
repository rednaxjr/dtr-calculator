import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { DtrService } from '../../../../services/dtr/dtr.service';
import { DtrFile } from '../../../../services/dtr/dtr.interface';
import { ConfirmationService } from '../../../../services/general/confirmation.service';

@Component({
  selector: 'app-dtr-list',
  standalone: true,
  imports: [CommonModule, RouterModule, MatButtonModule, MatIconModule, MatTableModule],
  templateUrl: './dtr-list.component.html',
  styleUrl: './dtr-list.component.scss',
})
export class DtrListComponent implements OnInit {
  files: DtrFile[] = [];
  loading = true;
  columns = ['filename', 'period', 'employees', 'uploaded_at', 'actions'];

  constructor(
    private dtr_service: DtrService,
    private confirm: ConfirmationService,
    private router: Router,
    private route: ActivatedRoute,
  ) { }



  async ngOnInit() { await this.load(); }

  async load() {
    this.loading = true;
    this.files = await this.dtr_service.getAllFiles();
    this.loading = false;
  }

  deleteFile(file: DtrFile) {
    this.confirm.confirm({
      title: 'Delete DTR File',
      message: `Remove "${file.filename}"?`,
      confirmText: 'Delete',
      cancelText: 'Cancel',
      type: 'danger',
      isCancel: true,
    }).subscribe(async confirmed => {
      if (confirmed) {
        await this.dtr_service.deleteFile(file.id);
        await this.load();
      }
    });
  }
  add_dtr() {
    this.router.navigate(['/admin/dtr/upload']);
  }
}
