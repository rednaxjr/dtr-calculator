import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ValidationService {
  blockNumbers(event: KeyboardEvent): void {
    if (/[0-9]/.test(event.key)) event.preventDefault();
  }

  blockLetters(event: KeyboardEvent): void {
    if (!/[0-9]/.test(event.key)) event.preventDefault();
  }

  validate_required_text_only(value: any) {
    if (!value.trim()) return '* Input field is required';
    if (/[0-9]/.test(value)) return '* Numbers are not allowed';
    return '';
  }
   validate_text_only(value: any) { 
    if (/[0-9]/.test(value)) return '* Numbers are not allowed';
    return '';
  }

  validate_required_number_only(value: string, label: string): string {
    if (!value.trim()) return '* Input field is required';
    if (!/^\d+$/.test(value)) return `* Input field must contain numbers`;
    return '';
  }

  validateFirstName(value: string): string {
    if (!value.trim()) return '* First name is required';
    if (/[0-9]/.test(value)) return '* Numbers are not allowed';
    return '';
  }

  validateLastName(value: string): string {
    if (!value.trim()) return '* Last name is required';
    if (/[0-9]/.test(value)) return '* Numbers are not allowed';
    return '';
  }

  validateMiddleName(value: string): string {
    if (/[0-9]/.test(value)) return '* Numbers are not allowed';
    return '';
  }


  validateMonth(value: number): string {
    if (!value || value === 0) return '* Select a month';
    return '';
  }

  validateDay(value: string): string {
    const day = parseInt(value);
    if (!value) return '* Day is required';
    if (isNaN(day) || day < 1 || day > 31) return '* Enter a valid day (1–31)';
    return '';
  }

  validateYear(value: string): string {
    const year = parseInt(value);
    const current = new Date().getFullYear();
    if (!value) return '* Year is required';
    if (isNaN(year) || year < 1900 || year > current) return `* Enter a valid year (1900–${current})`;
    return '';
  }



  // ── Generic ───────────────────────────────────────────────────────────────

  validateRequired(value: string, label: string): string {
    if (!value.trim()) return `* ${label} is required`;
    return '';
  }

  validateNoNumbers(value: string, label: string): string {
    if (/[0-9]/.test(value)) return `* ${label} must not contain numbers`;
    return '';
  }

  validateNumbersOnly(value: string, label: string): string {
    if (!/^\d+$/.test(value)) return `* ${label} must be a number`;
    return '';
  }


  validateNameFields(data: any) {
    return {
      fname: this.validateFirstName(data.fname),
      lname: this.validateLastName(data.lname),
      mname: data.mname ? this.validateMiddleName(data.mname) : '',
    };
  }

  validateDateFields(data: any) {
    return {
      birth_month: this.validateMonth(data.birth_month),
      birth_day: this.validateDay(data.birth_day),
      birth_year: this.validateYear(data.birth_year),
    };
  }


  isValid(errors: { [key: string]: string }): boolean {
    return Object.values(errors).every(e => e === '');
  }
}