import { DOCUMENT } from '@angular/common';
import { Injectable, Inject } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export type ThemeMode = 'light' | 'dark';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly storageKey = 'fivvy-theme';
  private readonly themeSubject: BehaviorSubject<ThemeMode>;

  readonly theme$;

  constructor(@Inject(DOCUMENT) private document: Document) {
    const initialTheme = this.restoreTheme();
    this.themeSubject = new BehaviorSubject<ThemeMode>(initialTheme);
    this.theme$ = this.themeSubject.asObservable();
    this.applyTheme(initialTheme);

    this.theme$.subscribe((mode) => {
      this.persistTheme(mode);
      this.applyTheme(mode);
    });
  }

  get currentTheme(): ThemeMode {
    return this.themeSubject.value;
  }

  toggleTheme(): void {
    this.setTheme(this.currentTheme === 'light' ? 'dark' : 'light');
  }

  setTheme(mode: ThemeMode): void {
    this.themeSubject.next(mode);
  }

  private restoreTheme(): ThemeMode {
    if (typeof window === 'undefined') {
      return 'light';
    }

    const stored = window.localStorage.getItem(this.storageKey) as ThemeMode | null;
    if (stored === 'light' || stored === 'dark') {
      return stored;
    }

    if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }

    return 'light';
  }

  private persistTheme(mode: ThemeMode): void {
    if (typeof window === 'undefined') {
      return;
    }

    window.localStorage.setItem(this.storageKey, mode);
  }

  private applyTheme(mode: ThemeMode): void {
    if (!this.document?.documentElement) {
      return;
    }
    this.document.documentElement.setAttribute('data-theme', mode);
  }
}
