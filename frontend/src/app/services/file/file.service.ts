import { Injectable, signal } from '@angular/core';
import { HttpClient, HttpEvent, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Router } from '@angular/router';

import { environment } from '../../../environments/environment.prod';
import { ConfigService } from '../config/config.service';


declare global {
  interface Window {
    electronAPI: {
      listPdfs: (folderPath: string, signatureDir: string) => Promise<any[]>;
      readPdf: (filePath: string) => Promise<string>;
      deletePdf: (filePath: string) => Promise<void>;
      saveSignature: (signatureDir: string, stem: string, base64Data: string) => Promise<void>;
      deleteSignature: (signatureDir: string, stem: string) => Promise<void>;
      onConfigUpdated: (callback: (newConfig: any) => void) => void;
      config: any;
    };
  }
}
@Injectable({
  providedIn: 'root'
})
export class FileService {
  private url = `${this.configService.apiUrl}/file`;
  headers = {
    headers: new HttpHeaders().set('Content-Type', "application/json")
  }

  constructor(
    private httpClient: HttpClient,
    private configService: ConfigService
  ) { } 

  async get_files2(){
  
  }
 
}
