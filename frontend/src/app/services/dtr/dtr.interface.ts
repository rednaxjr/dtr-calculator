export interface DtrEntry {
  day: number;
  date?: string;
  am_in: string;
  am_out: string;
  pm_in: string;
  pm_out: string;
  hours_rendered?: number;
  late_minutes?: number;
  undertime_minutes?: number;
  is_absent?: boolean;
}

export interface EmployeeDtr {
  id?: string;
  employee_id?: string;
  employee_name: string;
  position?: string;
  department?: string;
  period_from: string;
  period_to: string;
  entries: DtrEntry[];
  saved_at?: string;
}

export interface DtrFile {
  id: string;
  filename: string;
  period_from: string;
  period_to: string;
  employee_count: number;
  uploaded_at: string;
  records: EmployeeDtr[];
}
