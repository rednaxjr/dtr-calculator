import { Component, ElementRef, signal, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatDialog } from '@angular/material/dialog';
import { ExcelParserService } from '../../../../services/excel-parser/excel-parser.service';
import { DtrService, EmployeeDtr } from '../../../../services/dtr/dtr.service';
import { DtrViewModalComponent } from '../../../../component/modal/dtr-view-modal/dtr-view-modal.component';
import { ParserService } from '../../../../services/parser/parser.service';
@Component({
  selector: 'app-dtr-upload',
  standalone: true,
  imports: [CommonModule, RouterModule, MatButtonModule, MatIconModule, MatTableModule],
  templateUrl: './dtr-upload.component.html',
  styleUrl: './dtr-upload.component.scss',
})
export class DtrUploadComponent {
  constructor(
    private parser_service: ParserService,
    private dtrService: DtrService
  ) { }
  ngOnInit(): void { }

  isDragging = signal(false);

  onDragOver(e: DragEvent) {
    e.preventDefault();
    this.isDragging.set(true);
  }

  onDrop(e: DragEvent) {
    e.preventDefault();
    this.isDragging.set(false);
    const file = e.dataTransfer?.files[0];
    if (file) this.parser_service.parseFile(file);
  }

  onFileSelected(e: Event) {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (file) this.parser_service.parseFile(file);
  }
}
