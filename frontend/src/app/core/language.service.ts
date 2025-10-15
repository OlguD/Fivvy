import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { TranslateService } from '@ngx-translate/core';
import { BehaviorSubject } from 'rxjs';

type SupportedLanguage = 'tr' | 'en';

const STORAGE_KEY = 'fivvy.language';

@Injectable({ providedIn: 'root' })
export class LanguageService {
  readonly supportedLanguages: SupportedLanguage[] = ['tr', 'en'];

  private readonly currentLanguage$ = new BehaviorSubject<SupportedLanguage>('en');

  constructor(
    private readonly translate: TranslateService,
    @Inject(PLATFORM_ID) private readonly platformId: object
  ) {
  this.translate.addLangs(this.supportedLanguages);
  this.translate.setDefaultLang('en');

  const initial = this.resolveInitialLanguage();
  this.applyLanguage(initial);
  }

  get languageChanges() {
    return this.currentLanguage$.asObservable();
  }

  get currentLanguage(): SupportedLanguage {
    return this.currentLanguage$.value;
  }

  get locale(): string {
    return this.currentLanguage === 'tr' ? 'tr-TR' : 'en-US';
  }

  setLanguage(language: SupportedLanguage): void {
    if (!this.supportedLanguages.includes(language)) {
      return;
    }

    if (language === this.currentLanguage) {
      return;
    }

    this.applyLanguage(language);
  }

  toggleLanguage(): void {
    const next = this.currentLanguage === 'tr' ? 'en' : 'tr';
    this.setLanguage(next);
  }

  private applyLanguage(language: SupportedLanguage): void {
    this.translate.use(language);
    this.currentLanguage$.next(language);
    this.persist(language);
  }

  private resolveInitialLanguage(): SupportedLanguage {
    const stored = this.readStoredLanguage();
    if (stored) {
      return stored;
    }

    const browser = this.translate.getBrowserLang();
    if (browser && this.supportedLanguages.includes(browser as SupportedLanguage)) {
      return browser as SupportedLanguage;
    }

  return 'en';
  }

  private persist(language: SupportedLanguage): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    try {
      localStorage.setItem(STORAGE_KEY, language);
    } catch (error) {
      console.warn('Unable to persist language preference', error);
    }
  }

  private readStoredLanguage(): SupportedLanguage | null {
    if (!isPlatformBrowser(this.platformId)) {
      return null;
    }

    try {
      const value = localStorage.getItem(STORAGE_KEY);
      if (value && this.supportedLanguages.includes(value as SupportedLanguage)) {
        return value as SupportedLanguage;
      }
    } catch (error) {
      console.warn('Unable to read stored language preference', error);
    }

    return null;
  }
}
