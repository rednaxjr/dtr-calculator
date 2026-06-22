import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ConfigService {
  private config: any = {};

  constructor(private http: HttpClient) { }
  async loadConfig(): Promise<void> {
    try {
      const electronConfig = (window as any).electronAPI?.config;

      if (electronConfig && Object.keys(electronConfig).length > 0) {
        this.config = electronConfig;
      } else {
        this.config = await firstValueFrom(
          this.http.get('assets/config.json')
        );
      }
      console.log('[Config] Loaded:', this.config);
    } catch (error) {
      console.error('Config load failed:', error);
      this.config = {};
    }

    (window as any).electronAPI?.onConfigUpdated?.((newConfig: any) => {
      this.config = newConfig;
      console.log('[Config] Updated live:', newConfig);
    });
  }

  get apiUrl(): string {
    return this.config['apiUrl'];
  }

  get uploadDir(): string {
    return this.config['file_dir'];
  }

  get signatureDir(): string {
    return this.config['signature_dir'];
  }
}