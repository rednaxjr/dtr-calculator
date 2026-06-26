import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatMenuModule } from '@angular/material/menu';

type FieldKey = 'amIn' | 'amOut' | 'pmIn' | 'pmOut' | 'otIn' | 'otOut';
type Session = 'AM' | 'PM' | 'OT';
type FieldStatus = 'late' | 'ontime' | 'blank-required' | 'blank-optional' | 'neutral';

interface FieldDef {
  key: FieldKey;
  label: string;
  /** which working session the punch belongs to */
  session: Session;
  /** required fields show red when blank, optional fields show orange */
  required: boolean;
  /** the scheduled "on-time" cutoff in minutes; later than this is late */
  lateAfter: number | null;
  /** default value offered by the field's quick-action menu (Fill Blank) */
  fillValue?: string;
}

interface StatusMeta {
  /** menu icon */
  icon: string;
  /** whole row is read-only (no time fields are editable / validated) */
  locked: boolean;
  /** only the morning session is worked; afternoon fields are disabled */
  halfDay?: boolean;
  /** tooltip shown on the badge and disabled fields */
  tooltip: string;
  /** css modifier for the badge chip ('' = no badge, i.e. Present) */
  badgeClass: string;
  /** css modifier tinting the whole row ('' = normal striping) */
  rowClass: string;
}

@Component({
  selector: 'app-time-record-modal',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatMenuModule,
  ],
  templateUrl: './time-record-modal.component.html',
  styleUrl: './time-record-modal.component.scss',
})
export class TimeRecordModalComponent {
  employee: any;

  /** pristine snapshot used to detect edited fields */
  private original: any;

  saving = false;

  /** standard government schedule: 08:00 in, 12:00 out, 13:00 in, 17:00 out */
  private readonly AM_START = 8 * 60;   // 08:00
  private readonly PM_START = 13 * 60;  // 13:00

  readonly statusOptions = [
    { value: 'Present', label: 'Present' },
    { value: 'Absent', label: 'Absent' },
    { value: 'Leave', label: 'Leave' },
    { value: 'Half Day', label: 'Half Day' },
    { value: 'Official Business', label: 'Official Business' },
    { value: 'Holiday', label: 'Holiday' },
  ];

  readonly statusMeta: Record<string, StatusMeta> = {
    'Present': {
      icon: 'check_circle', locked: false, tooltip: 'Present',
      badgeClass: '', rowClass: '',
    },
    'Absent': {
      icon: 'event_busy', locked: true,
      tooltip: 'Employee was absent on this day.',
      badgeClass: 'tr-badge-absent', rowClass: 'tr-row-absent',
    },
    'Leave': {
      icon: 'beach_access', locked: true,
      tooltip: 'Employee was on approved leave on this day.',
      badgeClass: 'tr-badge-leave', rowClass: 'tr-row-leave',
    },
    'Half Day': {
      icon: 'hourglass_bottom', locked: false, halfDay: true,
      tooltip: 'Half day — afternoon session is not required.',
      badgeClass: 'tr-badge-halfday', rowClass: 'tr-row-halfday',
    },
    'Official Business': {
      icon: 'work', locked: true,
      tooltip: 'Employee was on official business on this day.',
      badgeClass: 'tr-badge-ob', rowClass: 'tr-row-ob',
    },
    'Holiday': {
      icon: 'celebration', locked: true,
      tooltip: 'Holiday — non-working day.',
      badgeClass: 'tr-badge-holiday', rowClass: 'tr-row-holiday',
    },
  };

  readonly fields: FieldDef[] = [
    { key: 'amIn',  label: 'AM In',  session: 'AM', required: true,  lateAfter: this.AM_START },
    { key: 'amOut', label: 'AM Out', session: 'AM', required: false, lateAfter: null, fillValue: '12:00' },
    { key: 'pmIn',  label: 'PM In',  session: 'PM', required: false, lateAfter: this.PM_START, fillValue: '13:00' },
    { key: 'pmOut', label: 'PM Out', session: 'PM', required: true,  lateAfter: null },
    { key: 'otIn',  label: 'OT In',  session: 'OT', required: false, lateAfter: null },
    { key: 'otOut', label: 'OT Out', session: 'OT', required: false, lateAfter: null },
  ];

