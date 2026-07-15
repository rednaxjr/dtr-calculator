import { Component, signal, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { ParserService } from '../../../../services/parser/parser.service';
import { TimeRecordModalComponent } from '../../../../component/modal/time-record-modal/time-record-modal.component';

@Component({
  selector: 'app-dtr-upload',
  standalone: true,
  imports: [CommonModule, RouterModule, MatButtonModule, MatIconModule, MatDialogModule, MatSnackBarModule],
  templateUrl: './dtr-upload.component.html',
  styleUrl: './dtr-upload.component.scss',
})
export class DtrUploadComponent implements OnDestroy {

  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;

  isDragging = signal(false);
  file_name: any = "";
  saving = false;

  constructor(
    public parser: ParserService,
    public dialog: MatDialog,
    private snackBar: MatSnackBar,
  ) { }

  ngOnDestroy() {
    this.parser.clear();
  }

  clearResults() {
    this.parser.clear();

    if (this.fileInput) this.fileInput.nativeElement.value = '';
  }

  saveExcel() {
    console.log("asdawd")
    this.parser.saveToExcel();

  }

  onDragOver(e: DragEvent) {
    e.preventDefault();
    this.isDragging.set(true);
  }

  async onDrop(e: DragEvent) {
    e.preventDefault();
    this.isDragging.set(false);
    const file = e.dataTransfer?.files[0];
    if (file) await this.getResult(file);
  }

  onFileSelected(e: Event) {
    const input = e.target as HTMLInputElement;
    const file = input.files?.[0];
    if (file) this.getResult(file);
    input.value = '';
  }

  async getResult(file: File) {
    this.file_name = file.name;
    await this.parser.parseFile(file);
    const employees = this.parser.employees;
    console.log(employees);
    return employees;
  }

  getLates(emp: any): number {
    let count = 0;
    for (const log of emp.logs) {
      const mins = this.toMinutes(log.amIn);
      if (mins !== null && mins > 8 * 60) count++;
    }
    return count;
  }

  getDaysPresent(emp: any): number {
    return emp.logs.filter((log: any) => log.amIn || log.amOut || log.pmIn || log.pmOut).length;
  }

  toMinutes(val: any): number | null {
    if (val === null || val === undefined || val === '') return null;
    const match = String(val).trim().match(/^(\d{1,2}):(\d{2})/);
    if (!match) return null;
    return Number(match[1]) * 60 + Number(match[2]);
  }

  openModal(emp: any, index: number) {
    const ref = this.dialog.open(TimeRecordModalComponent, {
      data: emp,
      width: '98vw',
      height: '98vh',
      maxWidth: '98vw',
      maxHeight: '98vh',
      panelClass: 'time-record-dialog',
    });
    ref.afterClosed().subscribe((result: any) => {
      if (!result) return;
      // Mutate the existing employee object in place rather than replacing the
      // array element. The summary table tracks rows by userId, so swapping in a
      // new object with the same id leaves the row bound to the stale reference
      // and edits don't show. Updating in place keeps the same reference the
      // template (and Save-to-Excel provenance) already points at.
      Object.assign(this.parser.employees[index], result.employee);
      this.parser.applyHoliday(result.holidaysAdded, result.holidaysRemoved);
    });
  }
}
