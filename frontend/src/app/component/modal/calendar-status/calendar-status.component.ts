import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { CALENDAR_STATUS_OPTIONS } from '../../../services/calendar-status/calendar-status.service';

@Component({
  selector: 'app-calendar-status',
  standalone: true,
  imports: [CommonModule, FormsModule, MatButtonModule, MatIconModule, MatDialogModule],
  templateUrl: './calendar-status.component.html',
  styleUrl: './calendar-status.component.scss'
})
export class CalendarStatusComponent {

  status = CALENDAR_STATUS_OPTIONS;

  /** status being edited; only written back to the calendar on Save */
  selected_status: string;

  /** what the date resolves to today, shown so the change is obvious */
  current_status: string;

  constructor(
    public dialogRef: MatDialogRef<CalendarStatusComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
  ) {
    this.current_status = data?.status ?? 'Work Day';

    // Weekend is a derived default, not a selectable option, so a weekend with
    // no override opens on Work Day rather than an entry that isn't in the list
    this.selected_status = this.status.some(s => s.value === this.current_status)
      ? this.current_status
      : 'Work Day';
  }

  get date_label(): string {
    const day = this.data?.day;
    if (!day) return '';
    return `${day.weekdayFull}, ${day.date} ${this.data?.month_label ?? ''} ${this.data?.year ?? ''}`.trim();
  }

  status_icon(value: string): string {
    return this.status.find(s => s.value === value)?.icon ?? 'event';
  }

  submit() {
    this.dialogRef.close({ status: this.selected_status });
  }
}
