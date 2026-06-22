import { Injectable } from '@angular/core';
import * as XLSX from 'xlsx';
import { EmployeeDtr, DtrEntry } from '../dtr/dtr.service';

@Injectable({ providedIn: 'root' })
export class ExcelParserService {

  parseFile(file: File): Promise<EmployeeDtr[]> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target!.result as ArrayBuffer);
          const wb = XLSX.read(data, { type: 'array' });
          const result: EmployeeDtr[] = [];
          for (const sheetName of wb.SheetNames) {
            const ws = wb.Sheets[sheetName];
            const rows: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });
            result.push(...this.detectAndParse(sheetName, rows));
          }
          resolve(result.filter(r => r.entries.length > 0));
        } catch (err) {
          reject(err);
        }
      };
      reader.onerror = (err) => reject(err);
      reader.readAsArrayBuffer(file);
    });
  }

  private detectAndParse(sheetName: string, rows: any[][]): EmployeeDtr[] {
    if (rows.length < 2) return [];

    // Try flat format: header row has "Name" and "Date" or "Day" columns
    const headerIdx = this.findHeaderRowIndex(rows);
    if (headerIdx >= 0) {
      const header = rows[headerIdx].map((c: any) => String(c).toLowerCase().trim());
      const nameCol = this.findCol(header, ['name', 'employee name', 'employee']);
      const dateCol = this.findCol(header, ['date', 'day']);
      const amInCol = this.findCol(header, ['am in', 'am arrival', 'morning in', 'time in', 'in']);
      const amOutCol = this.findCol(header, ['am out', 'am departure', 'morning out', 'time out', 'out']);
      const pmInCol = this.findCol(header, ['pm in', 'pm arrival', 'afternoon in']);
      const pmOutCol = this.findCol(header, ['pm out', 'pm departure', 'afternoon out']);

      if (nameCol >= 0 && (amInCol >= 0 || pmInCol >= 0)) {
        return this.parseFlatFormat(rows, headerIdx, nameCol, dateCol, amInCol, amOutCol, pmInCol, pmOutCol);
      }
      if (dateCol >= 0 && amInCol >= 0) {
        // Single employee in this sheet, no name column
        return [this.parseSingleSheetFlat(sheetName, rows, headerIdx, dateCol, amInCol, amOutCol, pmInCol, pmOutCol)];
      }
    }

    // Try CSC Form 48 style: first data column is day number (1-31)
    const dayColIdx = this.findDayColumn(rows);
    if (dayColIdx >= 0) {
      const employeeName = this.extractEmployeeName(rows) || sheetName;
      const period = this.extractPeriod(rows);
      const entries = this.parseDayRows(rows, dayColIdx);
      return [{ employee_name: employeeName, period_from: period.from, period_to: period.to, entries }];
    }

    return [];
  }

  private parseFlatFormat(
    rows: any[][], headerIdx: number,
    nameCol: number, dateCol: number,
    amInCol: number, amOutCol: number, pmInCol: number, pmOutCol: number
  ): EmployeeDtr[] {
    const grouped: Record<string, { entries: DtrEntry[]; period_from: string; period_to: string }> = {};
    for (let i = headerIdx + 1; i < rows.length; i++) {
      const row = rows[i];
      const name = String(row[nameCol] ?? '').trim();
      if (!name) continue;
      if (!grouped[name]) grouped[name] = { entries: [], period_from: '', period_to: '' };
      const dateStr = this.parseDate(row[dateCol]);
      const entry: DtrEntry = {
        day: i - headerIdx,
        date: dateStr,
        am_in: this.parseTime(row[amInCol]),
        am_out: this.parseTime(row[amOutCol >= 0 ? amOutCol : -1]),
        pm_in: this.parseTime(row[pmInCol >= 0 ? pmInCol : -1]),
        pm_out: this.parseTime(row[pmOutCol >= 0 ? pmOutCol : -1]),
      };
      if (dateStr && !grouped[name].period_from) grouped[name].period_from = dateStr;
      if (dateStr) grouped[name].period_to = dateStr;
      grouped[name].entries.push(entry);
    }
    return Object.entries(grouped).map(([name, g]) => ({
      employee_name: name, period_from: g.period_from, period_to: g.period_to, entries: g.entries,
    }));
  }

  private parseSingleSheetFlat(
    sheetName: string, rows: any[][], headerIdx: number,
    dateCol: number, amInCol: number, amOutCol: number, pmInCol: number, pmOutCol: number
  ): EmployeeDtr {
    const entries: DtrEntry[] = [];
    let periodFrom = '', periodTo = '';
    for (let i = headerIdx + 1; i < rows.length; i++) {
      const row = rows[i];
      const dateStr = this.parseDate(row[dateCol]);
      if (!dateStr && !row.some((c: any) => c !== '')) continue;
      if (!periodFrom && dateStr) periodFrom = dateStr;
      if (dateStr) periodTo = dateStr;
      entries.push({
        day: entries.length + 1,
        date: dateStr,
        am_in: this.parseTime(row[amInCol]),
        am_out: this.parseTime(row[amOutCol >= 0 ? amOutCol : -1]),
        pm_in: this.parseTime(row[pmInCol >= 0 ? pmInCol : -1]),
        pm_out: this.parseTime(row[pmOutCol >= 0 ? pmOutCol : -1]),
      });
    }
    return { employee_name: sheetName, period_from: periodFrom, period_to: periodTo, entries };
  }

  private parseDayRows(rows: any[][], dayCol: number): DtrEntry[] {
    const entries: DtrEntry[] = [];
    for (const row of rows) {
      const day = Number(row[dayCol]);
      if (!day || day < 1 || day > 31) continue;
      entries.push({
        day,
        am_in: this.parseTime(row[dayCol + 1]),
        am_out: this.parseTime(row[dayCol + 2]),
        pm_in: this.parseTime(row[dayCol + 3]),
        pm_out: this.parseTime(row[dayCol + 4]),
      });
    }
    return entries;
  }

  private findHeaderRowIndex(rows: any[][]): number {
    const keywords = ['name', 'date', 'day', 'am', 'pm', 'in', 'out', 'arrival', 'departure', 'employee'];
    for (let i = 0; i < Math.min(10, rows.length); i++) {
      const row = rows[i].map((c: any) => String(c).toLowerCase());
      const hits = keywords.filter(k => row.some((cell: string) => cell.includes(k)));
      if (hits.length >= 2) return i;
    }
    return -1;
  }

  private findDayColumn(rows: any[][]): number {
    for (const row of rows.slice(0, 15)) {
      const dayLike = row.findIndex((c: any) => Number(c) >= 1 && Number(c) <= 5);
      if (dayLike >= 0) {
        const seq = rows.filter(r => Number(r[dayLike]) >= 1 && Number(r[dayLike]) <= 31);
        if (seq.length >= 5) return dayLike;
      }
    }
    return -1;
  }

  private extractEmployeeName(rows: any[][]): string {
    const markers = ['name:', 'employee:', 'employee name:'];
    for (const row of rows.slice(0, 10)) {
      for (let i = 0; i < row.length; i++) {
        const cell = String(row[i]).toLowerCase().trim();
        if (markers.some(m => cell.startsWith(m))) {
          return String(row[i + 1] ?? '').trim() || cell.replace(/.*:/, '').trim();
        }
        if (cell === 'name' || cell === 'employee name') {
          return String(row[i + 1] ?? '').trim();
        }
      }
    }
    return '';
  }

  private extractPeriod(rows: any[][]): { from: string; to: string } {
    for (const row of rows.slice(0, 10)) {
      for (const cell of row) {
        const str = String(cell);
        const match = str.match(/(\d{4}-\d{2}-\d{2})/g);
        if (match && match.length >= 2) return { from: match[0], to: match[1] };
      }
    }
    return { from: '', to: '' };
  }

  private findCol(header: string[], candidates: string[]): number {
    for (const c of candidates) {
      const idx = header.findIndex(h => h.includes(c));
      if (idx >= 0) return idx;
    }
    return -1;
  }

  private parseTime(val: any): string {
    if (!val && val !== 0) return '';
    const str = String(val).trim();
    if (/^\d{1,2}:\d{2}$/.test(str)) return str.padStart(5, '0');
    if (/^\d{1,2}:\d{2}:\d{2}$/.test(str)) return str.slice(0, 5).padStart(5, '0');
    // Excel stores times as decimal fractions of a day
    const num = parseFloat(str);
    if (!isNaN(num) && num > 0 && num < 1) {
      const totalMin = Math.round(num * 24 * 60);
      const h = Math.floor(totalMin / 60);
      const m = totalMin % 60;
      return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
    }
    return '';
  }

  private parseDate(val: any): string {
    if (!val) return '';
    const str = String(val).trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(str)) return str;
    const d = new Date(str);
    if (!isNaN(d.getTime())) return d.toISOString().slice(0, 10);
    return str;
  }
}
