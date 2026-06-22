import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { DtrEntry, DtrService, EmployeeDtr } from '../../../services/dtr/dtr.service';

@Component({
  selector: 'app-dtr-view-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, MatDialogModule, MatButtonModule, MatIconModule,
    MatInputModule, MatFormFieldModule],
  templateUrl: './dtr-view-modal.component.html',
  styleUrl: './dtr-view-modal.component.scss',
})
export class DtrViewModalComponent implements OnInit {
  record!: EmployeeDtr;
  isEditing = false;
  saving = false;

  get totalHours() {
    return this.record.entries.reduce((s, e) => s + (e.hours_rendered ?? 0), 0).toFixed(2);
  }
  get totalLate() {
    return this.record.entries.reduce((s, e) => s + (e.late_minutes ?? 0), 0);
  }
  get totalUndertime() {
    return this.record.entries.reduce((s, e) => s + (e.undertime_minutes ?? 0), 0);
  }
  get workingDays() {
    return this.record.entries.filter(e => e.am_in || e.pm_in).length;
  }

  constructor(
    private dtrService: DtrService,
    private dialogRef: MatDialogRef<DtrViewModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { record: EmployeeDtr },
  ) {}

  ngOnInit() {
    this.record = JSON.parse(JSON.stringify(this.data.record));
  }

  toggleEdit() { this.isEditing = !this.isEditing; }

  onTimeChange(entry: DtrEntry) {
    const updated = this.dtrService.computeDtr([entry]);
    Object.assign(entry, updated[0]);
  }

  save() {
    this.record.entries = this.dtrService.computeDtr(this.record.entries);
    this.dialogRef.close(this.record);
  }

  close() { this.dialogRef.close(null); }

  formatMinutes(min: number): string {
    if (!min) return '—';
    const h = Math.floor(min / 60);
    const m = min % 60;
    return h ? `${h}h ${m}m` : `${m}m`;
  }
}
