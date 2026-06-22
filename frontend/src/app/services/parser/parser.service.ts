import { Injectable, signal } from '@angular/core';
import { read, utils } from 'xlsx';
import { Employee, DailyLog } from '../../component/models/employee.model';

@Injectable({
  providedIn: 'root'
})
export class ParserService {
employees = signal<Employee[]>([]);
  isLoading  = signal(false);
  error      = signal<string | null>(null);

  private readonly SKIP_SHEETS = [
    'Shift Setting Table',
    'Attendance Statistic Table'
  ];

  // Column offsets within each 15-col employee block
  private readonly COL = {
    dept:   1,
    name:   9,
    userId: 9,    
    date:   0,
    amIn:   1,
    amOut:  3,
    pmIn:   6,
    pmOut:  8,
    otIn:   10,
    otOut:  12,
  };

  // Rows (0-indexed)
  private readonly ROW = {
    nameRow:   3,   // row 4
    userIdRow: 4,   // row 5
    logsStart: 12,  // row 13
    logsEnd:   42,  // row 43
  };

  async parseFile(file: File): Promise<void> {
    this.isLoading.set(true);
    this.error.set(null);

    try {
      const buffer = await file.arrayBuffer();
      const wb = read(buffer, { type: 'array' });
      const result: Employee[] = [];

      for (const sheetName of wb.SheetNames) {
        if (this.SKIP_SHEETS.includes(sheetName)) continue;

        const data: any[][] = utils.sheet_to_json(
          wb.Sheets[sheetName],
          { header: 1, defval: null }
        );

        if (!data || data.length < 5) continue;

        const totalCols = data[this.ROW.nameRow]?.length ?? 0;

        for (let col = 0; col < totalCols; col += 15) {
          const dept   = data[this.ROW.nameRow]?.[col + this.COL.dept];
          const name   = data[this.ROW.nameRow]?.[col + this.COL.name];
          const userId = data[this.ROW.userIdRow]?.[col + this.COL.userId];

          // Guards
          if (!dept && !name && !userId) continue;
          if (!userId || typeof userId !== 'number') continue;
          if (!name   || typeof name   !== 'string') continue;

          // Extract daily logs rows 13–43
          const logs: DailyLog[] = [];

          for (let row = this.ROW.logsStart; row <= this.ROW.logsEnd; row++) {
            const r = data[row];
            if (!r) continue;

            const date = r[col + this.COL.date];
            if (!date) continue; // skip empty day rows

            logs.push({
              date:  String(date),
              amIn:  r[col + this.COL.amIn]  ?? null,
              amOut: r[col + this.COL.amOut] ?? null,
              pmIn:  r[col + this.COL.pmIn]  ?? null,
              pmOut: r[col + this.COL.pmOut] ?? null,
              otIn:  r[col + this.COL.otIn]  ?? null,
              otOut: r[col + this.COL.otOut] ?? null,
            });
          }

          result.push({ userId, name: name.trim(), logs });
        }
        console.log(result)
      }
      

      if (result.length === 0) {
        this.error.set('No employees found. Check if this is a valid DTR file.');
      }

      this.employees.set(result); 

    } catch (err) {
      this.error.set('Failed to parse file. Please check the format.');
      console.error(err);
    } finally {
      this.isLoading.set(false);
    }
  } 
}
