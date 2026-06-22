import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Employee, EmployeeService } from '../../../services/employee/employee.service';

@Component({
  selector: 'app-employee-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatDialogModule, MatFormFieldModule,
    MatInputModule, MatSelectModule, MatButtonModule, MatIconModule],
  templateUrl: './employee-modal.component.html',
  styleUrl: './employee-modal.component.scss',
})
export class EmployeeModalComponent implements OnInit {
  form!: FormGroup;
  saving = false;

  get isEdit() { return this.data.mode === 'edit'; }

  constructor(
    private fb: FormBuilder,
    private employeeService: EmployeeService,
    private dialogRef: MatDialogRef<EmployeeModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { mode: 'add' | 'edit'; employee?: Employee },
  ) {}

  ngOnInit() {
    const emp = this.data.employee;
    this.form = this.fb.group({
      employee_id: [emp?.employee_id ?? '', Validators.required],
      first_name: [emp?.first_name ?? '', Validators.required],
      last_name: [emp?.last_name ?? '', Validators.required],
      position: [emp?.position ?? '', Validators.required],
      department: [emp?.department ?? '', Validators.required],
      status: [emp?.status ?? 'active', Validators.required],
    });
  }

  async save() {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.saving = true;
    try {
      if (this.isEdit && this.data.employee?.id) {
        await this.employeeService.update(this.data.employee.id, this.form.value);
      } else {
        await this.employeeService.create(this.form.value);
      }
      this.dialogRef.close(true);
    } finally {
      this.saving = false;
    }
  }

  cancel() { this.dialogRef.close(false); }
}
