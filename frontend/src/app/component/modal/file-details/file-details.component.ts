import { Component, ViewChild, ElementRef, AfterViewInit, OnDestroy, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialogModule } from '@angular/material/dialog';
import { FormBuilder, FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import SignaturePad from 'signature_pad';
import { FileService } from '../../../services/file/file.service';
import { PdfViewerModule } from 'ng2-pdf-viewer';

import { HttpClient, HttpEvent, HttpHeaders } from '@angular/common/http';
import { ɵEmptyOutletComponent } from "@angular/router";
@Component({
  selector: 'app-file-details',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule, MatDialogModule, FormsModule, PdfViewerModule, ɵEmptyOutletComponent],
  templateUrl: './file-details.component.html',
  styleUrl: './file-details.component.scss'
})
export class FileDetailsComponent implements AfterViewInit, OnDestroy {

  @ViewChild('canvas') canvasRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('canvasContainer') containerRef!: ElementRef<HTMLDivElement>;
  pdfSrc = 'http://localhost:3000/uploaded_files/IMG_0020.pdf';
  signaturePad!: SignaturePad;
  resizeObserver!: ResizeObserver;
  isEmpty = true;
  fname: any;
  lname: any;
  mname: any;
  page: any = 1;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: any,
    private dialog: MatDialogRef<FileDetailsComponent>,
    private file_service: FileService
  ) { 
  }

  ngAfterViewInit() {
    this.signaturePad = new SignaturePad(this.canvasRef.nativeElement, {
      minWidth: 1,
      maxWidth: 3,
      penColor: '#1a1a2e',
    });

    this.signaturePad.addEventListener('beginStroke', () => {
      this.isEmpty = false;
    });

    this.resizeObserver = new ResizeObserver(() => this.resizeCanvas());
    this.resizeObserver.observe(this.containerRef.nativeElement);
    this.resizeCanvas();
  }

  ngOnDestroy() {
    this.resizeObserver?.disconnect();
    this.signaturePad?.off();
  }

  resizeCanvas() {
    const canvas = this.canvasRef.nativeElement;
    const container = this.containerRef.nativeElement;
    const data = this.signaturePad.isEmpty() ? null : this.signaturePad.toData();

    const ratio = window.devicePixelRatio || 1;
    canvas.width = container.offsetWidth * ratio;
    canvas.height = container.offsetHeight * ratio;
    canvas.getContext('2d')!.scale(ratio, ratio);

    this.signaturePad.clear();
    if (data) {
      this.signaturePad.fromData(data);
    }
  }

  clear() {
    this.signaturePad.clear();
    this.isEmpty = true;
  }

  async save() {
    if (this.signaturePad.isEmpty()) return;
    const dataUrl = this.signaturePad.toDataURL('image/png');
    const base64 = dataUrl.split(',')[1];
    const stem = this.data.pdf.name.replace(/\.pdf$/i, '');
    await this.file_service.saveSignature(stem, base64);
    this.dialog.close({ action: 'save' });
  }

  async deleteSignature() {
    const stem = this.data.pdf.name.replace(/\.pdf$/i, '');
    await this.file_service.deleteSignature(stem);
    this.dialog.close({ action: 'save' });
  }
  private dataURLtoBlob(dataUrl: string): Blob {
    const [header, data] = dataUrl.split(',');
    const mime = header.match(/:(.*?);/)![1];
    const binary = atob(data);
    const array = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) array[i] = binary.charCodeAt(i);
    return new Blob([array], { type: mime });
  }


  close() {
    this.dialog.close({
      action: 'close'
    });
  }
}