import { Component, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatDialog } from '@angular/material/dialog';
import { ExcelParserService } from '../../../services/excel-parser/excel-parser.service';
import { DtrService, EmployeeDtr } from '../../../services/dtr/dtr.service';
import { DtrViewModalComponent } from '../../../component/modal/dtr-view-modal/dtr-view-modal.component';

@Component({
  selector: 'app-dtr-upload',
  standalone: true,
  imports: [CommonModule, RouterModule, MatButtonModule, MatIconModule, MatTableModule],
  templateUrl: './dtr-upload.component.html',
  styleUrl: './dtr-upload.component.scss',
})
export class DtrUploadComponent {
  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;

  isDragOver = false;
  parsing = false;
  saving = false;
  parseError = '';
  filename = '';
  records: EmployeeDtr[] = [];
  columns = ['index', 'employee_name', 'period', 'entries', 'actions'];
  saved = false;

  constructor(
    private excelParser: ExcelParserService,
    private dtrService: DtrService,
    private dialog: MatDialog,
  ) {}

  onDragOver(e: DragEvent) { e.preventDefault(); this.isDragOver = true; }
  onDragLeave() { this.isDragOver = false; }

  onDrop(e: DragEvent) {
    e.preventDefault();
    this.isDragOver = false;
    const file = e.dataTransfer?.files[0];
    if (file) this.processFile(file);
  }

  onFileSelected(e: Event) {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (file) this.processFile(file);
  }

  async processFile(file: File) {
    if (!file.name.match(/\.(xlsx|xls|csv)$/i)) {
      this.parseError = 'Please upload an Excel file (.xlsx, .xls) or CSV.';
      return;
    }
    this.parsing = true;
    this.parseError = '';
    this.records = [];
    this.filename = file.name;
    this.saved = false;
    try {
      const parsed = await this.excelParser.parseFile(file);
      this.records = parsed.map(r => ({
        ...r,
        entries: this.dtrService.computeDtr(r.entries),
      }));
      if (this.records.length === 0) {
        this.parseError = 'No DTR data detected. Make sure your Excel follows the expected format.';
      }
    } catch (err: any) {
      this.parseError = 'Failed to parse file: ' + (err?.message ?? 'Unknown error');
    } finally {
      this.parsing = false;
    }
  }

  viewDtr(record: EmployeeDtr, index: number) {
    const dialogRef = this.dialog.open(DtrViewModalComponent, {
      data: { record },
      width: '95vw',
      maxWidth: '95vw',
      height: '90vh',
    });
    dialogRef.afterClosed().subscribe((updated: EmployeeDtr | null) => {
      if (updated) this.records[index] = updated;
    });
  }

  async saveAll() {
    if (!this.records.length) return;
    this.saving = true;
    try {
      await this.dtrService.saveFile(this.filename, this.records);
      this.saved = true;
    } finally {
      this.saving = false;
    }
  }

  reset() {
    this.records = [];
    this.filename = '';
    this.parseError = '';
    this.saved = false;
    if (this.fileInput) this.fileInput.nativeElement.value = '';
  }
}
