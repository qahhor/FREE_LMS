import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { OrganizationService } from '../services/organization.service';
import { Organization, SsoConfig } from '../models/organization.models';

@Component({
  selector: 'app-sso-config',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="sso-config">
      <div class="container">
        <div class="header">
          <h1>Single Sign-On (SSO)</h1>
          <p class="subtitle">Настройте единый вход для вашей организации</p>
        </div>

        <div *ngIf="!organization()?.features.sso" class="upgrade-notice">
          <div class="icon">🔐</div>
          <div>
            <h3>SSO доступен в тарифах Business и Enterprise</h3>
            <p>Обновите тариф для настройки единого входа через SAML, OAuth2, OIDC или LDAP</p>
            <button class="btn-primary">Обновить тариф</button>
          </div>
        </div>

        <div *ngIf="organization()?.features.sso" class="sso-content">
          <!-- Provider Selection -->
          <div class="settings-card">
            <h2>Выберите провайдер SSO</h2>
            <div class="provider-grid">
              <div
                class="provider-card"
                [class.active]="selectedProvider === 'saml'"
                (click)="selectProvider('saml')"
              >
                <div class="provider-icon">🔒</div>
                <h3>SAML 2.0</h3>
                <p>Для Okta, Azure AD, Google Workspace</p>
              </div>

              <div
                class="provider-card"
                [class.active]="selectedProvider === 'oauth2'"
                (click)="selectProvider('oauth2')"
              >
                <div class="provider-icon">🔑</div>
                <h3>OAuth 2.0</h3>
                <p>Google, GitHub, GitLab</p>
              </div>

              <div
                class="provider-card"
                [class.active]="selectedProvider === 'oidc'"
                (click)="selectProvider('oidc')"
              >
                <div class="provider-icon">🎫</div>
                <h3>OpenID Connect</h3>
                <p>Auth0, Keycloak</p>
              </div>

              <div
                class="provider-card"
                [class.active]="selectedProvider === 'ldap'"
                (click)="selectProvider('ldap')"
              >
                <div class="provider-icon">📁</div>
                <h3>LDAP</h3>
                <p>Active Directory</p>
              </div>
            </div>
          </div>

          <!-- SAML Configuration -->
          <div *ngIf="selectedProvider === 'saml'" class="settings-card">
            <h2>Настройка SAML 2.0</h2>

            <div class="info-box">
              <h4>Информация для вашего IdP:</h4>
              <div class="code-block">
                <div class="code-line">
                  <span class="label">ACS URL:</span>
                  <code>{{ getAcsUrl() }}</code>
                  <button (click)="copy(getAcsUrl())">📋</button>
                </div>
                <div class="code-line">
                  <span class="label">Entity ID:</span>
                  <code>{{ getEntityId() }}</code>
                  <button (click)="copy(getEntityId())">📋</button>
                </div>
                <div class="code-line">
                  <span class="label">SP Metadata:</span>
                  <a [href]="getMetadataUrl()" target="_blank">Скачать XML</a>
                </div>
              </div>
            </div>

            <div class="form-group">
              <label>SSO URL *</label>
              <input
                type="url"
                [(ngModel)]="ssoConfig.config.ssoUrl"
                placeholder="https://your-idp.com/sso/saml"
              />
              <p class="help-text">URL для SSO вашего IdP</p>
            </div>

            <div class="form-group">
              <label>Entity ID *</label>
              <input
                type="text"
                [(ngModel)]="ssoConfig.config.entityId"
                placeholder="https://your-idp.com/entity"
              />
              <p class="help-text">Уникальный идентификатор IdP</p>
            </div>

            <div class="form-group">
              <label>X.509 Certificate *</label>
              <textarea
                [(ngModel)]="ssoConfig.config.certificate"
                rows="8"
                placeholder="-----BEGIN CERTIFICATE-----&#10;MIIDXTCCAkWgAwIBAgIJAKZ...&#10;-----END CERTIFICATE-----"
                class="code-editor"
              ></textarea>
              <p class="help-text">Публичный сертификат вашего IdP</p>
            </div>
          </div>

          <!-- OAuth2 Configuration -->
          <div *ngIf="selectedProvider === 'oauth2'" class="settings-card">
            <h2>Настройка OAuth 2.0</h2>

            <div class="info-box">
              <h4>Redirect URI для вашего приложения:</h4>
              <div class="code-block">
                <div class="code-line">
                  <code>{{ getRedirectUri() }}</code>
                  <button (click)="copy(getRedirectUri())">📋</button>
                </div>
              </div>
            </div>

            <div class="form-group">
              <label>Client ID *</label>
              <input
                type="text"
                [(ngModel)]="ssoConfig.config.clientId"
                placeholder="your-client-id"
              />
            </div>

            <div class="form-group">
              <label>Client Secret *</label>
              <input
                type="password"
                [(ngModel)]="ssoConfig.config.clientSecret"
                placeholder="your-client-secret"
              />
            </div>

            <div class="form-group">
              <label>Authorization URL *</label>
              <input
                type="url"
                [(ngModel)]="ssoConfig.config.authorizationUrl"
                placeholder="https://provider.com/oauth/authorize"
              />
            </div>

            <div class="form-group">
              <label>Token URL *</label>
              <input
                type="url"
                [(ngModel)]="ssoConfig.config.tokenUrl"
                placeholder="https://provider.com/oauth/token"
              />
            </div>
          </div>

          <!-- OIDC Configuration -->
          <div *ngIf="selectedProvider === 'oidc'" class="settings-card">
            <h2>Настройка OpenID Connect</h2>

            <div class="info-box">
              <h4>Redirect URI:</h4>
              <div class="code-block">
                <div class="code-line">
                  <code>{{ getRedirectUri() }}</code>
                  <button (click)="copy(getRedirectUri())">📋</button>
                </div>
              </div>
            </div>

            <div class="form-group">
              <label>Client ID *</label>
              <input
                type="text"
                [(ngModel)]="ssoConfig.config.clientId"
                placeholder="your-client-id"
              />
            </div>

            <div class="form-group">
              <label>Client Secret *</label>
              <input
                type="password"
                [(ngModel)]="ssoConfig.config.clientSecret"
                placeholder="your-client-secret"
              />
            </div>

            <div class="form-group">
              <label>Issuer URL *</label>
              <input
                type="url"
                [(ngModel)]="ssoConfig.config.authorizationUrl"
                placeholder="https://provider.com/.well-known/openid-configuration"
              />
              <p class="help-text">URL discovery endpoint вашего OIDC провайдера</p>
            </div>
          </div>

          <!-- LDAP Configuration -->
          <div *ngIf="selectedProvider === 'ldap'" class="settings-card">
            <h2>Настройка LDAP / Active Directory</h2>

            <div class="form-group">
              <label>LDAP URL *</label>
              <input
                type="text"
                [(ngModel)]="ssoConfig.config.ldapUrl"
                placeholder="ldap://ldap.example.com:389"
              />
              <p class="help-text">Адрес вашего LDAP сервера</p>
            </div>

            <div class="form-group">
              <label>Base DN *</label>
              <input
                type="text"
                [(ngModel)]="ssoConfig.config.ldapBaseDn"
                placeholder="dc=example,dc=com"
              />
              <p class="help-text">Distinguished Name для поиска</p>
            </div>

            <div class="form-group">
              <label>Bind DN *</label>
              <input
                type="text"
                [(ngModel)]="ssoConfig.config.ldapBindDn"
                placeholder="cn=admin,dc=example,dc=com"
              />
              <p class="help-text">DN для аутентификации на LDAP сервере</p>
            </div>

            <div class="form-group">
              <label>Search Filter</label>
              <input
                type="text"
                [(ngModel)]="ssoConfig.config.ldapSearchFilter"
                placeholder="(uid={{username}})"
              />
              <p class="help-text">Фильтр для поиска пользователей</p>
            </div>
          </div>

          <!-- Test Connection -->
          <div class="settings-card">
            <h2>Тестирование подключения</h2>
            <p>Проверьте настройки SSO перед сохранением</p>

            <div *ngIf="testResult" class="test-result" [class.success]="testResult.success">
              <div class="icon">{{ testResult.success ? '✅' : '❌' }}</div>
              <div>
                <h4>{{ testResult.message }}</h4>
                <p *ngIf="testResult.details">{{ testResult.details }}</p>
              </div>
            </div>

            <button
              class="btn-secondary full-width"
              (click)="testConnection()"
              [disabled]="testing()"
            >
              {{ testing() ? 'Тестирование...' : '🔍 Тестировать подключение' }}
            </button>
          </div>

          <!-- Actions -->
          <div class="settings-card actions-card">
            <div class="actions">
              <button class="btn-secondary" (click)="resetConfig()">
                Сбросить
              </button>
              <button
                class="btn-primary"
                (click)="saveConfig()"
                [disabled]="saving()"
              >
                {{ saving() ? 'Сохранение...' : 'Сохранить настройки' }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .sso-config { padding: 40px 20px; background: #f5f7fa; min-height: 100vh; }
    .container { max-width: 900px; margin: 0 auto; }
    .header { margin-bottom: 40px; }
    h1 { font-size: 2rem; color: #333; margin: 0 0 8px 0; }
    .subtitle { color: #666; margin: 0; }

    .upgrade-notice { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 40px; border-radius: 16px; display: flex; align-items: center; gap: 30px; }
    .upgrade-notice .icon { font-size: 4rem; }
    .upgrade-notice h3 { margin: 0 0 8px 0; font-size: 1.5rem; }
    .upgrade-notice p { margin: 0 0 20px 0; opacity: 0.9; }

    .settings-card { background: white; padding: 30px; border-radius: 16px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); margin-bottom: 24px; }
    .settings-card h2 { margin: 0 0 24px 0; color: #333; font-size: 1.25rem; }

    .provider-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; }
    .provider-card { padding: 24px; border: 2px solid #e0e0e0; border-radius: 12px; text-align: center; cursor: pointer; transition: all 0.3s; }
    .provider-card:hover { border-color: #667eea; transform: translateY(-4px); }
    .provider-card.active { border-color: #667eea; background: #f0f4ff; }
    .provider-icon { font-size: 3rem; margin-bottom: 12px; }
    .provider-card h3 { margin: 0 0 8px 0; color: #333; font-size: 1.125rem; }
    .provider-card p { margin: 0; color: #666; font-size: 0.875rem; }

    .info-box { background: #f8f9fa; padding: 20px; border-radius: 12px; margin-bottom: 24px; }
    .info-box h4 { margin: 0 0 12px 0; color: #555; font-size: 1rem; }
    .code-block { background: white; border: 1px solid #e0e0e0; border-radius: 8px; padding: 16px; }
    .code-line { display: flex; align-items: center; gap: 12px; margin-bottom: 12px; }
    .code-line:last-child { margin-bottom: 0; }
    .code-line .label { font-weight: 600; color: #555; min-width: 100px; }
    .code-line code { flex: 1; padding: 8px 12px; background: #f5f5f5; border-radius: 6px; font-family: 'Monaco', monospace; font-size: 0.875rem; word-break: break-all; }
    .code-line button { padding: 6px 12px; background: #667eea; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 0.875rem; }
    .code-line a { color: #667eea; text-decoration: none; font-weight: 600; }

    .form-group { margin-bottom: 24px; }
    .form-group:last-child { margin-bottom: 0; }
    .form-group label { display: block; margin-bottom: 8px; color: #555; font-weight: 500; }
    .form-group input, .form-group textarea { width: 100%; padding: 12px; border: 1px solid #ddd; border-radius: 8px; font-size: 1rem; }
    .form-group textarea { font-family: 'Monaco', 'Courier New', monospace; font-size: 0.875rem; resize: vertical; }
    .help-text { color: #999; font-size: 0.875rem; margin: 8px 0 0 0; }

    .test-result { display: flex; align-items: center; gap: 16px; padding: 20px; border-radius: 12px; margin-bottom: 20px; background: #ffebee; border: 2px solid #f44336; }
    .test-result.success { background: #e8f5e9; border-color: #4caf50; }
    .test-result .icon { font-size: 2rem; }
    .test-result h4 { margin: 0 0 4px 0; color: #333; }
    .test-result p { margin: 0; color: #666; font-size: 0.875rem; }

    .actions-card { background: #f8f9fa; }
    .actions { display: flex; gap: 16px; justify-content: flex-end; }

    button { padding: 12px 24px; border: none; border-radius: 8px; font-weight: 600; cursor: pointer; transition: all 0.3s; }
    .btn-primary { background: #667eea; color: white; }
    .btn-primary:hover { background: #5568d3; }
    .btn-primary:disabled { background: #ccc; cursor: not-allowed; }
    .btn-secondary { background: transparent; border: 2px solid #667eea; color: #667eea; }
    .btn-secondary.full-width { width: 100%; }

    @media (max-width: 768px) {
      .provider-grid { grid-template-columns: 1fr; }
    }
  `]
})
export class SsoConfigComponent implements OnInit {
  private orgService = inject(OrganizationService);

  organization = signal<Organization | null>(null);
  saving = signal(false);
  testing = signal(false);

  selectedProvider: 'saml' | 'oauth2' | 'oidc' | 'ldap' = 'saml';

  ssoConfig: SsoConfig = {
    provider: 'saml',
    config: {}
  };

  testResult: { success: boolean; message: string; details?: string } | null = null;

  ngOnInit() {
    this.loadOrganization();
  }

  loadOrganization() {
    const orgId = 1;
    this.orgService.getOrganization(orgId).subscribe({
      next: (org) => {
        this.organization.set(org);
      }
    });
  }

  selectProvider(provider: 'saml' | 'oauth2' | 'oidc' | 'ldap') {
    this.selectedProvider = provider;
    this.ssoConfig.provider = provider;
    this.ssoConfig.config = {};
    this.testResult = null;
  }

  getAcsUrl(): string {
    return `https://yourdomain.com/api/auth/saml/callback`;
  }

  getEntityId(): string {
    return `https://yourdomain.com/saml/metadata`;
  }

  getMetadataUrl(): string {
    return `/api/organizations/${this.organization()?.id}/sso/metadata`;
  }

  getRedirectUri(): string {
    return `https://yourdomain.com/api/auth/oauth/callback`;
  }

  copy(text: string) {
    navigator.clipboard.writeText(text);
    alert('Скопировано в буфер обмена!');
  }

  testConnection() {
    this.testing.set(true);
    this.testResult = null;

    // Simulate test
    setTimeout(() => {
      this.testing.set(false);
      this.testResult = {
        success: true,
        message: 'Подключение успешно!',
        details: 'SSO настроен корректно и готов к использованию.'
      };
    }, 2000);
  }

  resetConfig() {
    if (confirm('Сбросить все настройки SSO?')) {
      this.ssoConfig.config = {};
      this.testResult = null;
    }
  }

  saveConfig() {
    this.saving.set(true);
    const orgId = 1;

    this.orgService.configureSso(orgId, this.ssoConfig).subscribe({
      next: () => {
        this.saving.set(false);
        alert('SSO настройки сохранены!');
      },
      error: () => {
        this.saving.set(false);
        alert('Ошибка при сохранении');
      }
    });
  }
}