  constructor(
    private dialogRef: MatDialogRef<TimeRecordModalComponent>,
    private snackBar: MatSnackBar,
    @Inject(MAT_DIALOG_DATA) public data: any,
  ) {
    // edit a copy so closing without saving doesn't change the original
    this.employee = JSON.parse(JSON.stringify(data));
    this.normalizeStatuses(this.employee);
    // snapshot AFTER normalizing so a defaulted status isn't seen as an edit
    this.original = JSON.parse(JSON.stringify(this.employee));
  }

  /** ensure every log has an attendance status (migrates the old absent flag) */
  private normalizeStatuses(emp: any): void {
    for (const log of emp.logs ?? []) {
      if (!log.status) log.status = log.absent ? 'Absent' : 'Present';
    }
  }

  // ---- weekend detection ----------------------------------------------------

  /** date strings look like "02 Sa" / "03 Su" (also handles German "So") */
  isWeekend(log: any): boolean {
    const m = String(log?.date ?? '').trim().match(/([A-Za-z]{2})$/);
    if (!m) return false;
    const day = m[1].toLowerCase();
    return day === 'sa' || day === 'su' || day === 'so';
  }

  // ---- attendance status ----------------------------------------------------

  meta(log: any): StatusMeta {
    return this.statusMeta[log?.status] ?? this.statusMeta['Present'];
  }

  setStatus(log: any, value: string): void {
    if (this.isWeekend(log)) return; // weekends stay non-working
    log.status = value;
  }

  isHalfDay(log: any): boolean {
    return log?.status === 'Half Day';
  }

  /** show a status chip for any non-Present (and non-weekend) day */
  hasBadge(log: any): boolean {
    return !this.isWeekend(log) && this.meta(log).badgeClass !== '';
  }

  rowClass(log: any): string {
    return this.isWeekend(log) ? '' : this.meta(log).rowClass;
  }
 
  isRowLocked(log: any): boolean {
    return this.isWeekend(log) || this.meta(log).locked;
  }
 
  isFieldDisabled(log: any, field: FieldDef): boolean {
    if (this.isRowLocked(log)) return true;
    if (this.isHalfDay(log) && field.session === 'PM') return true;
    return false;
  }
 
  fieldTooltip(log: any, field: FieldDef): string {
    if (this.isWeekend(log)) return 'Weekend — non-working day';
    if (this.isFieldDisabled(log, field)) return this.meta(log).tooltip;
    return this.statusTooltip(log, field);
  }
 
  isFillable(field: FieldDef): boolean {
    return !!field.fillValue;
  }
 
  canFillAnyBlank(field: FieldDef): boolean {
    if (!this.isFillable(field)) return false;
    return this.employee.logs.some(
      (log: any) => !this.isFieldDisabled(log, field) && this.isBlank(log[field.key]),
      console.log(this.employee)
    );
  }

   
  fillAllBlank(field: FieldDef): void {
    if (!this.isFillable(field)) return;
    for (const log of this.employee.logs) {
      if (this.isFieldDisabled(log, field)) continue;
      if (this.isBlank(log[field.key])) log[field.key] = field.fillValue;
    }
  }

  // ---- status / colour detection -------------------------------------------

  /** parse "HH:mm" (or "HH:mm:ss") into minutes since midnight, else null */
  private toMinutes(val: any): number | null {
    if (val === null || val === undefined || String(val).trim() === '') return null;
    const m = String(val).trim().match(/^(\d{1,2}):(\d{2})/);
    if (!m) return null;
    return Number(m[1]) * 60 + Number(m[2]);
  }

  private isBlank(val: any): boolean {
    return val === null || val === undefined || String(val).trim() === '';
  }

  getStatus(log: any, field: FieldDef): FieldStatus {
    const value = log[field.key];

    if (this.isBlank(value)) {
      return field.required ? 'blank-required' : 'blank-optional';
    }

    if (field.lateAfter !== null) {
      const mins = this.toMinutes(value);
      if (mins !== null) return mins > field.lateAfter ? 'late' : 'ontime';
    }

    // a filled out-punch / OT field with no late concept
    return field.lateAfter !== null ? 'ontime' : 'neutral';
  }

