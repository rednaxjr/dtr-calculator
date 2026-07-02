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
  session: Session; 
  required: boolean; 
  lateAfter: number | null; 
  fillValue?: string;
}

interface StatusMeta { 
  icon: string; 
  locked: boolean; 
  halfDay?: boolean; 
  tooltip: string; 
  badgeClass: string; 
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

  /** tracks cells filled automatically by fillAllBlank — key: "<logIndex>-<fieldKey>" */
  private autoFilledCells = new Set<string>();

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
   
    this.employee = JSON.parse(JSON.stringify(data));
    this.normalizeStatuses(this.employee); 
    this.original = JSON.parse(JSON.stringify(this.employee));
  }
 
  private normalizeStatuses(emp: any): void {
    for (const log of emp.logs ?? []) {
      if (!log.status) log.status = log.absent ? 'Absent' : 'Present';
    }
  } 
  isWeekend(log: any): boolean {
    const m = String(log?.date ?? '').trim().match(/([A-Za-z]{2})$/);
    if (!m) return false;
    const day = m[1].toLowerCase();
    return day === 'sa' || day === 'su' || day === 'so';
  } 

  meta(log: any): StatusMeta {
    return this.statusMeta[log?.status] ?? this.statusMeta['Present'];
  }

  setStatus(log: any, value: string): void {
    if (this.isWeekend(log)) return;  
    log.status = value;
  }

  isHalfDay(log: any): boolean {
    return log?.status === 'Half Day';
  } 
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
    this.employee.logs.forEach((log: any, i: number) => {
      if (this.isFieldDisabled(log, field)) return;
      if (this.isBlank(log[field.key])) {
        log[field.key] = field.fillValue;
        this.autoFilledCells.add(`${i}-${field.key}`);
      }
    });
  }

  isAutoFilled(index: number, field: FieldDef): boolean {
    return this.autoFilledCells.has(`${index}-${field.key}`);
  }
 
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
 
    return field.lateAfter !== null ? 'ontime' : 'neutral';
  }
 
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
      case 'late': return `Late`;
      case 'ontime': return `On Time`;
      case 'blank-required': return `Required`;
      case 'blank-optional': return `Optional`;
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
  isModified(index: number, field: FieldDef): boolean {
    const log = this.employee?.logs?.[index];
    if (!log || this.isFieldDisabled(log, field)) return false;
    return this.isEdited(index, field);
  }
 
  originalValue(index: number, field: FieldDef): string {
    const val = this.original?.logs?.[index]?.[field.key];
    return this.isBlank(val) ? '—' : String(val).trim();
  }
 
  originalValueColor(index: number, field: FieldDef): string {
    const orig = this.original?.logs?.[index];
    if (!orig) return '#6b7280'; // gray-500
    switch (this.getStatus(orig, field)) {
      case 'late': return '#ef4444';          
      case 'blank-required': return '#ef4444';  
      case 'blank-optional': return '#f97316';  
      case 'ontime': return '#6b7280';        
      default: return '#6b7280';         
    }
  }

  isStatusEdited(index: number): boolean {
    return this.original?.logs?.[index]?.status !== this.employee?.logs?.[index]?.status;
  }

  get editedCount(): number {
    let count = 0;
    this.employee.logs.forEach((log: any, i: number) => {
      if (this.isStatusEdited(i)) count++;
      for (const f of this.fields) {
        if (!this.isFieldDisabled(log, f) && this.isEdited(i, f)) count++;
      }
    });
    return count;
  }

  /**
   * Number of blank / missing editable inputs in a single column (field).
   * Recomputed on every change-detection pass, so each header badge stays in
   * sync with manual edits and fillAllBlank without any counter bookkeeping.
   */
  blankCountFor(field: FieldDef): number {
    let count = 0;
    for (const log of this.employee.logs) {
      if (this.isFieldDisabled(log, field)) continue;
      if (this.isBlank(log[field.key])) count++;
    }
    return count;
  }
 
  private requiredFields(log: any): FieldDef[] {
    if (this.isHalfDay(log)) { 
      return this.fields.filter(f => f.key === 'amIn' || f.key === 'amOut');
    }
    return this.fields.filter(f => f.required);
  } 
  private validate(): string | null {
    for (let i = 0; i < this.employee.logs.length; i++) {
      const log = this.employee.logs[i];
      if (this.isRowLocked(log)) continue; 

      const editable = this.fields.filter(f => !this.isFieldDisabled(log, f));
      const hasAny = editable.some(f => !this.isBlank(log[f.key]));
      if (!hasAny) continue;  

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
 
  private persist(): Promise<void> {
    return Promise.resolve();
  }

  close() {
    this.dialogRef.close(null);
  }
}
