import { Component, Input, ContentChild, TemplateRef, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-table-landscape',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  templateUrl: './table-landscape.component.html',
  styleUrl: './table-landscape.component.scss'
})
export class TableLandscapeComponent {
  @Input() data: any[] = [];
  @Input() labels: any[] = [];
}
