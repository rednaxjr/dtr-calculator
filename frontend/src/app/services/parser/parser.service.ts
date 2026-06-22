import { Injectable, signal } from '@angular/core';
import { read, utils } from 'xlsx';
import { Employee } from '../employee/employee.service';
@Injectable({
  providedIn: 'root'
})
export class ParserService {

  constructor() { }
  employees: any = [];
  isLoading: any = false;
  error = signal<string | null>(null);

  private readonly SKIP_SHEETS = [
    'Shift Setting Table',
    'Attendance Statistic Table'
  ];

  async parseFile(file: File): Promise<void> {
    this.isLoading = true
    this.error.set(null);

    try {
      const buffer = await file.arrayBuffer();
      const wb = read(buffer, { type: 'array' });
      const result = [];

      for (const sheetName of wb.SheetNames) {
        if (this.SKIP_SHEETS.includes(sheetName)) continue;

        const data: any[][] = utils.sheet_to_json(
          wb.Sheets[sheetName],
          { header: 1, defval: null }
        );

        for (let col = 0; col < data[3]?.length; col += 15) {
          if (!data[3][col + 1]) continue;

          result.push({
            name: data[3][col + 9],
            userId: data[4][col + 9],
          });
        }
      }

      this.employees = result;
      console.log(this.employees)
    } catch (err) {
      this.error.set('Failed to parse file. Please check the format.');
    } finally {
      this.isLoading = false;
    }
  }
}
