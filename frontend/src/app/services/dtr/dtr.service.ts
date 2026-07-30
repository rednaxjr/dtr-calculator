import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { ConfigService } from '../config/config.service';
import { DtrEntry, EmployeeDtr, DtrFile } from './dtr.interface';
import { Observable } from 'rxjs';
import { Router } from '@angular/router';

import { environment } from '../../../environments/environment';
@Injectable({ providedIn: 'root' })
export class DtrService {
  private readonly LS_KEY = 'dtr_files';

  constructor(
    private configService: ConfigService,
    private httpClient: HttpClient,
  ) { }

  private url = `${environment.api}/dtr`;
  private get headers() {
    return { headers: new HttpHeaders({ 'Content-Type': 'application/json' }) };
  }

  async getAllFiles(): Promise<DtrFile[]> {
    try {
      return await firstValueFrom(this.httpClient.get<DtrFile[]>(this.url, this.headers));
    } catch {
      return this.localGetAll();
    }
  }

  async saveFile(filename: string, records: EmployeeDtr[]): Promise<DtrFile> {
    const periods = records.filter(r => r.period_from);
    const file: DtrFile = {
      id: 'dtr-' + Date.now(),
      filename,
      period_from: periods[0]?.period_from ?? '',
      period_to: periods[0]?.period_to ?? '',
      employee_count: records.length,
      uploaded_at: new Date().toISOString(),
      records,
    };
    try {
      return await firstValueFrom(this.httpClient.post<DtrFile>(this.url, file, this.headers));
    } catch {
      const list = this.localGetAll();
      list.unshift(file);
      this.localSave(list);
      return file;
    }
  }





  computeDtr(entries: DtrEntry[]): DtrEntry[] {
    return entries.map(e => {
      if (e.is_absent || (!e.am_in && !e.pm_in)) return { ...e, hours_rendered: 0, late_minutes: 0, undertime_minutes: 0 };
      const amHours = this.diffHours(e.am_in, e.am_out);
      const pmHours = this.diffHours(e.pm_in, e.pm_out);
      const late = e.am_in ? Math.max(0, this.toMinutes(e.am_in) - this.toMinutes('08:00')) : 0;
      const undertime = e.pm_out ? Math.max(0, this.toMinutes('17:00') - this.toMinutes(e.pm_out)) : 0;
      return { ...e, hours_rendered: +(amHours + pmHours).toFixed(2), late_minutes: late, undertime_minutes: undertime };
    });
  }

  private localGetAll(): DtrFile[] {
    const raw = localStorage.getItem(this.LS_KEY);
    return raw ? JSON.parse(raw) : [];
  }

  private localSave(list: DtrFile[]): void {
    localStorage.setItem(this.LS_KEY, JSON.stringify(list));
  }

  private diffHours(from: string, to: string): number {
    if (!from || !to) return 0;
    const diff = (this.toMinutes(to) - this.toMinutes(from)) / 60;
    return Math.max(0, diff);
  }

  private toMinutes(time: string): number {
    if (!time) return 0;
    const [h, m] = time.split(':').map(Number);
    return h * 60 + (m || 0);
  }

  add_dtr(data: any) {
    return this.httpClient.post(this.url + "/add_dtr", data, this.headers);
  }




}
