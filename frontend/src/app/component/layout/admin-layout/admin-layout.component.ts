import { Component, HostListener, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, RouterLink, RouterLinkActive, Router, NavigationEnd } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatMenuModule } from '@angular/material/menu';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { filter, Subscription } from 'rxjs';
import { AuthService } from '../../../services/auth.service';

interface NavItem {
  label: string;
  icon: string;
  route: string;
  exact?: boolean;
}

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [
    CommonModule, RouterModule, RouterLink, RouterLinkActive,
    MatIconModule, MatTooltipModule, MatMenuModule, MatButtonModule, MatDividerModule,
  ],
  templateUrl: './admin-layout.component.html',
  styleUrl: './admin-layout.component.scss',
})
export class AdminLayoutComponent implements OnInit, OnDestroy {
  sidebarOpen = true;
  isMobile = false;
  pageTitle = 'Dashboard';

  private routeSub?: Subscription;
  private readonly LS_KEY = 'dtr_sidebar_open';

  navItems: NavItem[] = [
    { label: 'Dashboard', icon: 'dashboard', route: '/admin/dashboard', exact: true },
    { label: 'Employees',  icon: 'people',    route: '/admin/employees' },
    { label: 'DTR Files',  icon: 'description', route: '/admin/dtr' },
  ];

  constructor(public auth: AuthService, private router: Router) {
    this.checkBreakpoint();
    if (!this.isMobile) {
      const saved = localStorage.getItem(this.LS_KEY);
      this.sidebarOpen = saved !== null ? saved === 'true' : true;
    }
  }

  ngOnInit() {
    this.setPageTitle(this.router.url);
    this.routeSub = this.router.events
      .pipe(filter(e => e instanceof NavigationEnd))
      .subscribe((e: any) => {
        this.setPageTitle(e.urlAfterRedirects);
        if (this.isMobile) this.sidebarOpen = false;
      });
  }

  ngOnDestroy() { this.routeSub?.unsubscribe(); }

  @HostListener('window:resize')
  checkBreakpoint() {
    const wasMobile = this.isMobile;
    this.isMobile = window.innerWidth < 768;
    if (this.isMobile && !wasMobile) this.sidebarOpen = false;
    if (!this.isMobile && wasMobile) {
      const saved = localStorage.getItem(this.LS_KEY);
      this.sidebarOpen = saved !== null ? saved === 'true' : true;
    }
  }

  toggleSidebar() {
    this.sidebarOpen = !this.sidebarOpen;
    if (!this.isMobile) localStorage.setItem(this.LS_KEY, String(this.sidebarOpen));
  }

  closeSidebar() { if (this.isMobile) this.sidebarOpen = false; }

  logout() { this.auth.logout(); }

  get currentUser() { return this.auth.getUser(); }

  get userInitials(): string {
    return (this.currentUser?.name ?? '')
      .split(' ')
      .map(n => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  }

  get userRoleLabel(): string {
    return (this.currentUser?.role ?? '').replace('_', ' ');
  }

  get sidebarClasses(): Record<string, boolean> {
    if (this.isMobile) {
      return {
        'sidebar-mobile': true,
        'sidebar-mobile--open': this.sidebarOpen,
        'sidebar-mobile--closed': !this.sidebarOpen,
      };
    }
    return {
      'sidebar-desktop--open': this.sidebarOpen,
      'sidebar-desktop--collapsed': !this.sidebarOpen,
    };
  }

  private setPageTitle(url: string) {
    if (url.includes('upload')) { this.pageTitle = 'Upload DTR'; return; }
    const match = this.navItems.find(n => url.includes(n.route.split('/').pop()!));
    this.pageTitle = match?.label ?? 'Admin';
  }
}
