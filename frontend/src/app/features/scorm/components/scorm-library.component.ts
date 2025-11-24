import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ScormService } from '../services/scorm.service';
import { ScormPackage, ScormProgress } from '../models/scorm.models';
import { ScormUploadComponent } from './scorm-upload.component';

@Component({
  selector: 'app-scorm-library',
  standalone: true,
  imports: [CommonModule, ScormUploadComponent],
  template: `
    <div class="scorm-library">
      <div class="container">
        <!-- Header -->
        <div class="header">
          <div>
            <h1>Библиотека SCORM</h1>
            <p class="subtitle">Корпоративное обучение с поддержкой SCORM 1.2 и 2004</p>
          </div>
          <button class="btn-primary" (click)="showUploadModal = true">
            + Загрузить пакет
          </button>
        </div>

        <!-- Stats Cards -->
        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-icon">📦</div>
            <div>
              <h3>Пакетов</h3>
              <p class="stat-value">{{ packages().length }}</p>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-icon">✅</div>
            <div>
              <h3>Завершено</h3>
              <p class="stat-value">{{ getCompletedCount() }}</p>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-icon">🎯</div>
            <div>
              <h3>В процессе</h3>
              <p class="stat-value">{{ getInProgressCount() }}</p>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-icon">⏱️</div>
            <div>
              <h3>Общее время</h3>
              <p class="stat-value">{{ getTotalTime() }}</p>
            </div>
          </div>
        </div>

        <!-- Loading State -->
        <div *ngIf="loading()" class="loading">
          <div class="spinner"></div>
          <p>Загрузка библиотеки...</p>
        </div>

        <!-- Empty State -->
        <div *ngIf="!loading() && packages().length === 0" class="empty-state">
          <div class="empty-icon">📚</div>
          <h2>Библиотека пуста</h2>
          <p>Загрузите первый SCORM пакет для начала работы</p>
          <button class="btn-primary" (click)="showUploadModal = true">
            Загрузить пакет
          </button>
        </div>

        <!-- Packages Grid -->
        <div *ngIf="!loading() && packages().length > 0" class="packages-section">
          <div class="section-header">
            <h2>Мои курсы</h2>
            <div class="view-toggle">
              <button
                [class.active]="viewMode === 'grid'"
                (click)="viewMode = 'grid'"
                title="Сетка"
              >
                ⊞
              </button>
              <button
                [class.active]="viewMode === 'list'"
                (click)="viewMode = 'list'"
                title="Список"
              >
                ☰
              </button>
            </div>
          </div>

          <div class="packages-grid" [class.list-view]="viewMode === 'list'">
            <div
              *ngFor="let package of packages()"
              class="package-card"
              [class.list-item]="viewMode === 'list'"
            >
              <div class="package-thumbnail">
                <img
                  *ngIf="package.thumbnail"
                  [src]="package.thumbnail"
                  [alt]="package.title"
                />
                <div *ngIf="!package.thumbnail" class="thumbnail-placeholder">
                  📦
                </div>
                <span class="version-badge">SCORM {{ package.version }}</span>
              </div>

              <div class="package-content">
                <h3>{{ package.title }}</h3>
                <p class="description">
                  {{ package.description || 'Нет описания' }}
                </p>

                <div class="package-meta">
                  <span class="meta-item">
                    📅 {{ formatDate(package.createdAt) }}
                  </span>
                  <span *ngIf="package.duration" class="meta-item">
                    ⏱️ {{ formatDuration(package.duration) }}
                  </span>
                </div>

                <!-- Progress Bar -->
                <div class="progress-container">
                  <div class="progress-info">
                    <span class="progress-label">Прогресс:</span>
                    <span class="progress-percent">{{ getProgress(package.id) }}%</span>
                  </div>
                  <div class="progress-bar">
                    <div
                      class="progress-fill"
                      [style.width.%]="getProgress(package.id)"
                      [class.complete]="getProgress(package.id) === 100"
                    ></div>
                  </div>
                  <span class="progress-status">{{ getStatus(package.id) }}</span>
                </div>

                <div class="package-actions">
                  <button
                    class="btn-launch"
                    (click)="launchPackage(package)"
                  >
                    {{ getProgress(package.id) > 0 ? '▶ Продолжить' : '▶ Начать' }}
                  </button>
                  <button
                    class="btn-icon"
                    (click)="showPackageInfo(package)"
                    title="Информация"
                  >
                    ℹ️
                  </button>
                  <button
                    class="btn-icon danger"
                    (click)="deletePackage(package)"
                    title="Удалить"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Upload Modal -->
        <div *ngIf="showUploadModal" class="modal-overlay" (click)="showUploadModal = false">
          <div class="modal" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <h3>Загрузить SCORM пакет</h3>
              <button class="btn-close" (click)="showUploadModal = false">×</button>
            </div>
            <app-scorm-upload
              (uploadComplete)="onUploadComplete()"
              (uploadCancel)="showUploadModal = false"
            ></app-scorm-upload>
          </div>
        </div>

        <!-- Package Info Modal -->
        <div *ngIf="showInfoModal && selectedPackage" class="modal-overlay" (click)="showInfoModal = false">
          <div class="modal info-modal" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <h3>Информация о пакете</h3>
              <button class="btn-close" (click)="showInfoModal = false">×</button>
            </div>
            <div class="modal-body">
              <div class="info-grid">
                <div class="info-item">
                  <span class="info-label">Название:</span>
                  <span class="info-value">{{ selectedPackage.title }}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">Версия SCORM:</span>
                  <span class="info-value">{{ selectedPackage.version }}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">Дата создания:</span>
                  <span class="info-value">{{ formatDate(selectedPackage.createdAt) }}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">Последнее обновление:</span>
                  <span class="info-value">{{ formatDate(selectedPackage.updatedAt) }}</span>
                </div>
                <div *ngIf="selectedPackage.metadata" class="info-item full-width">
                  <span class="info-label">Идентификатор:</span>
                  <span class="info-value">{{ selectedPackage.metadata.identifier }}</span>
                </div>
                <div *ngIf="selectedPackage.description" class="info-item full-width">
                  <span class="info-label">Описание:</span>
                  <p class="info-value">{{ selectedPackage.description }}</p>
                </div>
              </div>
            </div>
            <div class="modal-footer">
              <button class="btn-primary" (click)="launchPackage(selectedPackage)">
                Запустить курс
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .scorm-library {
      padding: 40px 20px;
      background: #f5f7fa;
      min-height: 100vh;
    }

    .container {
      max-width: 1400px;
      margin: 0 auto;
    }

    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 40px;
    }

    h1 {
      font-size: 2rem;
      color: #333;
      margin: 0 0 8px 0;
    }

    .subtitle {
      color: #666;
      margin: 0;
    }

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 20px;
      margin-bottom: 40px;
    }

    .stat-card {
      background: white;
      padding: 24px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      gap: 20px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }

    .stat-icon {
      font-size: 2.5rem;
    }

    .stat-card h3 {
      margin: 0 0 4px 0;
      color: #999;
      font-size: 0.875rem;
      font-weight: 500;
    }

    .stat-value {
      font-size: 2rem;
      font-weight: 700;
      color: #333;
      margin: 0;
    }

    .loading {
      text-align: center;
      padding: 100px 20px;
    }

    .spinner {
      width: 60px;
      height: 60px;
      border: 4px solid #f3f3f3;
      border-top-color: #667eea;
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin: 0 auto 20px;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    .loading p {
      color: #666;
      font-size: 1.125rem;
    }

    .empty-state {
      text-align: center;
      padding: 100px 20px;
      background: white;
      border-radius: 16px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }

    .empty-icon {
      font-size: 5rem;
      margin-bottom: 20px;
    }

    .empty-state h2 {
      color: #333;
      margin: 0 0 8px 0;
    }

    .empty-state p {
      color: #666;
      margin: 0 0 30px 0;
    }

    .packages-section { }

    .section-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 24px;
    }

    .section-header h2 {
      margin: 0;
      color: #333;
      font-size: 1.5rem;
    }

    .view-toggle {
      display: flex;
      gap: 8px;
    }

    .view-toggle button {
      width: 40px;
      height: 40px;
      border: 2px solid #ddd;
      background: white;
      border-radius: 8px;
      cursor: pointer;
      font-size: 1.25rem;
      transition: all 0.3s;
    }

    .view-toggle button:hover {
      border-color: #667eea;
      color: #667eea;
    }

    .view-toggle button.active {
      border-color: #667eea;
      background: #667eea;
      color: white;
    }

    .packages-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
      gap: 24px;
    }

    .packages-grid.list-view {
      grid-template-columns: 1fr;
    }

    .package-card {
      background: white;
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      transition: transform 0.3s, box-shadow 0.3s;
    }

    .package-card:hover {
      transform: translateY(-4px);
      box-shadow: 0 8px 16px rgba(0,0,0,0.15);
    }

    .package-card.list-item {
      display: flex;
      flex-direction: row;
    }

    .package-card.list-item .package-thumbnail {
      width: 200px;
      height: auto;
    }

    .package-card.list-item .package-content {
      flex: 1;
    }

    .package-thumbnail {
      position: relative;
      width: 100%;
      height: 200px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      overflow: hidden;
    }

    .package-thumbnail img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .thumbnail-placeholder {
      width: 100%;
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 4rem;
      color: white;
    }

    .version-badge {
      position: absolute;
      top: 12px;
      right: 12px;
      padding: 6px 12px;
      background: rgba(255,255,255,0.9);
      border-radius: 16px;
      font-size: 0.75rem;
      font-weight: 600;
      color: #667eea;
    }

    .package-content {
      padding: 24px;
    }

    .package-content h3 {
      margin: 0 0 8px 0;
      color: #333;
      font-size: 1.25rem;
    }

    .description {
      color: #666;
      margin: 0 0 16px 0;
      font-size: 0.875rem;
      line-height: 1.5;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }

    .package-meta {
      display: flex;
      gap: 16px;
      margin-bottom: 16px;
    }

    .meta-item {
      color: #999;
      font-size: 0.875rem;
    }

    .progress-container {
      margin-bottom: 16px;
      padding: 16px;
      background: #f8f9fa;
      border-radius: 8px;
    }

    .progress-info {
      display: flex;
      justify-content: space-between;
      margin-bottom: 8px;
    }

    .progress-label {
      color: #666;
      font-size: 0.875rem;
    }

    .progress-percent {
      color: #667eea;
      font-weight: 700;
      font-size: 0.875rem;
    }

    .progress-bar {
      height: 6px;
      background: #e0e0e0;
      border-radius: 3px;
      overflow: hidden;
      margin-bottom: 8px;
    }

    .progress-fill {
      height: 100%;
      background: linear-gradient(90deg, #667eea, #764ba2);
      transition: width 0.3s;
    }

    .progress-fill.complete {
      background: #4caf50;
    }

    .progress-status {
      color: #999;
      font-size: 0.875rem;
    }

    .package-actions {
      display: flex;
      gap: 8px;
    }

    .btn-launch {
      flex: 1;
      padding: 12px;
      background: #667eea;
      color: white;
      border: none;
      border-radius: 8px;
      font-weight: 600;
      cursor: pointer;
      transition: background 0.3s;
    }

    .btn-launch:hover {
      background: #5568d3;
    }

    .btn-icon {
      width: 44px;
      padding: 12px;
      background: transparent;
      border: 1px solid #ddd;
      border-radius: 8px;
      cursor: pointer;
      font-size: 1.125rem;
      transition: all 0.3s;
    }

    .btn-icon:hover {
      border-color: #667eea;
      background: #f0f4ff;
    }

    .btn-icon.danger:hover {
      border-color: #f44336;
      background: #ffebee;
    }

    .modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0,0,0,0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
    }

    .modal {
      background: white;
      border-radius: 16px;
      max-width: 900px;
      width: 90%;
      max-height: 90vh;
      overflow-y: auto;
    }

    .modal-header {
      padding: 24px;
      border-bottom: 1px solid #f0f0f0;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .modal-header h3 {
      margin: 0;
      color: #333;
      font-size: 1.5rem;
    }

    .btn-close {
      background: none;
      border: none;
      font-size: 2rem;
      color: #999;
      cursor: pointer;
      padding: 0;
      width: 32px;
      height: 32px;
    }

    .modal-body {
      padding: 24px;
    }

    .info-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 20px;
    }

    .info-item {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .info-item.full-width {
      grid-column: 1 / -1;
    }

    .info-label {
      color: #999;
      font-size: 0.875rem;
      font-weight: 500;
    }

    .info-value {
      color: #333;
      font-weight: 600;
    }

    .modal-footer {
      padding: 24px;
      border-top: 1px solid #f0f0f0;
      display: flex;
      justify-content: center;
    }

    button {
      transition: all 0.3s;
    }

    .btn-primary {
      padding: 12px 32px;
      background: #667eea;
      color: white;
      border: none;
      border-radius: 8px;
      font-weight: 600;
      cursor: pointer;
    }

    .btn-primary:hover {
      background: #5568d3;
    }

    @media (max-width: 768px) {
      .packages-grid {
        grid-template-columns: 1fr;
      }

      .stats-grid {
        grid-template-columns: repeat(2, 1fr);
      }

      .info-grid {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class ScormLibraryComponent implements OnInit {
  private scormService = inject(ScormService);
  private router = inject(Router);

  packages = signal<ScormPackage[]>([]);
  progress = signal<Map<number, ScormProgress>>(new Map());
  loading = signal(true);

  showUploadModal = false;
  showInfoModal = false;
  selectedPackage: ScormPackage | null = null;
  viewMode: 'grid' | 'list' = 'grid';

  ngOnInit() {
    this.loadPackages();
    this.loadProgress();
  }

  loadPackages() {
    this.loading.set(true);
    this.scormService.getPackages().subscribe({
      next: (data) => {
        this.packages.set(data.packages);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  loadProgress() {
    this.scormService.getUserProgress().subscribe({
      next: (data) => {
        const progressMap = new Map();
        data.progress.forEach(p => progressMap.set(p.packageId, p));
        this.progress.set(progressMap);
      }
    });
  }

  getProgress(packageId: number): number {
    return this.progress().get(packageId)?.progress || 0;
  }

  getStatus(packageId: number): string {
    const p = this.progress().get(packageId);
    if (!p) return 'Не начат';
    if (p.lessonStatus === 'completed' || p.lessonStatus === 'passed') return 'Завершен';
    if (p.lessonStatus === 'failed') return 'Не сдан';
    return 'В процессе';
  }

  getCompletedCount(): number {
    let count = 0;
    this.progress().forEach(p => {
      if (p.lessonStatus === 'completed' || p.lessonStatus === 'passed') count++;
    });
    return count;
  }

  getInProgressCount(): number {
    let count = 0;
    this.progress().forEach(p => {
      if (p.lessonStatus !== 'completed' && p.lessonStatus !== 'passed' && p.progress > 0) {
        count++;
      }
    });
    return count;
  }

  getTotalTime(): string {
    let totalMinutes = 0;
    this.progress().forEach(p => {
      if (p.totalTime) {
        const match = p.totalTime.match(/PT(\d+)H(\d+)M/);
        if (match) {
          totalMinutes += parseInt(match[1]) * 60 + parseInt(match[2]);
        }
      }
    });

    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    if (hours > 0) return `${hours}ч ${minutes}м`;
    return `${minutes}м`;
  }

  launchPackage(pkg: ScormPackage) {
    this.router.navigate(['/scorm/player', pkg.id]);
  }

  showPackageInfo(pkg: ScormPackage) {
    this.selectedPackage = pkg;
    this.showInfoModal = true;
  }

  deletePackage(pkg: ScormPackage) {
    if (confirm(`Удалить пакет "${pkg.title}"?`)) {
      this.scormService.deletePackage(pkg.id).subscribe({
        next: () => {
          this.loadPackages();
          alert('Пакет удален');
        },
        error: () => alert('Ошибка при удалении')
      });
    }
  }

  onUploadComplete() {
    this.showUploadModal = false;
    this.loadPackages();
  }

  formatDate(date: Date): string {
    return new Date(date).toLocaleDateString('ru-RU');
  }

  formatDuration(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) return `${hours}ч ${minutes}мин`;
    return `${minutes} мин`;
  }
}
