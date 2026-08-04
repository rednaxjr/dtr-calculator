import { Injectable, signal } from '@angular/core';
import { HttpClient, HttpEvent, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Router } from '@angular/router';

import { environment } from '../../../environments/environment';
@Injectable({
  providedIn: 'root'
})
export class MonthDataService {
  private url = `${environment.api}/month_data`;
  headers = {
    headers: new HttpHeaders().set('Content-Type', "application/json")
  }
  constructor(
    private httpClient: HttpClient,

  ) { }

  get_month_data(data:any) {
    return this.httpClient.post(this.url + "/get_month_data", data, this.headers);
  }

  get_all_month_data(data:any) {
    return this.httpClient.post(this.url + "/get_all_month_data", data, this.headers);
  }
  add_month_data(data:any) {
    return this.httpClient.post(this.url + "/add_month_data", data, this.headers);
  }
  update_month_data(data:any) {
    return this.httpClient.post(this.url + "/update_month_data", data, this.headers);
  }
}
