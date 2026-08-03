import { Injectable } from '@angular/core';
import { Month } from '../../component/models/month.model';
import { HttpClient, HttpEvent, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Router } from '@angular/router';

import { environment } from '../../../environments/environment';
@Injectable({
  providedIn: 'root'
})
export class MonthService {
  private months: Month[] = [
    { number: 1, month: 'January' },
    { number: 2, month: 'February' },
    { number: 3, month: 'March' },
    { number: 4, month: 'April' },
    { number: 5, month: 'May' },
    { number: 6, month: 'June' },
    { number: 7, month: 'July' },
    { number: 8, month: 'August' },
    { number: 9, month: 'September' },
    { number: 10, month: 'October' },
    { number: 11, month: 'November' },
    { number: 12, month: 'December' }
  ];
  private url = `${environment.api}/month`;
  headers = {
    headers: new HttpHeaders().set('Content-Type', "application/json")
  }
  constructor(
    private httpClient: HttpClient,

  ) { }

  get_months(): Month[] {
    return this.months;
  }
  get_month() {
    return this.httpClient.post(this.url + "/get_month", {}, this.headers);
  }
}
