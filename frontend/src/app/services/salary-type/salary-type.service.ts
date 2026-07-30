import { Injectable } from '@angular/core';
import { SalaryType } from '../../component/models/salary-type.model';

@Injectable({
  providedIn: 'root'
})
export class SalaryTypeService {
  private salary_types: SalaryType[] = [
    { number: 1, value: 'Monthly' },
    { number: 2, value: 'Semi-monthly' },
    { number: 3, value: 'Bi-weekly' },
    { number: 4, value: 'Weekly' },
  ];

  get_salary_types(): SalaryType[] {
    return this.salary_types;
  }
}
