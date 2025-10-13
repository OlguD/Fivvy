import { CommonModule, NgClass, NgIf } from '@angular/common';
import { Component } from '@angular/core';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { ThemeToggleComponent } from '../../shared/ui/theme-toggle/theme-toggle.component';
import { AuthService } from '../../core/auth.service';
import { filter } from 'rxjs/operators';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

interface NavLink {
  label: string;
  icon: string;
  path: string;
  adminOnly?: boolean;
}

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [
    CommonModule,
    NgClass,
    NgIf,
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    MatIconModule,
    MatButtonModule,
    ThemeToggleComponent,
  ],
  templateUrl: './app-shell.component.html',
  styleUrls: ['./app-shell.component.css'],
})
export class AppShellComponent {
  readonly navLinks: NavLink[] = [
    { label: 'Dashboard', icon: 'space_dashboard', path: '/dashboard' },
    { label: 'Clients', icon: 'group', path: '/clients' },
    { label: 'Projects', icon: 'view_kanban', path: '/projects' },
    { label: 'Admin', icon: 'shield_person', path: '/admin/users', adminOnly: true },
    { label: 'Invoices', icon: 'receipt_long', path: '/invoices' },
    { label: 'Profile', icon: 'person', path: '/profile' },
  ];

  sidebarOpen = false;
  headerTitle = 'Overview';
  headerSubtitle = 'Stay on top of your pipeline, revenue and workload.';

  private readonly pageMeta: Record<string, { title: string; subtitle: string }> = {
    '/dashboard': {
      title: 'Overview',
      subtitle: 'Stay on top of your pipeline, revenue and workload.'
    },
    '/clients': {
      title: 'Clients',
      subtitle: 'Client health, billing status and engagement signals.'
    },
    '/projects': {
      title: 'Projects',
      subtitle: 'Track delivery, timelines and project ownership.'
    },
    '/admin/users': {
      title: 'Admin console',
      subtitle: 'Manage workspaces, trials and platform access.'
    },
    '/invoices': {
      title: 'Invoices',
      subtitle: 'Revenue performance, unpaid balances and cash flow.'
    },
    '/profile': {
      title: 'Profile',
      subtitle: 'Manage your workspace preferences and security.'
    }
  };

  constructor(private readonly authService: AuthService, private readonly router: Router) {
    this.router.events
      .pipe(
        filter((event): event is NavigationEnd => event instanceof NavigationEnd),
        takeUntilDestroyed()
      )
      .subscribe(() => this.updatePageMeta());

    this.updatePageMeta();
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/auth/login']);
  }

  toggleSidebar(): void {
    this.sidebarOpen = !this.sidebarOpen;
  }

  closeSidebar(): void {
    this.sidebarOpen = false;
  }

  get isAdmin(): boolean {
    return this.authService.isAdmin();
  }

  private updatePageMeta(): void {
    const route = this.router.url.split('?')[0];
    const meta = this.pageMeta[route as keyof typeof this.pageMeta];

    if (meta) {
      this.headerTitle = meta.title;
      this.headerSubtitle = meta.subtitle;
    } else {
      this.headerTitle = 'Overview';
      this.headerSubtitle = 'Stay on top of your pipeline, revenue and workload.';
    }

    this.closeSidebar();
  }
}
