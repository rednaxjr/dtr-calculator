import { Component, ViewChild, ElementRef, AfterViewInit, OnDestroy, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialogModule } from '@angular/material/dialog';
import { FormBuilder, FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import SignaturePad from 'signature_pad';
import { FileService } from '../../../services/file/file.service';
@Component({
  selector: 'app-e-sign2',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule, MatDialogModule, FormsModule],
  templateUrl: './e-sign2.component.html',
  styleUrl: './e-sign2.component.scss'
})
export class ESign2Component implements AfterViewInit, OnDestroy {
  @ViewChild('canvas') canvasRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('canvasContainer') containerRef!: ElementRef<HTMLDivElement>;

  signaturePad!: SignaturePad;
  resizeObserver!: ResizeObserver;
  isEmpty = true;
  fname: any;
  lname: any;
  mname: any;
  page: any = 1;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: { title: string; type: string },
    private dialog: MatDialogRef<ESign2Component>,
    private file_service: FileService
  ) { }

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

  save() {
    if (this.signaturePad.isEmpty()) return; 
    const blob = this.dataURLtoBlob(this.signaturePad.toDataURL('image/png'));
    const formData = new FormData();
    const file_name = this.lname + this.fname[0].toUpperCase()
    const sign_data = {
      lname: this.lname,
      fname: this.fname,
      mname: this.mname,
      file_name: file_name
    }
    formData.append('files', blob, 'signature.png');
    formData.append('sign_data', JSON.stringify(sign_data));
    this.file_service.uploadFile(formData).subscribe((res: any) => { 
      
    });
    this.dialog.close({ signature: this.signaturePad });
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

    this.dialog.close(null);
  }
}