import { Component, inject, signal, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { ParserService } from '../../../../services/parser/parser.service';
import { TimeRecordModalComponent } from '../../../../component/modal/time-record-modal/time-record-modal.component';

@Component({
  selector: 'app-dtr-upload',
  standalone: true,
  imports: [CommonModule, RouterModule, MatButtonModule, MatIconModule, MatDialogModule],
  templateUrl: './dtr-upload.component.html',
  styleUrl: './dtr-upload.component.scss',
})
export class DtrUploadComponent implements OnDestroy {

  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;

  parser = inject(ParserService);
  dialog = inject(MatDialog);
  isDragging = signal(false);

  ngOnDestroy() {
    this.parser.clear();
  }

  clearResults() {
    this.parser.clear();
    
    if (this.fileInput) this.fileInput.nativeElement.value = '';
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
      width: '80vw',
      height: '80vh',
      maxWidth: '80vw',
    });
    ref.afterClosed().subscribe((result: any) => {
      if (result) this.parser.employees[index] = result;
    });
  }
}
