import { AfterViewInit, Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import SignaturePad from 'signature_pad';
import { MatDialogRef } from '@angular/material/dialog';
@Component({
  selector: 'app-e-sign',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './e-sign.component.html',
  styleUrl: './e-sign.component.scss'
})
export class ESignComponent implements AfterViewInit, OnDestroy {
  @ViewChild('canvas') canvasRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('canvasContainer') containerRef!: ElementRef<HTMLDivElement>;

  ctx!: CanvasRenderingContext2D;
  drawing = false;
  resizeObserver!: ResizeObserver;
  isEmpty = true;

  constructor(
    private dialog: MatDialogRef<ESignComponent>,
  ) { }

  ngAfterViewInit() {
    this.ctx = this.canvasRef.nativeElement.getContext('2d')!;
    this.resizeObserver = new ResizeObserver(() => this.resizeCanvas());
    this.resizeObserver.observe(this.containerRef.nativeElement);
    this.resizeCanvas();
  }

  ngOnDestroy() {
    this.resizeObserver?.disconnect();
  }

  resizeCanvas() {
    const canvas = this.canvasRef.nativeElement;
    const container = this.containerRef.nativeElement;
    const rect = container.getBoundingClientRect();
    const imageData = this.ctx?.getImageData(0, 0, canvas.width, canvas.height);
    canvas.width = rect.width;
    canvas.height = rect.height;
    this.setupContext();
    if (imageData) this.ctx.putImageData(imageData, 0, 0);
  }

  setupContext() {
    this.ctx.strokeStyle = '#1a1a2e';
    this.ctx.lineWidth = 2.5;
    this.ctx.lineCap = 'round';
    this.ctx.lineJoin = 'round';
  }

  startDrawing(e: MouseEvent) {
    this.drawing = true;
    const pos = this.getPos(e);
    this.ctx.beginPath();
    this.ctx.moveTo(pos.x, pos.y);
  }

  draw(e: MouseEvent) {
    if (!this.drawing) return;
    const pos = this.getPos(e);
    this.ctx.lineTo(pos.x, pos.y);
    this.ctx.stroke();
    this.isEmpty = false;
  }

  startDrawingTouch(e: TouchEvent) {
    e.preventDefault();
    this.drawing = true;
    const pos = this.getTouchPos(e);
    this.ctx.beginPath();
    this.ctx.moveTo(pos.x, pos.y);
  }

  drawTouch(e: TouchEvent) {
    e.preventDefault();
    if (!this.drawing) return;
    const pos = this.getTouchPos(e);
    this.ctx.lineTo(pos.x, pos.y);
    this.ctx.stroke();
    this.isEmpty = false;
  }

  stopDrawing() {
    this.drawing = false;
  }

  clear() {

    // this.signaturePad.clear();
    const canvas = this.canvasRef.nativeElement;
    this.ctx.clearRect(0, 0, canvas.width, canvas.height);
    this.isEmpty = true;
  }

  getPos(e: MouseEvent) {
    const canvas = this.canvasRef.nativeElement;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY
    };
  }

  getTouchPos(e: TouchEvent) {
    const canvas = this.canvasRef.nativeElement;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: (e.touches[0].clientX - rect.left) * scaleX,
      y: (e.touches[0].clientY - rect.top) * scaleY
    };
  }
  close() {
    this.dialog.close()
  }

}
