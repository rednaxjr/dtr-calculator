import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { ConfigService } from '../config/config.service';

export interface Employee {
  id?: string;
  employee_id: string;
  first_name: string;
  last_name: string;
  position: string;
  department: string;
  status: 'active' | 'inactive';
  created_at?: string;
}

@Injectable({ providedIn: 'root' })
export class EmployeeService {
  private readonly LS_KEY = 'dtr_employees';

  constructor(private http: HttpClient, private configService: ConfigService) {}

  private get url() { return `${this.configService.apiUrl}/employee`; }
  private get headers() {
    return { headers: new HttpHeaders({ 'Content-Type': 'application/json' }) };
  }

  async getAll(): Promise<Employee[]> {
    try {
      return await firstValueFrom(this.http.get<Employee[]>(this.url, this.headers));
    } catch {
      return this.localGetAll();
    }
  }

  async create(emp: Employee): Promise<Employee> {
    try {
      return await firstValueFrom(this.http.post<Employee>(this.url, emp, this.headers));
    } catch {
      emp.id = 'local-' + Date.now();
      emp.created_at = new Date().toISOString();
      const list = this.localGetAll();
      list.push(emp);
      this.localSave(list);
      return emp;
    }
  }

  async update(id: string, emp: Employee): Promise<Employee> {
    try {
      return await firstValueFrom(this.http.put<Employee>(`${this.url}/${id}`, emp, this.headers));
    } catch {
      const list = this.localGetAll().map(e => e.id === id ? { ...e, ...emp } : e);
      this.localSave(list);
      return emp;
    }
  }

  async delete(id: string): Promise<void> {
    try {
      await firstValueFrom(this.http.delete(`${this.url}/${id}`, this.headers));
    } catch {
      const list = this.localGetAll().filter(e => e.id !== id);
      this.localSave(list);
    }
  }

  private localGetAll(): Employee[] {
    const raw = localStorage.getItem(this.LS_KEY);
    return raw ? JSON.parse(raw) : [];
  }

  private localSave(list: Employee[]): void {
    localStorage.setItem(this.LS_KEY, JSON.stringify(list));
  }
}
