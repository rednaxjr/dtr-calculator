import { Component, Input, Output, EventEmitter, ViewChild, OnInit, AfterViewInit, OnChanges, SimpleChanges, } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatDialog } from '@angular/material/dialog';
import { ConfirmationService } from '../../../services/general/confirmation.service'; 
import { FileService } from '../../../services/file/file.service';

@Component({
  selector: 'app-employee-table',
  standalone: true,
  imports: [MatTableModule, MatPaginatorModule, CommonModule],
  templateUrl: './employee-table.component.html',
  styleUrl: './employee-table.component.scss'
})
export class EmployeeTableComponent implements OnInit, AfterViewInit, OnChanges {
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @Input() data: any[] = [];
  @Output() signatureSaved = new EventEmitter<any>();
  @Output() deleteConfirmed = new EventEmitter<void>();

  labels = ['name', 'status', 'action'];
  dataSource = new MatTableDataSource<any>([]);

  constructor(
    private dialog: MatDialog,
    private file_service: FileService,
    private confirmation_service: ConfirmationService
  ) { }

  ngOnInit(): void {
    this.dataSource.data = this.data;
  }

  ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginator;
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['data']) this.dataSource.data = this.data;
  } 
  onEdit(data: any): void {
    // const dialog = this.dialog.open(FileDetailsComponent, {
    //   data: { title: 'Edit product', type: 'edit', pdf: data },
    //   hasBackdrop: true,
    //   width: '95vw',
    //   height: '95vh',
    //   maxWidth: '95vw',
    //   maxHeight: '95vh',
    // });
    // dialog.afterClosed().subscribe((result: any) => {
    //   if (result?.action === 'save') this.signatureSaved.emit(result.payload);
    // });
  }

 
  // onDelete(data: any): void {
  //   this.confirmation_service.confirm({
  //     title: 'Delete File',
  //     message: 'Are you sure you want to delete this data？',
  //     confirmText: 'Delete',
  //     cancelText: 'cancel',
  //     type: 'danger',
  //     isCancel: true,
  //   }).subscribe(async (confirmed: any) => {
  //     if (!confirmed) return;
  //     const stem = data.name.replace(/\.pdf$/i, '');
  //     await this.file_service.deleteSignature(stem);
  //     this.confirmation_service.confirm({
  //       title: '署名を削除しました',
  //       message: '署名の削除が完了しました。',
  //       confirmText: '閉じる',
  //     });
  //     this.deleteConfirmed.emit();
  //   });
  // }
}
