import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-time-record-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, MatDialogModule, MatButtonModule, MatIconModule],
  templateUrl: './time-record-modal.component.html',
  styleUrl: './time-record-modal.component.scss',
})
export class TimeRecordModalComponent {
  employee: any;

  constructor(
    private dialogRef: MatDialogRef<TimeRecordModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
  ) {
    // edit a copy so closing without saving doesn't change the original
    this.employee = JSON.parse(JSON.stringify(data));
  }

  save() {
    this.dialogRef.close(this.employee);
  }

  close() {
    this.dialogRef.close(null);
  }
}
