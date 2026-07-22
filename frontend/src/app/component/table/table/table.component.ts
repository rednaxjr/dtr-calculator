import { Component, Input, ContentChild, TemplateRef, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-table',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  templateUrl: './table.component.html',
  styleUrl: './table.component.scss'
})
export class TableComponent implements OnChanges {
  @Input() data: any[] = [];
  @Input() labels: any[] = [];
  /** Rows per page for the portrait card list. */
  @Input() pageSize = 8;
  @ContentChild(TemplateRef) actions?: TemplateRef<any>;

  pageIndex = 0;

  ngOnChanges(): void { 
    if (this.pageIndex > this.totalPages - 1) {
      this.pageIndex = this.totalPages - 1;
    }
    if (this.pageIndex < 0) this.pageIndex = 0;
  }
 
  get titleField(): string {
    const nameLabel = this.labels?.find(l => l.field === 'name' || l.text === 'Name');
    return nameLabel ? nameLabel.field : (this.labels?.[0]?.field ?? '');
  }
 
  get infoLabels(): any[] {
    return (this.labels || []).filter(l => l.field !== 'action' && l.field !== this.titleField);
  }

  get hasActions(): boolean {
    return !!this.actions && (this.labels || []).some(l => l.field === 'action');
  }
 
  get total(): number {
    return this.data?.length || 0;
  }

  get totalPages(): number {
    return Math.max(1, Math.ceil(this.total / this.pageSize));
  }

  get pagedData(): any[] {
    const start = this.pageIndex * this.pageSize;
    return (this.data || []).slice(start, start + this.pageSize);
  }

  get fromItem(): number {
    return this.total === 0 ? 0 : this.pageIndex * this.pageSize + 1;
  }

  get toItem(): number {
    return Math.min((this.pageIndex + 1) * this.pageSize, this.total);
  }

  get canPrev(): boolean {
    return this.pageIndex > 0;
  }

  get canNext(): boolean {
    return this.pageIndex < this.totalPages - 1;
  }

  prevPage(): void {
    if (this.canPrev) this.pageIndex--;
  }

  nextPage(): void {
    if (this.canNext) this.pageIndex++;
  }

  /** Formats a cell value, mirroring the old table's empty/zero handling. */
  display(row: any, label: any): string {
    const value = row?.[label.field];
    if (value === 0 || value === '0') return '0';
    if (value === '' || value === null || value === undefined) return '-';
    return value;
  }
}
