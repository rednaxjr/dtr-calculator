import { Injectable } from '@angular/core';
import { read, utils, writeFile } from 'xlsx';

@Injectable({
  providedIn: 'root'
})
export class ParserService {

  employees: any[] = [];
  isLoading: boolean = false;
  error: string | null = null; 
  fileName = '';
 
  private workbook: any = null; 
  private provenance: { sheet: string; col: number; rows: number[] }[] = [];

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
    this.workbook = null;
    this.provenance = [];
    this.fileName = '';
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

  private isBlank(val: any): boolean {
    return val === null || val === undefined || String(val).trim() === '';
  }

  /**
   * Fold the OT In / OT Out columns into PM Out.
   * PM Out is only derived when it is blank; OT Out takes priority over OT In
   * (so when both OT values are present, OT Out wins). A PM Out that already
   * has a value is left untouched.
   */
  private resolvePmOut(log: any): void {
    if (!this.isBlank(log.pmOut)) return;
    if (!this.isBlank(log.otOut)) log.pmOut = log.otOut;
    else if (!this.isBlank(log.otIn)) log.pmOut = log.otIn;
  }

  async parseFile(file: File): Promise<void> {
    this.isLoading = true;
    this.error = null;
    this.fileName = file.name;

    try {
      const buffer = await file.arrayBuffer();
      const wb = read(buffer, { type: 'array', cellStyles: true, cellNF: true });
      const result: any[] = [];
      const provenance: { sheet: string; col: number; rows: number[] }[] = [];

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
          const rows: number[] = [];

          for (let row = this.ROW.logsStart; row <= this.ROW.logsEnd; row++) {
            const r = data[row];
            if (!r) continue;

            const date = r[col + this.COL.date];
            if (!date) continue;

            const logEntry = {
              date:  String(date),
              amIn:  r[col + this.COL.amIn]  ?? null,
              amOut: r[col + this.COL.amOut] ?? null,
              pmIn:  r[col + this.COL.pmIn]  ?? null,
              pmOut: r[col + this.COL.pmOut] ?? null,
              otIn:  r[col + this.COL.otIn]  ?? null,
              otOut: r[col + this.COL.otOut] ?? null,
            };
            this.resolvePmOut(logEntry);
            logs.push(logEntry);
            rows.push(row);
          }

          result.push({ userId, name: name.trim(), logs });
          provenance.push({ sheet: sheetName, col, rows });
        }
      }

      if (result.length === 0) {
        this.error = 'No employees found. Check if this is a valid DTR file.';
      }

      this.employees = result;
      this.provenance = provenance;
      this.workbook = wb;

    } catch (err) {
      this.error = 'Failed to parse file. Please check the format.';
      console.error(err);
    } finally {
      this.isLoading = false;
    }
  }

  /** True once a file has been parsed and there is something to export. */
  get canSave(): boolean {
    return !!this.workbook && this.employees.length > 0;
  }

  /**
   * Write the current (edited / auto-filled) values back into the original
   * workbook cells and download the result. Because we mutate the workbook that
   * was parsed on upload — instead of building a new one — the sheet layout,
   * merged cells and column widths are preserved, so the export reads like the
   * original document with updated values rather than a re-created file.
   */
  saveToExcel(): void {
    if (!this.canSave) return;

    for (let i = 0; i < this.employees.length; i++) {
      const emp = this.employees[i];
      const prov = this.provenance[i];
      if (!prov) continue;

      const sheet = this.workbook.Sheets[prov.sheet];
      if (!sheet) continue;

      emp.logs.forEach((log: any, j: number) => {
        const row = prov.rows[j];
        if (row === undefined) return;
        this.writeCell(sheet, row, prov.col + this.COL.amIn,  log.amIn);
        this.writeCell(sheet, row, prov.col + this.COL.amOut, log.amOut);
        this.writeCell(sheet, row, prov.col + this.COL.pmIn,  log.pmIn);
        this.writeCell(sheet, row, prov.col + this.COL.pmOut, log.pmOut);
        this.writeCell(sheet, row, prov.col + this.COL.otIn,  log.otIn);
        this.writeCell(sheet, row, prov.col + this.COL.otOut, log.otOut);
      });
    }

    writeFile(this.buildExportWorkbook(), this.fileName || 'DTR.xlsx');
  } 
  private buildExportWorkbook(): any {
    const wb = this.workbook;
    const keep = wb.SheetNames.filter((n: string) => !this.SKIP_SHEETS.includes(n));

    const Sheets: any = {};
    for (const name of keep) Sheets[name] = wb.Sheets[name];

    const exportWb: any = { ...wb, SheetNames: keep, Sheets };
 
    if (wb.Workbook && Array.isArray(wb.Workbook.Sheets)) {
      exportWb.Workbook = {
        ...wb.Workbook,
        Sheets: wb.SheetNames
          .map((n: string, i: number) => ({ n, meta: wb.Workbook.Sheets[i] }))
          .filter((x: any) => !this.SKIP_SHEETS.includes(x.n))
          .map((x: any) => x.meta),
      };
    }

    return exportWb;
  } 
  private writeCell(sheet: any, r: number, c: number, value: any): void {
    const addr = utils.encode_cell({ r, c });
    const cell = sheet[addr];

    const blank = value === null || value === undefined || String(value).trim() === '';
    const next = blank ? '' : value;
    const current = cell ? (cell.v ?? '') : '';
    if (String(current).trim() === String(next).trim()) return; // unchanged

    if (cell) {
      cell.v = next;
      cell.t = (!blank && typeof value === 'number') ? 'n' : 's';
      delete cell.w; // drop cached display text so the new value renders
    } else if (!blank) {
      sheet[addr] = { t: typeof value === 'number' ? 'n' : 's', v: value };
      this.ensureInRange(sheet, r, c);
    }
  }

  /** Grow the worksheet's used range to include a newly created cell. */
  private ensureInRange(sheet: any, r: number, c: number): void {
    if (!sheet['!ref']) {
      sheet['!ref'] = utils.encode_range({ s: { r, c }, e: { r, c } });
      return;
    }
    const range = utils.decode_range(sheet['!ref']);
    range.s.r = Math.min(range.s.r, r);
    range.s.c = Math.min(range.s.c, c);
    range.e.r = Math.max(range.e.r, r);
    range.e.c = Math.max(range.e.c, c);
    sheet['!ref'] = utils.encode_range(range);
  }
}
