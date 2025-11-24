import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap } from 'rxjs/operators';

export type Language = 'en' | 'ru' | 'uz' | 'ar' | 'kk' | 'tr';

export interface LanguageOption {
  code: Language;
  name: string;
  nativeName: string;
  flag: string;
  rtl: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class I18nService {
  private translationsCache = new Map<Language, any>();
  private currentLanguageSubject = new BehaviorSubject<Language>('en');

  public currentLanguage$ = this.currentLanguageSubject.asObservable();
  public currentLanguage = signal<Language>('en');

  public readonly languages: LanguageOption[] = [
    { code: 'en', name: 'English', nativeName: 'English', flag: '🇬🇧', rtl: false },
    { code: 'ru', name: 'Russian', nativeName: 'Русский', flag: '🇷🇺', rtl: false },
    { code: 'uz', name: 'Uzbek', nativeName: 'O\'zbekcha', flag: '🇺🇿', rtl: false },
    { code: 'ar', name: 'Arabic', nativeName: 'العربية', flag: '🇸🇦', rtl: true },
    { code: 'kk', name: 'Kazakh', nativeName: 'Қазақша', flag: '🇰🇿', rtl: false },
    { code: 'tr', name: 'Turkish', nativeName: 'Türkçe', flag: '🇹🇷', rtl: false }
  ];

  constructor(private http: HttpClient) {
    const savedLang = this.getSavedLanguage();
    this.setLanguage(savedLang);
  }

  loadTranslations(lang: Language): Observable<any> {
    if (this.translationsCache.has(lang)) {
      return new Observable(observer => {
        observer.next(this.translationsCache.get(lang));
        observer.complete();
      });
    }

    return this.http.get(`/assets/i18n/${lang}.json`).pipe(
      tap(translations => {
        this.translationsCache.set(lang, translations);
      })
    );
  }

  setLanguage(lang: Language): void {
    this.loadTranslations(lang).subscribe(translations => {
      this.currentLanguageSubject.next(lang);
      this.currentLanguage.set(lang);
      localStorage.setItem('preferred_language', lang);

      // Update document direction for RTL languages
      const langOption = this.languages.find(l => l.code === lang);
      if (langOption?.rtl) {
        document.dir = 'rtl';
        document.documentElement.lang = lang;
      } else {
        document.dir = 'ltr';
        document.documentElement.lang = lang;
      }
    });
  }

  getCurrentLanguage(): Language {
    return this.currentLanguage();
  }

  private getSavedLanguage(): Language {
    const saved = localStorage.getItem('preferred_language') as Language;
    return saved && this.languages.some(l => l.code === saved) ? saved : 'en';
  }

  translate(key: string, translations: any): string {
    const keys = key.split('.');
    let value = translations;

    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k];
      } else {
        return key; // Return key if translation not found
      }
    }

    return typeof value === 'string' ? value : key;
  }
}
