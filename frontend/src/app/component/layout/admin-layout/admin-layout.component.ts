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
  page_description: any = "";
  page_title2:any = "";

  modules: any = [
    { label: 'Dashboard', icon: 'dashboard', route: '/admin/dashboard', name: "Dashboard", exact: true },
    { label: 'Employees', icon: 'people', route: '/admin/employees', name: "Employees" },
    { label: 'DTR Files', icon: 'description', route: '/admin/dtr', name: "DTR Files" },
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
    const deepest = this.getDeepestRoute(this.route);
    this.page_title = deepest.snapshot.data['parent']; 
    this.page_title2 = deepest.snapshot.data['title'];
    this.page_description = deepest.snapshot.data['description'];
    this.routeSub = this.router.events
      .pipe(filter(e => e instanceof NavigationEnd))
      .subscribe((e: any) => {
        this.curr_route = e.urlAfterRedirects;
        const deepest = this.getDeepestRoute(this.route);
        const title = deepest.snapshot.data['parent'];
        const title2 = deepest.snapshot.data['title'];
        const description = deepest.snapshot.data['description'];
        this.page_title = title;
        this.page_title2 = title2;
        this.page_description = description; 
        if (this.isMobile) this.drawer?.close();
      });

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
