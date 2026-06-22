import { Component, OnInit } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

import { FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';

import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import {StorageService} from '../../services/storage/storage.service'
 import {AuthService} from '../../services/auth/auth.service';
@Component({
  selector: 'app-index',
  standalone: true,
  imports: [FormsModule, ReactiveFormsModule, CommonModule, RouterOutlet, RouterLink, RouterLinkActive, MatIconModule],
  templateUrl: './index.component.html',
  styleUrl: './index.component.scss'
})

export class IndexComponent implements OnInit {

  constructor(
    private router: Router,
    private storageService: StorageService,
    private auth_service: AuthService,
  ) {

  }
  ngOnInit(): void {

  }
  password: string = "";
  email: string = "";
  isLogin: boolean = true;
  async submit() {
    // const data = {
    //   username: this.email,
    //   password: this.password
    // }
    // this.auth_service.login(data).subscribe((res: any) => {
    //   console.log(res)
    //   this.storageService.setItem("token", res.token);
    //   this.router.navigate(['/user/dashboard']);
    // }, (error) => {
    //   console.log(error);
    // })
     this.router.navigate(['/admin/dashboard']);
     console.log("aaaa")

  }
}


