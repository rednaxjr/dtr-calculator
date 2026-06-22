import { Component, HostListener, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, RouterLink, RouterLinkActive, Router, NavigationEnd, ActivatedRoute } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatButtonModule } from '@angular/material/button';
import { MatSidenavModule, MatDrawer } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatListModule } from '@angular/material/list';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';
import { filter, Subscription } from 'rxjs';
import { AuthService } from '../../../services/auth/auth.service';


@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [
    CommonModule, RouterModule, RouterLink, RouterLinkActive,
    MatIconModule, MatMenuModule, MatButtonModule, MatDividerModule, MatTooltipModule,
    MatSidenavModule, MatToolbarModule, MatListModule,
  ],
  templateUrl: './admin-layout.component.html',
  styleUrl: './admin-layout.component.scss',
})
export class AdminLayoutComponent implements OnInit, OnDestroy {
  @ViewChild('drawer') drawer!: MatDrawer;


  isMobile = false;
  curr_route: any = "";
  page_title: any = "";
  private routeSub?: Subscription;

  modules: any = [
    { label: 'Dashboard', icon: 'dashboard', route: '/admin/dashboard', exact: true },
    { label: 'Employees', icon: 'people', route: '/admin/employees' },
    { label: 'DTR Files', icon: 'description', route: '/admin/dtr' },
  ];

  constructor(
    public auth: AuthService,
    private router: Router,
    private route: ActivatedRoute,
  ) {
    this.checkBreakpoint();
  }

  ngOnInit() {
    this.curr_route = this.router.url;
    this.routeSub = this.router.events
      .pipe(filter(e => e instanceof NavigationEnd))
      .subscribe((e: any) => {
        this.curr_route = e.urlAfterRedirects;
        const deepest = this.getDeepestRoute(this.route);
        const title = deepest.snapshot.data['title'];
        this.page_title = title;
        if (this.isMobile) this.drawer?.close();
      });
    console.log(this.curr_route)
    console.log(this.page_title)
  }
  getDeepestRoute(route: ActivatedRoute): ActivatedRoute {
    while (route.firstChild) {
      route = route.firstChild;
    }
    return route;
  }

  ngOnDestroy() { this.routeSub?.unsubscribe(); }

  @HostListener('window:resize')
  checkBreakpoint() {
    this.isMobile = window.innerWidth < 768;
  }

  onNavClick() {
    if (this.isMobile) this.drawer?.close();
  }

  logout() { this.auth.logout(); }



}
