import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import SignaturePad from 'signature_pad';
import { ESignComponent } from '../../component/modal/e-sign/e-sign.component';
import { BehaviorSubject, Observable } from 'rxjs';
import { Routes, RouterModule, Router, RouterOutlet, RouterLink, RouterLinkActive, ActivatedRoute, } from '@angular/router';
import { FormBuilder, FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { ESign2Component } from '../../component/modal/e-sign2/e-sign2.component';
import { MatIconModule } from '@angular/material/icon';
import { FileService } from '../../services/file/file.service';
import { DocumentTableComponent } from '../../component/table/document-table/document-table.component';
import { BannerComponent } from '../../component/parts/banner/banner.component';

import { HttpClient, HttpEvent, HttpHeaders } from '@angular/common/http';
@Component({
  selector: 'app-index',
  standalone: true,
  imports: [CommonModule, ESignComponent, MatIconModule, FormsModule, RouterModule, DocumentTableComponent, BannerComponent,],
  templateUrl: './index.component.html',
  styleUrl: './index.component.scss'
})

export class IndexComponent implements OnInit {
  pdfSrc = 'http://localhost:3000/uploaded_files/IMG_0020.pdf';
  documents_list: any = [];

  documents_list_duplicate: any = [];
  banner: any;

  show_esign = false;
  e_sign_image!: string;
  image_downloadable: any;
  list_of_signs: any = [];
  files_data_duplicate: any = [];
  selected_format: string = 'png';
  item_to_download: any;
  constructor(
    private dialog: MatDialog,
    private file_service: FileService,
    private httpClient: HttpClient,
    private router: Router
  ) {

    this.banner = [
      { text: null, icon: "home", link: "/admin/dashboard", },
      { text: "Product", icon: null, link: "/admin/product", },
      { text: "Client's Information", icon: null, link: "/admin/product/details" },
    ];
  }
  ngOnInit(): void {
    this.getAllFiles();
  }
  async getAllFiles() {
    this.documents_list = await this.file_service.get_files2();
    this.documents_list_duplicate = this.documents_list;

    for (let i = 0; i < this.documents_list.length; i++) {
      this.documents_list[i].status = 0;
    }
  }



  handleSignatureSaved(data: any) {
    this.getAllFiles();
  }
  deleted() {
    this.getAllFiles();
  }
  refreshPage() {
    const currentUrl = this.router.url;
    this.router.navigateByUrl('/', { skipLocationChange: true }).then(() => {
      this.router.navigate([currentUrl]);
    });
  }
}

