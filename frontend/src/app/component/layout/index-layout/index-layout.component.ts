import { Component, ViewChild, HostListener, ViewContainerRef, AfterViewInit } from '@angular/core';
import { BehaviorSubject, filter, Observable } from 'rxjs';
import { Routes, RouterModule, Router, RouterOutlet, RouterLink, RouterLinkActive, ActivatedRoute, NavigationEnd, } from '@angular/router';

import { MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { FormControl, FormGroup, FormsModule } from '@angular/forms';
import { ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatMenuModule } from '@angular/material/menu';
import { MatButtonModule } from '@angular/material/button';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
@Component({
  selector: 'app-index-layout',
  standalone: true,
  imports: [CommonModule, RouterModule, RouterOutlet, MatToolbarModule, MatSidenavModule, MatIconModule, MatListModule, MatMenuModule, MatButtonModule],
  templateUrl: './index-layout.component.html',
  styleUrl: './index-layout.component.scss'
})
export class IndexLayoutComponent {
  ngAfterViewInit(): void {
  }
  isHandset: boolean = false;
  user: any = {}
  isOpen: boolean = true;
  isXSmall: boolean = false;
  isMedium: boolean = false;
  isXLarge: boolean = false;
  isLarge: boolean = false;
  isSmall: boolean = false;
  isSide: boolean = true;
  routeTitle: any;
  userRole: any;
  sideBarRoutes: any;
  constructor(
    private router: Router,
    private route: ActivatedRoute, 
    private breakpointObserver: BreakpointObserver
  ) {

    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe(() => {
        const deepest = this.getDeepestRoute(this.route);
        const title = deepest.snapshot.data['parent'];
        const role = deepest.snapshot.data['role'];
        this.routeTitle = title;
        this.userRole = role;
      });
   
  }



  getDeepestRoute(route: ActivatedRoute): ActivatedRoute {
    while (route.firstChild) {
      route = route.firstChild;
    }
    return route;
  }
  ngOnInit(): void {
    this.breakpointObserver.observe([
      Breakpoints.XSmall,
      Breakpoints.Small,
      Breakpoints.Medium,
      Breakpoints.Large,
      Breakpoints.XLarge
    ]).subscribe(result => {
      this.isXSmall = result.breakpoints[Breakpoints.XSmall];
      this.isSmall = result.breakpoints[Breakpoints.Small];
      this.isMedium = result.breakpoints[Breakpoints.Medium];
      this.isLarge = result.breakpoints[Breakpoints.Large];
      this.isXLarge = result.breakpoints[Breakpoints.XLarge];
      if (this.isMedium || this.isLarge || this.isLarge || this.isXLarge) {
        this.isSide = false;
        this.isOpen = true;
      } else {
        this.isOpen = false;
        this.isSide = true;
      }

    });
  }
  logout() {
    this.router.navigate(['/']);
  }
} 
