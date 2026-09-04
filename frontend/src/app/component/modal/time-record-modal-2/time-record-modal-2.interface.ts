export type FieldKey = 'amIn' | 'amOut' | 'pmIn' | 'pmOut' | 'otIn' | 'otOut';
export type Session = 'AM' | 'PM';
export type FieldStatus = 'late' | 'ontime' | 'blank-required' | 'blank-optional' | 'neutral';

export interface FieldDef {
  key: FieldKey;
  label: string;
  session: Session;
  required: boolean;
  lateAfter: number | null;
  fillValue?: string;
}

export interface StatusMeta {
  icon: string;
  /** locked statuses carry no times, so the row's inputs are disabled */
  locked: boolean;
  halfDay?: boolean;
  tooltip: string;
  /** dot colour shown next to the status label */
  dot: string;
}

/**
 * One day of the month — taken from month_data.days — paired with the parsed
 * log for that date when the uploaded file has one.
 */
export interface DayRow {
  day: number;
  weekday: string;
  weekday_short: string;
  is_weekend: boolean;
  /** 'Work Day' | 'Weekend' | 'Holiday', as saved on the month */
  calendar_status: string;
  log: any | null;
  /** index into employee.logs, or -1 when the file has no row for this day */
  log_index: number;
}
