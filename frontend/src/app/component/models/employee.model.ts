export interface DailyLog {
  date: string;       // "02 Mo"
  amIn:  string | null;
  amOut: string | null;
  pmIn:  string | null;
  pmOut: string | null;
  otIn:  string | null;
  otOut: string | null;
}

export interface Employee {
  userId: number;
  name:   string;
  logs:   DailyLog[];
}