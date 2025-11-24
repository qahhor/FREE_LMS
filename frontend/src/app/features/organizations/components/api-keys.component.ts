import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { OrganizationService } from '../services/organization.service';
import { Organization, ApiKeys } from '../models/organization.models';

interface ApiKey {
  id: string;
  name: string;
  key: string;
  secret: string;
  created: Date;
  lastUsed: Date | null;
  requestCount: number;
  isActive: boolean;
}

@Component({
  selector: 'app-api-keys',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="api-keys">
      <div class="container">
        <div class="header">
          <div>
            <h1>API Keys</h1>
            <p class="subtitle">Управление ключами для REST API доступа</p>
          </div>
          <button
            *ngIf="organization()?.features.apiAccess"
            class="btn-primary"
            (click)="generateNewKey()"
            [disabled]="generating()"
          >
            {{ generating() ? '⏳ Генерация...' : '+ Создать новый ключ' }}
          </button>
        </div>

        <div *ngIf="!organization()?.features.apiAccess" class="upgrade-notice">
          <div class="icon">⚙️</div>
          <div>
            <h3>API доступ доступен в тарифах Business и Enterprise</h3>
            <p>Обновите тариф для интеграции через REST API</p>
            <button class="btn-primary">Обновить тариф</button>
          </div>
        </div>

        <div *ngIf="organization()?.features.apiAccess">
          <!-- API Documentation -->
          <div class="info-card">
            <h2>📚 Документация API</h2>
            <p>
              Используйте наш REST API для интеграции с вашими системами.
              Полная документация доступна по адресу:
            </p>
            <div class="link-box">
              <a href="/api/docs" target="_blank">https://yourdomain.com/api/docs</a>
              <button (click)="copy('https://yourdomain.com/api/docs')">📋</button>
            </div>

            <div class="endpoints-preview">
              <h4>Основные endpoints:</h4>
              <ul>
                <li><code>GET /api/v1/courses</code> - Список курсов</li>
                <li><code>POST /api/v1/enrollments</code> - Регистрация на курс</li>
                <li><code>GET /api/v1/users/:id/progress</code> - Прогресс пользователя</li>
                <li><code>POST /api/v1/analytics/report</code> - Отчеты аналитики</li>
              </ul>
            </div>
          </div>

          <!-- Authentication Example -->
          <div class="info-card">
            <h2>🔐 Аутентификация</h2>
            <p>Используйте API ключи в заголовках запросов:</p>

            <div class="code-block">
              <pre>
curl -X GET https://yourdomain.com/api/v1/courses \\
  -H "X-API-Key: your_api_key" \\
  -H "X-API-Secret: your_api_secret"</pre>
              <button class="copy-btn" (click)="copyCode()">📋 Копировать</button>
            </div>
          </div>

          <!-- API Keys List -->
          <div class="keys-section">
            <h2>Ваши API ключи</h2>

            <div *ngIf="apiKeys().length === 0" class="empty-state">
              <div class="icon">🔑</div>
              <h3>У вас пока нет API ключей</h3>
              <p>Создайте первый ключ для начала работы с API</p>
            </div>

            <div *ngFor="let key of apiKeys()" class="key-card">
              <div class="key-header">
                <div>
                  <h3>{{ key.name }}</h3>
                  <span class="key-status" [class.active]="key.isActive">
                    {{ key.isActive ? '🟢 Активен' : '🔴 Отключен' }}
                  </span>
                </div>
                <div class="key-actions">
                  <button class="btn-icon" (click)="toggleKey(key)" [title]="key.isActive ? 'Отключить' : 'Включить'">
                    {{ key.isActive ? '🔒' : '🔓' }}
                  </button>
                  <button class="btn-icon danger" (click)="revokeKey(key)" title="Удалить">
                    🗑️
                  </button>
                </div>
              </div>

              <div class="key-details">
                <div class="detail-row">
                  <span class="label">API Key:</span>
                  <div class="value-box">
                    <code>{{ key.key }}</code>
                    <button (click)="copy(key.key)">📋</button>
                  </div>
                </div>

                <div class="detail-row">
                  <span class="label">API Secret:</span>
                  <div class="value-box">
                    <code>{{ maskSecret(key.secret) }}</code>
                    <button (click)="revealSecret(key)">👁️</button>
                  </div>
                </div>

                <div class="key-stats">
                  <div class="stat">
                    <span class="stat-label">Создан:</span>
                    <span class="stat-value">{{ formatDate(key.created) }}</span>
                  </div>
                  <div class="stat">
                    <span class="stat-label">Последнее использование:</span>
                    <span class="stat-value">{{ key.lastUsed ? formatDate(key.lastUsed) : 'Не использовался' }}</span>
                  </div>
                  <div class="stat">
                    <span class="stat-label">Запросов:</span>
                    <span class="stat-value">{{ formatNumber(key.requestCount) }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Rate Limits -->
          <div class="info-card">
            <h2>⚡ Лимиты запросов</h2>
            <div class="limits-grid">
              <div class="limit-card">
                <h4>Базовый</h4>
                <p class="limit-value">1,000</p>
                <p class="limit-label">запросов/час</p>
              </div>
              <div class="limit-card">
                <h4>Business</h4>
                <p class="limit-value">10,000</p>
                <p class="limit-label">запросов/час</p>
              </div>
              <div class="limit-card">
                <h4>Enterprise</h4>
                <p class="limit-value">∞</p>
                <p class="limit-label">без ограничений</p>
              </div>
            </div>
          </div>

          <!-- Security Best Practices -->
          <div class="info-card warning">
            <h2>⚠️ Безопасность</h2>
            <ul class="security-tips">
              <li>Никогда не передавайте API ключи в публичных репозиториях</li>
              <li>Используйте переменные окружения для хранения ключей</li>
              <li>Регулярно ротируйте ключи (каждые 90 дней)</li>
              <li>Отключайте неиспользуемые ключи</li>
              <li>Используйте отдельные ключи для разных приложений</li>
              <li>Мониторьте использование API через аналитику</li>
            </ul>
          </div>
        </div>

        <!-- New Key Modal -->
        <div *ngIf="showNewKeyModal" class="modal-overlay" (click)="showNewKeyModal = false">
          <div class="modal" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <h3>✅ Новый API ключ создан</h3>
              <button class="btn-close" (click)="showNewKeyModal = false">×</button>
            </div>
            <div class="modal-body">
              <div class="warning-box">
                <p><strong>⚠️ Важно!</strong> Сохраните эти данные в безопасном месте. Вы не сможете увидеть Secret повторно.</p>
              </div>

              <div class="form-group">
                <label>API Key</label>
                <div class="copy-field">
                  <code>{{ newKey?.apiKey }}</code>
                  <button (click)="copy(newKey?.apiKey || '')">📋</button>
                </div>
              </div>

              <div class="form-group">
                <label>API Secret</label>
                <div class="copy-field">
                  <code>{{ newKey?.apiSecret }}</code>
                  <button (click)="copy(newKey?.apiSecret || '')">📋</button>
                </div>
              </div>

              <div class="example-usage">
                <h4>Пример использования:</h4>
                <pre>
const headers = {{
  'X-API-Key': '{{ newKey?.apiKey }}',
  'X-API-Secret': '{{ newKey?.apiSecret }}'
}};

fetch('https://yourdomain.com/api/v1/courses', {{ headers }})
  .then(res => res.json())
  .then(data => console.log(data));</pre>
              </div>
            </div>
            <div class="modal-footer">
              <button class="btn-primary" (click)="showNewKeyModal = false">
                Я сохранил ключи
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .api-keys { padding: 40px 20px; background: #f5f7fa; min-height: 100vh; }
    .container { max-width: 1200px; margin: 0 auto; }
    .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 40px; }
    h1 { font-size: 2rem; color: #333; margin: 0 0 8px 0; }
    .subtitle { color: #666; margin: 0; }

    .upgrade-notice { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 40px; border-radius: 16px; display: flex; align-items: center; gap: 30px; margin-bottom: 40px; }
    .upgrade-notice .icon { font-size: 4rem; }
    .upgrade-notice h3 { margin: 0 0 8px 0; font-size: 1.5rem; }
    .upgrade-notice p { margin: 0 0 20px 0; opacity: 0.9; }

    .info-card { background: white; padding: 30px; border-radius: 16px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); margin-bottom: 24px; }
    .info-card.warning { background: #fff3cd; border: 2px solid #ffc107; }
    .info-card h2 { margin: 0 0 16px 0; color: #333; font-size: 1.25rem; }
    .info-card p { color: #666; line-height: 1.6; }

    .link-box { display: flex; align-items: center; gap: 12px; padding: 16px; background: #f8f9fa; border-radius: 8px; margin: 16px 0; }
    .link-box a { flex: 1; color: #667eea; text-decoration: none; font-weight: 600; word-break: break-all; }

    .endpoints-preview { margin-top: 20px; }
    .endpoints-preview h4 { margin: 0 0 12px 0; color: #555; }
    .endpoints-preview ul { list-style: none; padding: 0; margin: 0; }
    .endpoints-preview li { padding: 8px 0; border-bottom: 1px solid #f0f0f0; }
    .endpoints-preview code { color: #667eea; font-weight: 600; }

    .code-block { position: relative; background: #2c3e50; color: #ecf0f1; padding: 20px; border-radius: 8px; margin: 16px 0; }
    .code-block pre { margin: 0; font-family: 'Monaco', monospace; font-size: 0.875rem; line-height: 1.6; overflow-x: auto; }
    .copy-btn { position: absolute; top: 10px; right: 10px; padding: 6px 12px; background: #667eea; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 0.875rem; }

    .keys-section { background: white; padding: 30px; border-radius: 16px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); margin-bottom: 24px; }
    .keys-section h2 { margin: 0 0 24px 0; color: #333; font-size: 1.25rem; }

    .empty-state { text-align: center; padding: 60px 20px; }
    .empty-state .icon { font-size: 4rem; margin-bottom: 20px; }
    .empty-state h3 { color: #333; margin: 0 0 8px 0; }
    .empty-state p { color: #666; }

    .key-card { background: #f8f9fa; border: 2px solid #e0e0e0; border-radius: 12px; padding: 24px; margin-bottom: 16px; }
    .key-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
    .key-header h3 { margin: 0 0 8px 0; color: #333; font-size: 1.125rem; }
    .key-status { padding: 4px 12px; border-radius: 16px; font-size: 0.875rem; font-weight: 600; background: #ffebee; color: #c62828; }
    .key-status.active { background: #e8f5e9; color: #2e7d32; }
    .key-actions { display: flex; gap: 8px; }

    .key-details { }
    .detail-row { display: flex; align-items: center; gap: 16px; margin-bottom: 16px; }
    .detail-row .label { font-weight: 600; color: #555; min-width: 100px; }
    .value-box { flex: 1; display: flex; align-items: center; gap: 12px; padding: 12px; background: white; border: 1px solid #e0e0e0; border-radius: 8px; }
    .value-box code { flex: 1; font-family: 'Monaco', monospace; font-size: 0.875rem; word-break: break-all; color: #333; }
    .value-box button { padding: 6px 12px; background: #667eea; color: white; border: none; border-radius: 6px; cursor: pointer; }

    .key-stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-top: 20px; padding-top: 20px; border-top: 1px solid #e0e0e0; }
    .stat { }
    .stat-label { display: block; color: #999; font-size: 0.875rem; margin-bottom: 4px; }
    .stat-value { display: block; color: #333; font-weight: 600; }

    .limits-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }
    .limit-card { text-align: center; padding: 24px; background: #f8f9fa; border-radius: 12px; }
    .limit-card h4 { margin: 0 0 12px 0; color: #555; }
    .limit-value { font-size: 2.5rem; font-weight: 700; color: #667eea; margin: 0; }
    .limit-label { color: #999; font-size: 0.875rem; margin: 8px 0 0 0; }

    .security-tips { list-style: none; padding: 0; margin: 16px 0 0 0; }
    .security-tips li { padding: 12px 12px 12px 40px; position: relative; margin-bottom: 8px; }
    .security-tips li:before { content: '✓'; position: absolute; left: 12px; color: #4caf50; font-weight: 700; }

    .modal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 1000; }
    .modal { background: white; border-radius: 16px; max-width: 700px; width: 90%; max-height: 90vh; overflow-y: auto; }
    .modal-header { padding: 24px; border-bottom: 1px solid #f0f0f0; display: flex; justify-content: space-between; align-items: center; }
    .modal-body { padding: 24px; }
    .modal-footer { padding: 24px; border-top: 1px solid #f0f0f0; display: flex; justify-content: center; }

    .warning-box { background: #fff3cd; border: 2px solid #ffc107; padding: 16px; border-radius: 8px; margin-bottom: 24px; }
    .warning-box p { margin: 0; color: #856404; }

    .form-group { margin-bottom: 20px; }
    .form-group label { display: block; margin-bottom: 8px; color: #555; font-weight: 500; }
    .copy-field { display: flex; align-items: center; gap: 12px; padding: 12px; background: #f8f9fa; border: 1px solid #e0e0e0; border-radius: 8px; }
    .copy-field code { flex: 1; font-family: 'Monaco', monospace; font-size: 0.875rem; word-break: break-all; }
    .copy-field button { padding: 6px 12px; background: #667eea; color: white; border: none; border-radius: 6px; cursor: pointer; }

    .example-usage { margin-top: 24px; }
    .example-usage h4 { margin: 0 0 12px 0; color: #555; }
    .example-usage pre { background: #2c3e50; color: #ecf0f1; padding: 16px; border-radius: 8px; font-family: 'Monaco', monospace; font-size: 0.875rem; line-height: 1.6; overflow-x: auto; margin: 0; }

    button { padding: 12px 24px; border: none; border-radius: 8px; font-weight: 600; cursor: pointer; transition: all 0.3s; }
    .btn-primary { background: #667eea; color: white; }
    .btn-primary:hover { background: #5568d3; }
    .btn-primary:disabled { background: #ccc; cursor: not-allowed; }
    .btn-icon { padding: 8px; background: transparent; border: none; cursor: pointer; font-size: 1.125rem; }
    .btn-icon.danger:hover { filter: brightness(0.8); }
    .btn-close { background: none; font-size: 2rem; color: #999; padding: 0; width: 32px; height: 32px; }

    @media (max-width: 768px) {
      .limits-grid { grid-template-columns: 1fr; }
      .key-stats { grid-template-columns: 1fr; }
    }
  `]
})
export class ApiKeysComponent implements OnInit {
  private orgService = inject(OrganizationService);

  organization = signal<Organization | null>(null);
  apiKeys = signal<ApiKey[]>([]);
  generating = signal(false);
  showNewKeyModal = false;
  newKey: ApiKeys | null = null;

  ngOnInit() {
    this.loadOrganization();
    this.loadApiKeys();
  }

  loadOrganization() {
    const orgId = 1;
    this.orgService.getOrganization(orgId).subscribe({
      next: (org) => this.organization.set(org)
    });
  }

  loadApiKeys() {
    // Mock data
    this.apiKeys.set([
      {
        id: '1',
        name: 'Production API',
        key: 'pk_live_51Hm3b4...',
        secret: 'sk_live_51Hm3b4...',
        created: new Date('2024-01-15'),
        lastUsed: new Date('2024-11-24'),
        requestCount: 15678,
        isActive: true
      }
    ]);
  }

  generateNewKey() {
    this.generating.set(true);
    const orgId = 1;

    this.orgService.generateApiKeys(orgId).subscribe({
      next: (keys) => {
        this.generating.set(false);
        this.newKey = keys;
        this.showNewKeyModal = true;
        this.loadApiKeys();
      },
      error: () => {
        this.generating.set(false);
        alert('Ошибка при генерации ключей');
      }
    });
  }

  toggleKey(key: ApiKey) {
    console.log('Toggle key:', key);
    // TODO: Implement toggle API
  }

  revokeKey(key: ApiKey) {
    if (confirm('Удалить этот API ключ? Это действие необратимо.')) {
      console.log('Revoke key:', key);
      // TODO: Implement revoke API
    }
  }

  maskSecret(secret: string): string {
    return secret.substring(0, 8) + '••••••••••••••••';
  }

  revealSecret(key: ApiKey) {
    prompt('API Secret:', key.secret);
  }

  copy(text: string) {
    navigator.clipboard.writeText(text);
    alert('Скопировано в буфер обмена!');
  }

  copyCode() {
    const code = `curl -X GET https://yourdomain.com/api/v1/courses \\
  -H "X-API-Key: your_api_key" \\
  -H "X-API-Secret: your_api_secret"`;
    this.copy(code);
  }

  formatDate(date: Date): string {
    return new Date(date).toLocaleDateString('ru-RU');
  }

  formatNumber(num: number): string {
    return new Intl.NumberFormat('ru-RU').format(num);
  }
}
