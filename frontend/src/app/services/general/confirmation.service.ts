import { Injectable } from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
// import { ConfirmDialogComponent,  } from './confirm-dialog/confirm-dialog.component';
// ConfirmationDialogComponent
import { Observable } from 'rxjs';
import { ConfirmationDialogComponent,ConfirmDialogData } from '../../component/parts/confirmation-dialog/confirmation-dialog.component'; 
 

@Injectable({
  providedIn: 'root'
})
export class ConfirmationService {
  constructor(private dialog: MatDialog) {}

  confirm(data: ConfirmDialogData): Observable<boolean> {
    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      width: '400px',
      disableClose: true,
      data: data
    });

    return dialogRef.afterClosed();
  }

  // Helper methods for common scenarios
  delete(itemName: string): Observable<boolean> {
    return this.confirm({
      title: 'Delete Confirmation',
      message: `Are you sure you want to delete <strong>${itemName}</strong>?<br>This action cannot be undone.`,
      confirmText: 'Delete',
      cancelText: 'Cancel',
      type: 'danger'
    });
  }

  save(itemName?: string): Observable<boolean> {
    return this.confirm({
      title: 'Save Changes',
      message: itemName 
        ? `Do you want to save changes to <strong>${itemName}</strong>?`
        : 'Do you want to save your changes?',
      confirmText: 'Save',
      cancelText: 'Cancel',
      type: 'info'
    });
  }

  discard(): Observable<boolean> {
    return this.confirm({
      title: 'Discard Changes',
      message: 'You have unsaved changes. Are you sure you want to discard them?',
      confirmText: 'Discard',
      cancelText: 'Keep Editing',
      type: 'warning'
    });
  }

  success(itemName: string): Observable<boolean> {
    return this.confirm({
      title: 'Activate Item',
      message: `Are you sure you want to activate <strong>${itemName}</strong>?`,
      confirmText: 'Activate',
      cancelText: 'Cancel',
      type: 'success'
    });
  }

  deactivate(itemName: string): Observable<boolean> {
    return this.confirm({
      title: 'Deactivate Item',
      message: `Are you sure you want to deactivate <strong>${itemName}</strong>?`,
      confirmText: 'Deactivate',
      cancelText: 'Cancel',
      type: 'warning'
    });
  }
}