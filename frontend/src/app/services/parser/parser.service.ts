import { Injectable } from '@angular/core';
import { read, utils } from 'xlsx';

@Injectable({
  providedIn: 'root'
})
export class ParserService {

  employees: any[] = [];
  isLoading: boolean = false;
  error: string | null = null;

  private readonly SKIP_SHEETS = [
    'Shift Setting Table',
    'Attendance Statistic Table'
  ];
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
  private readonly ROW = {
    nameRow:   3,
    userIdRow: 4,
    logsStart: 12,
    logsEnd:   42,
  };

  clear() {
    this.employees = [];
    this.error = null;
  }

  /**
   * Propagate holiday changes across every employee.
   * A holiday is a day-level property, so marking a date as Holiday for one
   * employee applies it to all of them (and clearing it reverts the others to
   * Present without touching their recorded times).
   */
  applyHoliday(added: string[] = [], removed: string[] = []): void {
    const addKeys = new Set(added.map(d => this.dayKey(d)));
    const remKeys = new Set(removed.map(d => this.dayKey(d)));
    if (addKeys.size === 0 && remKeys.size === 0) return;

    for (const emp of this.employees) {
      for (const log of emp.logs ?? []) {
        const key = this.dayKey(log.date);
        if (addKeys.has(key)) {
          log.status = 'Holiday';
        } else if (remKeys.has(key) && log.status === 'Holiday') {
          log.status = 'Present';
        }
      }
    }
  }
 
  private dayKey(date: any): string {
    const match = String(date ?? '').match(/\d+/);
    return match ? match[0] : String(date ?? '').trim();
  }

  async parseFile(file: File): Promise<void> {
    this.isLoading = true;
    this.error = null;

    try {
      const buffer = await file.arrayBuffer();
      const wb = read(buffer, { type: 'array' });
      const result: any[] = [];

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

          if (!dept && !name && !userId) continue;
          if (!userId || typeof userId !== 'number') continue;
          if (!name   || typeof name   !== 'string') continue;

          const logs: any[] = [];

          for (let row = this.ROW.logsStart; row <= this.ROW.logsEnd; row++) {
            const r = data[row];
            if (!r) continue;

            const date = r[col + this.COL.date];
            if (!date) continue;

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
        this.error = 'No employees found. Check if this is a valid DTR file.';
      }

      this.employees = result;

    } catch (err) {
      this.error = 'Failed to parse file. Please check the format.';
      console.error(err);
    } finally {
      this.isLoading = false;
    }
  }
}