  /** tailwind classes per status, applied to the input */
  inputClasses(log: any, field: FieldDef): Record<string, boolean> {
    const status = this.getStatus(log, field);
    return {
      'tr-late': status === 'late',
      'tr-ontime': status === 'ontime',
      'tr-blank-required': status === 'blank-required',
      'tr-blank-optional': status === 'blank-optional',
      'tr-neutral': status === 'neutral',
    };
  }

  statusTooltip(log: any, field: FieldDef): string {
    switch (this.getStatus(log, field)) {
      case 'late': return `${field.label} is late (after scheduled time).`;
      case 'ontime': return `${field.label} is on time.`;
      case 'blank-required': return `${field.label} is required but blank.`;
      case 'blank-optional': return `${field.label} is optional / pending.`;
      default: return '';
    }
  }

  // ---- edited indicator ----------------------------------------------------

  private norm(val: any): string {
    return this.isBlank(val) ? '' : String(val).trim();
  }

  isEdited(index: number, field: FieldDef): boolean {
    const orig = this.original?.logs?.[index]?.[field.key];
    const cur = this.employee?.logs?.[index]?.[field.key];
    return this.norm(orig) !== this.norm(cur);
  }

  /** the attendance status changed from its original value */
  isStatusEdited(index: number): boolean {
    return this.original?.logs?.[index]?.status !== this.employee?.logs?.[index]?.status;
  }

  get editedCount(): number {
    let count = 0;
    this.employee.logs.forEach((log: any, i: number) => {
      if (this.isStatusEdited(i)) count++;
      // ignore edits on disabled fields (locked rows / half-day PM)
      for (const f of this.fields) {
        if (!this.isFieldDisabled(log, f) && this.isEdited(i, f)) count++;
      }
    });
    return count;
  }

  // ---- save ----------------------------------------------------------------

  /** required punches for an editable day, given its attendance status */
  private requiredFields(log: any): FieldDef[] {
    if (this.isHalfDay(log)) {
      // morning session only
      return this.fields.filter(f => f.key === 'amIn' || f.key === 'amOut');
    }
    return this.fields.filter(f => f.required);
  }

  /** validate required fields on any editable day that has at least one punch */
  private validate(): string | null {
    for (let i = 0; i < this.employee.logs.length; i++) {
      const log = this.employee.logs[i];
      if (this.isRowLocked(log)) continue; // weekends / absent / leave / OB / holiday

      const editable = this.fields.filter(f => !this.isFieldDisabled(log, f));
      const hasAny = editable.some(f => !this.isBlank(log[f.key]));
      if (!hasAny) continue; // nothing entered = treat as non-working, no error

      const missing = this.requiredFields(log)
        .filter(f => this.isBlank(log[f.key]))
        .map(f => f.label);

      if (missing.length) {
        return `${log.date}: missing required ${missing.join(' & ')}.`;
      }
    }
    return null;
  }

  async save() {
    if (this.saving) return;

    const error = this.validate();
    if (error) {
      this.snackBar.open(error, 'Dismiss', {
        duration: 5000,
        panelClass: 'tr-snack-error',
      });
      return;
    }

    this.saving = true;
    try {
      await this.persist();
      this.snackBar.open('Time records saved successfully.', 'OK', {
        duration: 3000,
        panelClass: 'tr-snack-success',
      });
      this.dialogRef.close(this.employee);
    } catch {
      this.saving = false;
      this.snackBar.open('Failed to save time records. Please try again.', 'Retry', {
        duration: 5000,
        panelClass: 'tr-snack-error',
      });
    }
  }

  /**
   * Hand the updated record back to the parent component. Kept as a promise so
   * the spinner / disabled state has a defined async boundary and so a real
   * backend call can be dropped in here later.
   */
  private persist(): Promise<void> {
    return Promise.resolve();
  }

  close() {
    this.dialogRef.close(null);
  }
}
