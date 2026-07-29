import { Injectable, signal } from '@angular/core';
import { HttpClient, HttpEvent, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Router } from '@angular/router';

import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class EmployeeService {
  private url = `${environment.api}/employee`;
  headers = {
    headers: new HttpHeaders().set('Content-Type', "application/json")
  }
  constructor(
    private httpClient: HttpClient,

  ) { }

  add_employee(data: any) {
    return this.httpClient.post(this.url + "/add_employee", data, this.headers);
  }
  get_employees(data: any) {
    return this.httpClient.post(this.url + "/get_employees", data, this.headers);
  }
  // get_year_month(data: any) {
  //   return this.httpClient.post(this.url + "/get_year_month", data, this.headers);
  // }

}
