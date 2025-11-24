import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { OrganizationService } from '../services/organization.service';
import { Organization } from '../models/organization.models';

@Component({
  selector: 'app-branding-settings',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="branding-settings">
      <div class="container">
        <div class="header">
          <h1>White-label брендинг</h1>
          <p class="subtitle">Настройте внешний вид платформы под ваш бренд</p>
        </div>

        <div *ngIf="!organization()?.features.whiteLabel" class="upgrade-notice">
          <div class="icon">🎨</div>
          <div>
            <h3>White-label доступен в тарифах Business и Enterprise</h3>
            <p>Обновите тариф, чтобы настроить брендинг платформы</p>
            <button class="btn-primary">Обновить тариф</button>
          </div>
        </div>

        <div *ngIf="organization()?.features.whiteLabel" class="settings-grid">
          <!-- Colors Section -->
          <div class="settings-card">
            <h2>🎨 Цветовая схема</h2>
            <div class="form-group">
              <label>Основной цвет</label>
              <div class="color-picker">
                <input
                  type="color"
                  [(ngModel)]="branding.primaryColor"
                  (change)="previewChanges()"
                />
                <input
                  type="text"
                  [(ngModel)]="branding.primaryColor"
                  placeholder="#667eea"
                  maxlength="7"
                />
              </div>
            </div>

            <div class="form-group">
              <label>Вторичный цвет</label>
              <div class="color-picker">
                <input
                  type="color"
                  [(ngModel)]="branding.secondaryColor"
                  (change)="previewChanges()"
                />
                <input
                  type="text"
                  [(ngModel)]="branding.secondaryColor"
                  placeholder="#764ba2"
                  maxlength="7"
                />
              </div>
            </div>

            <div class="color-preview">
              <div class="preview-box" [style.background]="branding.primaryColor">
                Основной
              </div>
              <div class="preview-box" [style.background]="branding.secondaryColor">
                Вторичный
              </div>
            </div>
          </div>

          <!-- Logo Section -->
          <div class="settings-card">
            <h2>🖼️ Логотипы</h2>

            <div class="form-group">
              <label>Основной логотип (светлый фон)</label>
              <div class="logo-upload">
                <div *ngIf="branding.logo" class="logo-preview">
                  <img [src]="branding.logo" alt="Logo" />
                  <button class="btn-remove" (click)="removeLogo('logo')">×</button>
                </div>
                <div *ngIf="!branding.logo" class="upload-placeholder">
                  <input
                    type="file"
                    accept="image/*"
                    (change)="uploadLogo($event, 'logo')"
                    #logoInput
                  />
                  <button class="btn-upload" (click)="logoInput.click()">
                    📤 Загрузить логотип
                  </button>
                  <p>PNG или SVG, макс. 2MB</p>
                </div>
              </div>
            </div>

            <div class="form-group">
              <label>Логотип для темной темы (опционально)</label>
              <div class="logo-upload dark">
                <div *ngIf="branding.logoLight" class="logo-preview">
                  <img [src]="branding.logoLight" alt="Logo Light" />
                  <button class="btn-remove" (click)="removeLogo('logoLight')">×</button>
                </div>
                <div *ngIf="!branding.logoLight" class="upload-placeholder">
                  <input
                    type="file"
                    accept="image/*"
                    (change)="uploadLogo($event, 'logoLight')"
                    #logoLightInput
                  />
                  <button class="btn-upload" (click)="logoLightInput.click()">
                    📤 Загрузить логотип
                  </button>
                </div>
              </div>
            </div>

            <div class="form-group">
              <label>Favicon</label>
              <div class="favicon-upload">
                <div *ngIf="branding.favicon" class="favicon-preview">
                  <img [src]="branding.favicon" alt="Favicon" />
                  <button class="btn-remove" (click)="removeLogo('favicon')">×</button>
                </div>
                <div *ngIf="!branding.favicon" class="upload-placeholder small">
                  <input
                    type="file"
                    accept="image/*"
                    (change)="uploadLogo($event, 'favicon')"
                    #faviconInput
                  />
                  <button class="btn-upload small" (click)="faviconInput.click()">
                    📤 Загрузить
                  </button>
                  <p>ICO или PNG, 32x32px</p>
                </div>
              </div>
            </div>
          </div>

          <!-- Custom CSS Section -->
          <div class="settings-card full-width">
            <h2>💅 Пользовательский CSS</h2>
            <div class="form-group">
              <label>Custom CSS (для продвинутой настройки)</label>
              <textarea
                [(ngModel)]="branding.customCss"
                rows="10"
                placeholder=".header { background: linear-gradient(...); }&#10;.button { border-radius: 20px; }"
                class="code-editor"
              ></textarea>
              <p class="help-text">
                ⚠️ Используйте с осторожностью. Неправильный CSS может сломать интерфейс.
              </p>
            </div>

            <div class="form-group">
              <label>Custom JavaScript (опционально)</label>
              <textarea
                [(ngModel)]="branding.customJs"
                rows="6"
                placeholder="console.log('Custom JS loaded');"
                class="code-editor"
              ></textarea>
              <p class="help-text">
                🔒 Скрипты выполняются в изолированном окружении для безопасности.
              </p>
            </div>
          </div>

          <!-- Custom HTML Section -->
          <div class="settings-card full-width">
            <h2>📝 Пользовательский HTML</h2>

            <div class="form-group">
              <label>HTML в header (например, метатеги, аналитика)</label>
              <textarea
                [(ngModel)]="branding.headerHtml"
                rows="6"
                placeholder="<meta name='description' content='...' />&#10;<script async src='https://analytics.example.com/script.js'></script>"
                class="code-editor"
              ></textarea>
            </div>

            <div class="form-group">
              <label>HTML в footer (например, виджеты, чаты)</label>
              <textarea
                [(ngModel)]="branding.footerHtml"
                rows="6"
                placeholder="<div id='chat-widget'></div>&#10;<script>initChat();</script>"
                class="code-editor"
              ></textarea>
            </div>
          </div>

          <!-- Preview Section -->
          <div class="settings-card full-width">
            <h2>👁️ Предпросмотр</h2>
            <div class="preview-container" [style.--primary-color]="branding.primaryColor" [style.--secondary-color]="branding.secondaryColor">
              <div class="preview-header">
                <div class="preview-logo">
                  <img *ngIf="branding.logo" [src]="branding.logo" alt="Logo Preview" />
                  <span *ngIf="!branding.logo">Your Logo</span>
                </div>
                <div class="preview-nav">
                  <span>Курсы</span>
                  <span>О нас</span>
                  <span>Контакты</span>
                </div>
                <button class="preview-button">Войти</button>
              </div>
              <div class="preview-content">
                <h3>Добро пожаловать на платформу!</h3>
                <p>Это превью того, как будет выглядеть ваша платформа с выбранным брендингом.</p>
                <button class="preview-cta">Начать обучение</button>
              </div>
            </div>
          </div>

          <!-- Actions -->
          <div class="settings-card full-width actions-card">
            <div class="actions">
              <button class="btn-secondary" (click)="resetToDefault()">
                Сбросить к умолчанию
              </button>
              <button class="btn-secondary" (click)="previewInNewTab()">
                Открыть полный превью
              </button>
              <button
                class="btn-primary"
                (click)="saveBranding()"
                [disabled]="saving()"
              >
                {{ saving() ? 'Сохранение...' : 'Сохранить изменения' }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .branding-settings { padding: 40px 20px; background: #f5f7fa; min-height: 100vh; }
    .container { max-width: 1400px; margin: 0 auto; }
    .header { margin-bottom: 40px; }
    h1 { font-size: 2rem; color: #333; margin: 0 0 8px 0; }
    .subtitle { color: #666; margin: 0; }

    .upgrade-notice { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 40px; border-radius: 16px; display: flex; align-items: center; gap: 30px; margin-bottom: 40px; }
    .upgrade-notice .icon { font-size: 4rem; }
    .upgrade-notice h3 { margin: 0 0 8px 0; font-size: 1.5rem; }
    .upgrade-notice p { margin: 0 0 20px 0; opacity: 0.9; }

    .settings-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 24px; }
    .settings-card { background: white; padding: 30px; border-radius: 16px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
    .settings-card.full-width { grid-column: 1 / -1; }
    .settings-card h2 { margin: 0 0 24px 0; color: #333; font-size: 1.25rem; }

    .form-group { margin-bottom: 24px; }
    .form-group:last-child { margin-bottom: 0; }
    .form-group label { display: block; margin-bottom: 8px; color: #555; font-weight: 500; }
    .form-group input[type="text"] { width: 100%; padding: 12px; border: 1px solid #ddd; border-radius: 8px; font-size: 1rem; }

    .color-picker { display: flex; gap: 12px; align-items: center; }
    .color-picker input[type="color"] { width: 60px; height: 48px; border: 2px solid #ddd; border-radius: 8px; cursor: pointer; }
    .color-picker input[type="text"] { flex: 1; }

    .color-preview { display: flex; gap: 16px; margin-top: 20px; }
    .preview-box { flex: 1; padding: 24px; color: white; text-align: center; border-radius: 12px; font-weight: 600; }

    .logo-upload { border: 2px dashed #ddd; border-radius: 12px; padding: 30px; text-align: center; }
    .logo-upload.dark { background: #2c3e50; }
    .logo-preview { position: relative; display: inline-block; }
    .logo-preview img { max-width: 200px; max-height: 80px; display: block; }
    .btn-remove { position: absolute; top: -10px; right: -10px; width: 30px; height: 30px; border-radius: 50%; background: #f44336; color: white; border: none; cursor: pointer; font-size: 1.25rem; line-height: 1; }

    .upload-placeholder { text-align: center; }
    .upload-placeholder input { display: none; }
    .upload-placeholder p { color: #999; font-size: 0.875rem; margin: 8px 0 0 0; }
    .btn-upload { padding: 12px 24px; background: #667eea; color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: 600; }
    .btn-upload.small { padding: 8px 16px; font-size: 0.875rem; }

    .favicon-upload .favicon-preview img { width: 32px; height: 32px; }

    .code-editor { width: 100%; padding: 16px; border: 1px solid #ddd; border-radius: 8px; font-family: 'Monaco', 'Courier New', monospace; font-size: 0.875rem; line-height: 1.5; resize: vertical; }
    .help-text { color: #999; font-size: 0.875rem; margin: 8px 0 0 0; }

    .preview-container { border: 2px solid #ddd; border-radius: 12px; overflow: hidden; }
    .preview-header { display: flex; align-items: center; gap: 30px; padding: 20px 30px; background: var(--primary-color, #667eea); color: white; }
    .preview-logo { font-weight: 700; font-size: 1.25rem; }
    .preview-logo img { max-height: 40px; display: block; }
    .preview-nav { display: flex; gap: 24px; flex: 1; }
    .preview-nav span { cursor: pointer; }
    .preview-button { padding: 10px 24px; background: white; color: var(--primary-color, #667eea); border: none; border-radius: 8px; font-weight: 600; cursor: pointer; }
    .preview-content { padding: 60px 30px; text-align: center; background: linear-gradient(135deg, var(--primary-color, #667eea) 0%, var(--secondary-color, #764ba2) 100%); color: white; }
    .preview-content h3 { font-size: 2rem; margin: 0 0 16px 0; }
    .preview-content p { font-size: 1.125rem; opacity: 0.9; margin: 0 0 30px 0; }
    .preview-cta { padding: 16px 40px; background: white; color: var(--primary-color, #667eea); border: none; border-radius: 12px; font-weight: 700; font-size: 1.125rem; cursor: pointer; }

    .actions-card { background: #f8f9fa; }
    .actions { display: flex; gap: 16px; justify-content: flex-end; }

    button { padding: 12px 24px; border: none; border-radius: 8px; font-weight: 600; cursor: pointer; transition: all 0.3s; }
    .btn-primary { background: #667eea; color: white; }
    .btn-primary:hover { background: #5568d3; }
    .btn-primary:disabled { background: #ccc; cursor: not-allowed; }
    .btn-secondary { background: transparent; border: 2px solid #667eea; color: #667eea; }

    @media (max-width: 768px) {
      .settings-grid { grid-template-columns: 1fr; }
      .preview-header { flex-direction: column; align-items: flex-start; }
    }
  `]
})
export class BrandingSettingsComponent implements OnInit {
  private orgService = inject(OrganizationService);

  organization = signal<Organization | null>(null);
  saving = signal(false);

  branding = {
    primaryColor: '#667eea',
    secondaryColor: '#764ba2',
    logo: '',
    logoLight: '',
    favicon: '',
    customCss: '',
    customJs: '',
    headerHtml: '',
    footerHtml: '',
  };

  ngOnInit() {
    this.loadOrganization();
  }

  loadOrganization() {
    const orgId = 1;
    this.orgService.getOrganization(orgId).subscribe({
      next: (org) => {
        this.organization.set(org);
        if (org.branding) {
          this.branding = { ...this.branding, ...org.branding };
        }
      }
    });
  }

  previewChanges() {
    // Real-time preview updates
    console.log('Preview updated');
  }

  uploadLogo(event: any, type: 'logo' | 'logoLight' | 'favicon') {
    const file = event.target.files[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      alert('Файл слишком большой. Максимум 2MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e: any) => {
      this.branding[type] = e.target.result;
      this.previewChanges();
    };
    reader.readAsDataURL(file);
  }

  removeLogo(type: 'logo' | 'logoLight' | 'favicon') {
    this.branding[type] = '';
    this.previewChanges();
  }

  resetToDefault() {
    if (confirm('Сбросить все настройки к умолчанию?')) {
      this.branding = {
        primaryColor: '#667eea',
        secondaryColor: '#764ba2',
        logo: '',
        logoLight: '',
        favicon: '',
        customCss: '',
        customJs: '',
        headerHtml: '',
        footerHtml: '',
      };
      this.previewChanges();
    }
  }

  previewInNewTab() {
    // TODO: Open preview in new tab
    console.log('Opening preview...');
  }

  saveBranding() {
    this.saving.set(true);
    const orgId = 1;

    this.orgService.updateOrganization(orgId, {
      branding: this.branding
    }).subscribe({
      next: () => {
        this.saving.set(false);
        alert('Брендинг сохранен!');
      },
      error: () => {
        this.saving.set(false);
        alert('Ошибка при сохранении');
      }
    });
  }
}
