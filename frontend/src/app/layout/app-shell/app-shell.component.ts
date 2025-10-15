import { ElementRef, HostListener, ViewChild, OnInit, OnDestroy } from '@angular/core';
import { CommonModule, NgClass, NgIf } from '@angular/common';
import { Component } from '@angular/core';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { ThemeToggleComponent } from '../../shared/ui/theme-toggle/theme-toggle.component';
import { AuthService } from '../../core/auth.service';
import { ProfileService, UserProfile } from '../../core/profile.service';
import { filter, takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TranslateModule } from '@ngx-translate/core';
import { LanguageService } from '../../core/language.service';
import { environment } from '../../../environments/environment';

interface NavLink {
  labelKey: string;
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
  TranslateModule,
  ],
  templateUrl: './app-shell.component.html',
  styleUrls: ['./app-shell.component.css'],
})
export class AppShellComponent implements OnInit, OnDestroy {
  profileImageFromApi: string | null = null;
  userProfile: UserProfile | null = null;
  private destroy$ = new Subject<void>();

  @ViewChild('langDropdown', { static: false }) langDropdownRef?: ElementRef;
  showLangDropdown = false;
  // Close dropdown when clicking outside
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    if (!this.showLangDropdown) return;
    const dropdown = this.langDropdownRef?.nativeElement;
    if (dropdown && !dropdown.contains(event.target)) {
      this.showLangDropdown = false;
    }
  }
  readonly navLinks: NavLink[] = [
    { labelKey: 'navigation.dashboard', icon: 'space_dashboard', path: '/dashboard' },
    { labelKey: 'navigation.clients', icon: 'group', path: '/clients' },
    { labelKey: 'navigation.projects', icon: 'view_kanban', path: '/projects' },
  { labelKey: 'navigation.admin', icon: 'admin_panel_settings', path: '/admin/users', adminOnly: true },
    { labelKey: 'navigation.invoices', icon: 'receipt_long', path: '/invoices' },
    { labelKey: 'navigation.profile', icon: 'person', path: '/profile' },
  ];

  sidebarOpen = false;
  headerTitleKey = 'pageMeta.dashboard.title';
  headerSubtitleKey = 'pageMeta.dashboard.subtitle';
  currentLanguage: 'tr' | 'en' = 'tr';
  supportedLanguages: Array<'tr' | 'en'> = ['tr', 'en'];

  private readonly pageMeta: Record<string, { titleKey: string; subtitleKey: string }> = {
    '/dashboard': {
      titleKey: 'pageMeta.dashboard.title',
      subtitleKey: 'pageMeta.dashboard.subtitle'
    },
    '/clients': {
      titleKey: 'pageMeta.clients.title',
      subtitleKey: 'pageMeta.clients.subtitle'
    },
    '/projects': {
      titleKey: 'pageMeta.projects.title',
      subtitleKey: 'pageMeta.projects.subtitle'
    },
    '/admin/users': {
      titleKey: 'pageMeta.admin.title',
      subtitleKey: 'pageMeta.admin.subtitle'
    },
    '/invoices': {
      titleKey: 'pageMeta.invoices.title',
      subtitleKey: 'pageMeta.invoices.subtitle'
    },
    '/profile': {
      titleKey: 'pageMeta.profile.title',
      subtitleKey: 'pageMeta.profile.subtitle'
    }
  };

  constructor(
    private readonly authService: AuthService,
    private readonly router: Router,
    private readonly languageService: LanguageService,
    private readonly profileService: ProfileService
  ) {
    this.currentLanguage = this.languageService.currentLanguage;
    this.router.events
      .pipe(
        filter((event): event is NavigationEnd => event instanceof NavigationEnd),
        takeUntil(this.destroy$)
      )
      .subscribe(() => this.updatePageMeta());

    this.languageService.languageChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(lang => (this.currentLanguage = lang));

    this.updatePageMeta();
  }

  ngOnInit(): void {
    this.loadProfile();
    // Profil fotoğrafı güncellendiğinde tekrar yükle
    window.addEventListener('profileImageUpdated', () => {
      this.loadProfile();
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadProfile(): void {
    this.profileService.getProfile().pipe(takeUntil(this.destroy$)).subscribe({
      next: user => {
        this.userProfile = user;
        if (user.profileImagePath) {
          const backendBaseUrl = environment.backendBaseUrl;
          this.profileImageFromApi = user.profileImagePath.startsWith('http')
            ? user.profileImagePath
            : `${backendBaseUrl}${user.profileImagePath}`;
        } else {
          this.profileImageFromApi = null;
        }
      },
      error: error => {
        console.error('Profile retrieval failed', error);
      }
    });
  }

  initials(): string {
    if (!this.userProfile) return '--';
    const { name, surname, username } = this.userProfile;
    const parts = [name, surname]
      .filter(Boolean)
      .map(value => value!.trim())
      .filter(value => value.length > 0)
      .map(value => value[0]?.toUpperCase() ?? '');
    if (parts.length === 0) {
      return username?.slice(0, 2).toUpperCase() ?? '--';
    }
    return parts.join('');
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


  setLanguage(lang: 'tr' | 'en') {
    this.languageService.setLanguage(lang);
  }

  private updatePageMeta(): void {
    const route = this.router.url.split('?')[0];
    const meta = this.pageMeta[route as keyof typeof this.pageMeta];

    if (meta) {
      this.headerTitleKey = meta.titleKey;
      this.headerSubtitleKey = meta.subtitleKey;
    } else {
      this.headerTitleKey = 'pageMeta.dashboard.title';
      this.headerSubtitleKey = 'pageMeta.dashboard.subtitle';
    }

    this.closeSidebar();
  }
}
