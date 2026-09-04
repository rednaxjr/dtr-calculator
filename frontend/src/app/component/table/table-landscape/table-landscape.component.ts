import { Component, Input, AfterViewInit, ViewChild, ContentChild, TemplateRef, OnInit, SimpleChanges, EventEmitter, Output, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
@Component({
  selector: 'app-table-landscape',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule],
  templateUrl: './table-landscape.component.html',
  styleUrl: './table-landscape.component.scss'
})
export class TableLandscapeComponent implements OnChanges {
  @Input() data: any[] = [];
  @Input() labels: any[] = [];
  /** optional per-row classes, e.g. to flash a row the user just saved */
  @Input() row_class: (item: any, index: number) => string = () => '';
  @Input() page_size = 10;
  @Input() page_size_options: number[] = [10, 25, 50, 100];

  @ContentChild(TemplateRef) actions?: TemplateRef<any>;

  page = 1;

  ngOnChanges(changes: SimpleChanges) {
    // a fresh data set (a filter, a refresh) starts back at the first page
    if (changes['data']) this.page = 1;
  }

  get total(): number {
    return this.data?.length ?? 0;
  }

  get total_pages(): number {
    return Math.max(1, Math.ceil(this.total / this.page_size));
  }

  /** the page actually shown, clamped in case the data shrank under us */
  get current_page(): number {
    return Math.min(Math.max(1, this.page), this.total_pages);
  }

  get first_index(): number {
    return (this.current_page - 1) * this.page_size;
  }

  get paged_data(): any[] {
    return (this.data ?? []).slice(this.first_index, this.first_index + this.page_size);
  }

  get range_start(): number {
    return this.total ? this.first_index + 1 : 0;
  }

  get range_end(): number {
    return Math.min(this.first_index + this.page_size, this.total);
  }

  /** page numbers around the current one; null marks a gap */
  get pages(): (number | null)[] {
    const last = this.total_pages;
    const current = this.current_page;

    if (last <= 7) {
      return Array.from({ length: last }, (_, i) => i + 1);
    }

    const out: (number | null)[] = [1];
    const start = Math.max(2, current - 1);
    const end = Math.min(last - 1, current + 1);

    if (start > 2) out.push(null);
    for (let page = start; page <= end; page++) out.push(page);
    if (end < last - 1) out.push(null);
    out.push(last);

    return out;
  }

  go_to(page: number | null) {
    if (page === null) return;
    this.page = Math.min(Math.max(1, page), this.total_pages);
  }

  change_page_size(size: any) {
    this.page_size = Number(size) || 10;
    this.page = 1;
  }
}
