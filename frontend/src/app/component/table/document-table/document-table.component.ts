import { Component, Input, AfterViewInit, ViewChild, ContentChild, TemplateRef, OnInit, SimpleChanges, Output, EventEmitter, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatIconModule } from '@angular/material/icon';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialog } from '@angular/material/dialog';
import { ConfirmationService } from '../../../services/general/confirmation.service';
import { FileDetailsComponent } from '../../modal/file-details/file-details.component';
import { FileService } from '../../../services/file/file.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-document-table',
  standalone: true,
  imports: [MatTableModule,
    MatPaginatorModule,
    MatIconModule,
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    MatSortModule],
  templateUrl: './document-table.component.html',
  styleUrl: './document-table.component.scss'
})
export class DocumentTableComponent {
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @Input() data: any[] = [];
  @Input() paginate: number[] = [10, 20, 30, 40, 50];
  @Output() pageDataChange = new EventEmitter<any>();
  @Output() signatureSaved = new EventEmitter<any>();
  @Output() deleteConfirmed = new EventEmitter<any>();

  pageSize = this.paginate[0];
  pageIndex = 0;
  labels = ['name', 'status', 'action'];
  dataSource!: MatTableDataSource<any>;
  @ContentChild(TemplateRef) actions?: TemplateRef<any>;
  currentPageData: any = null;
  constructor(
    private dialog: MatDialog,
    private file_service: FileService,
    private confirmation_service: ConfirmationService,
    private router: Router

  ) {
  }
  ngOnInit() {
    this.dataSource = new MatTableDataSource(this.data);
  }

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
  }
  ngOnChanges(changes: SimpleChanges) {
    if (changes['data'] && this.dataSource) {
      this.dataSource.data = this.data;
    }
  }
  async onPageChange(event: PageEvent) {
    this.pageDataChange.emit(event.pageSize);
  }

  onEdit(data: any) {
    const dialog = this.dialog.open(FileDetailsComponent, {
      data: { title: "Edit product", type: "edit", pdf: data },
      hasBackdrop: true,
      width: '95vw',
      height: '95vh',
      maxWidth: '95vw',
      maxHeight: '95vh',
    });
    dialog.afterClosed().subscribe((result: any) => {

      if (result.action === 'save') {
        this.signatureSaved.emit(result.payload);
      }
    });

  }
  onDelete(data: any) {
    this.confirmation_service.confirm({
      title: 'Delete Confirmation',
      message: 'Are you sure you want to delete this file?',
      confirmText: 'Delete',
      cancelText: 'Cancel',
      type: 'danger',
      isCancel: true,
    }).subscribe(async (confirmed: any) => {
      if (confirmed) {
        const stem = data.name.replace(/\.pdf$/i, '');
        await this.file_service.deleteSignature(stem);
        this.confirmation_service.confirm({
          title: 'Signature Deleted',
          message: 'The signature has been removed.',
          confirmText: 'Close',
        });
        this.onDeleteConfirmed();
      }
    });
  }

  async onDeleteConfirmed() { 
    this.deleteConfirmed.emit();

  }

  onSignatureSaved(data: any) {
    // this.refreshPage();
    this.signatureSaved.emit(data);
  }
  refreshPage() {
    const currentUrl = this.router.url;
    this.router.navigateByUrl('/', { skipLocationChange: true }).then(() => {
      this.router.navigate([currentUrl]);
    });
  }

} 