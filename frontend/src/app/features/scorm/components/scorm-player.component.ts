import { Component, OnInit, OnDestroy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { ScormService } from '../services/scorm.service';
import { ScormPackage, ScormTracking, ScormLaunchData } from '../models/scorm.models';

@Component({
  selector: 'app-scorm-player',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="scorm-player">
      <!-- Header -->
      <div class="player-header">
        <div class="header-left">
          <button class="btn-back" (click)="goBack()">
            ← Назад к библиотеке
          </button>
          <h2>{{ package()?.title || 'Загрузка...' }}</h2>
        </div>
        <div class="header-right">
          <div class="progress-indicator">
            <span class="progress-label">Прогресс:</span>
            <div class="progress-bar">
              <div class="progress-fill" [style.width.%]="progress()"></div>
            </div>
            <span class="progress-text">{{ progress() }}%</span>
          </div>
          <button class="btn-exit" (click)="exitPlayer()">
            ✕ Выйти
          </button>
        </div>
      </div>

      <!-- Loading State -->
      <div *ngIf="loading()" class="loading-state">
        <div class="spinner"></div>
        <p>Загрузка SCORM пакета...</p>
      </div>

      <!-- Error State -->
      <div *ngIf="error()" class="error-state">
        <div class="error-icon">⚠️</div>
        <h3>Ошибка загрузки</h3>
        <p>{{ error() }}</p>
        <button class="btn-primary" (click)="retryLoad()">Попробовать снова</button>
      </div>

      <!-- SCORM Content -->
      <div *ngIf="!loading() && !error()" class="player-content">
        <iframe
          #scormFrame
          [src]="launchUrl()"
          class="scorm-iframe"
          allowfullscreen
          allow="autoplay; fullscreen; microphone; camera"
        ></iframe>
      </div>

      <!-- Navigation Controls -->
      <div *ngIf="!loading() && !error()" class="player-controls">
        <button class="btn-control" (click)="previousPage()" [disabled]="!canGoPrevious()">
          ← Предыдущая
        </button>

        <div class="controls-center">
          <span class="page-info">
            Страница {{ currentPage() }} из {{ totalPages() }}
          </span>
        </div>

        <button class="btn-control" (click)="nextPage()" [disabled]="!canGoNext()">
          Следующая →
        </button>
      </div>

      <!-- Completion Modal -->
      <div *ngIf="showCompletionModal" class="modal-overlay">
        <div class="modal completion-modal">
          <div class="completion-icon">
            {{ completionStatus === 'passed' ? '🎉' : completionStatus === 'completed' ? '✅' : '📝' }}
          </div>
          <h2>
            {{ completionStatus === 'passed' ? 'Отлично! Вы прошли курс!' :
               completionStatus === 'completed' ? 'Курс завершен!' :
               'Прогресс сохранен' }}
          </h2>
          <div *ngIf="tracking()" class="completion-stats">
            <div class="stat">
              <span class="stat-label">Оценка:</span>
              <span class="stat-value">
                {{ tracking()!.scoreRaw || 0 }} / {{ tracking()!.scoreMax || 100 }}
              </span>
            </div>
            <div class="stat">
              <span class="stat-label">Время:</span>
              <span class="stat-value">{{ formatTime(tracking()!.totalTime) }}</span>
            </div>
            <div class="stat">
              <span class="stat-label">Статус:</span>
              <span class="stat-value">{{ getStatusLabel(tracking()!.lessonStatus) }}</span>
            </div>
          </div>
          <div class="modal-actions">
            <button class="btn-secondary" (click)="continueLearning()">
              Продолжить обучение
            </button>
            <button class="btn-primary" (click)="returnToLibrary()">
              Вернуться к библиотеке
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .scorm-player {
      display: flex;
      flex-direction: column;
      height: 100vh;
      background: #f5f7fa;
    }

    .player-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 16px 24px;
      background: white;
      border-bottom: 1px solid #e0e0e0;
      z-index: 10;
    }

    .header-left { display: flex; align-items: center; gap: 20px; }
    .header-left h2 { margin: 0; color: #333; font-size: 1.25rem; }

    .btn-back {
      padding: 8px 16px;
      background: transparent;
      border: 1px solid #ddd;
      border-radius: 8px;
      color: #667eea;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s;
    }
    .btn-back:hover { background: #f0f4ff; border-color: #667eea; }

    .header-right { display: flex; align-items: center; gap: 20px; }

    .progress-indicator { display: flex; align-items: center; gap: 12px; }
    .progress-label { color: #666; font-size: 0.875rem; }
    .progress-bar {
      width: 150px;
      height: 8px;
      background: #e0e0e0;
      border-radius: 4px;
      overflow: hidden;
    }
    .progress-fill {
      height: 100%;
      background: linear-gradient(90deg, #667eea, #764ba2);
      transition: width 0.3s;
    }
    .progress-text { font-weight: 600; color: #667eea; }

    .btn-exit {
      padding: 8px 16px;
      background: #f44336;
      color: white;
      border: none;
      border-radius: 8px;
      font-weight: 600;
      cursor: pointer;
    }

    .loading-state, .error-state {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 60px 20px;
    }

    .spinner {
      width: 60px;
      height: 60px;
      border: 4px solid #f3f3f3;
      border-top-color: #667eea;
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin-bottom: 20px;
    }
    @keyframes spin { to { transform: rotate(360deg); } }

    .loading-state p { color: #666; font-size: 1.125rem; }

    .error-icon { font-size: 4rem; margin-bottom: 20px; }
    .error-state h3 { color: #333; margin: 0 0 8px 0; }
    .error-state p { color: #666; margin: 0 0 20px 0; }

    .player-content {
      flex: 1;
      position: relative;
      background: white;
      overflow: hidden;
    }

    .scorm-iframe {
      width: 100%;
      height: 100%;
      border: none;
      display: block;
    }

    .player-controls {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 16px 24px;
      background: white;
      border-top: 1px solid #e0e0e0;
    }

    .controls-center { flex: 1; text-align: center; }
    .page-info { color: #666; font-size: 0.875rem; }

    .btn-control {
      padding: 10px 24px;
      background: #667eea;
      color: white;
      border: none;
      border-radius: 8px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s;
    }
    .btn-control:hover { background: #5568d3; }
    .btn-control:disabled {
      background: #ccc;
      cursor: not-allowed;
      opacity: 0.5;
    }

    .modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0,0,0,0.7);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
    }

    .modal {
      background: white;
      border-radius: 20px;
      max-width: 500px;
      width: 90%;
      padding: 40px;
      text-align: center;
    }

    .completion-icon { font-size: 5rem; margin-bottom: 20px; }
    .completion-modal h2 {
      color: #333;
      margin: 0 0 30px 0;
      font-size: 1.75rem;
    }

    .completion-stats {
      display: flex;
      justify-content: space-around;
      margin: 30px 0;
      padding: 24px;
      background: #f8f9fa;
      border-radius: 12px;
    }

    .stat { text-align: center; }
    .stat-label {
      display: block;
      color: #999;
      font-size: 0.875rem;
      margin-bottom: 8px;
    }
    .stat-value {
      display: block;
      color: #333;
      font-weight: 700;
      font-size: 1.25rem;
    }

    .modal-actions { display: flex; gap: 12px; justify-content: center; }

    button { transition: all 0.3s; }
    .btn-primary {
      padding: 12px 32px;
      background: #667eea;
      color: white;
      border: none;
      border-radius: 8px;
      font-weight: 600;
      cursor: pointer;
    }
    .btn-primary:hover { background: #5568d3; }
    .btn-secondary {
      padding: 12px 32px;
      background: transparent;
      border: 2px solid #667eea;
      color: #667eea;
      border-radius: 8px;
      font-weight: 600;
      cursor: pointer;
    }
    .btn-secondary:hover { background: #f0f4ff; }
  `]
})
export class ScormPlayerComponent implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private scormService = inject(ScormService);
  private sanitizer = inject(DomSanitizer);

  package = signal<ScormPackage | null>(null);
  tracking = signal<ScormTracking | null>(null);
  loading = signal(true);
  error = signal<string | null>(null);
  progress = signal(0);
  currentPage = signal(1);
  totalPages = signal(1);

  launchUrl = signal<SafeResourceUrl | null>(null);
  sessionId = '';
  completionStatus = '';
  showCompletionModal = false;

  private autoSaveInterval: any;

  ngOnInit() {
    const packageId = this.route.snapshot.params['id'];
    this.loadPackage(packageId);
  }

  ngOnDestroy() {
    if (this.autoSaveInterval) {
      clearInterval(this.autoSaveInterval);
    }
    if (this.sessionId) {
      this.scormService.terminate(this.sessionId).subscribe();
    }
  }

  loadPackage(id: number) {
    this.loading.set(true);
    this.error.set(null);

    this.scormService.launchPackage(id).subscribe({
      next: (data: ScormLaunchData) => {
        this.scormService.getPackage(id).subscribe({
          next: (pkg) => {
            this.package.set(pkg);
            this.sessionId = data.sessionId;
            this.tracking.set(data.tracking);
            this.launchUrl.set(this.sanitizer.bypassSecurityTrustResourceUrl(data.launchUrl));
            this.loading.set(false);
            this.startAutoSave();
            this.calculateProgress();
          }
        });
      },
      error: (err) => {
        this.error.set('Не удалось загрузить SCORM пакет');
        this.loading.set(false);
      }
    });
  }

  startAutoSave() {
    this.autoSaveInterval = setInterval(() => {
      if (this.sessionId) {
        this.scormService.commit(this.sessionId).subscribe();
      }
    }, 30000); // Auto-save every 30 seconds
  }

  calculateProgress() {
    const t = this.tracking();
    if (t) {
      if (t.lessonStatus === 'completed' || t.lessonStatus === 'passed') {
        this.progress.set(100);
      } else if (t.scoreRaw && t.scoreMax) {
        this.progress.set(Math.round((t.scoreRaw / t.scoreMax) * 100));
      } else {
        this.progress.set(0);
      }
    }
  }

  canGoPrevious(): boolean {
    return this.currentPage() > 1;
  }

  canGoNext(): boolean {
    return this.currentPage() < this.totalPages();
  }

  previousPage() {
    if (this.canGoPrevious()) {
      this.currentPage.set(this.currentPage() - 1);
    }
  }

  nextPage() {
    if (this.canGoNext()) {
      this.currentPage.set(this.currentPage() + 1);
    }
  }

  exitPlayer() {
    if (confirm('Вы уверены, что хотите выйти? Прогресс будет сохранен.')) {
      this.returnToLibrary();
    }
  }

  goBack() {
    this.exitPlayer();
  }

  retryLoad() {
    const packageId = this.route.snapshot.params['id'];
    this.loadPackage(packageId);
  }

  continueLearning() {
    this.showCompletionModal = false;
  }

  returnToLibrary() {
    this.router.navigate(['/scorm/library']);
  }

  formatTime(time: string | null): string {
    if (!time) return '0 мин';
    // Parse SCORM time format (PT0H0M0S)
    const match = time.match(/PT(\d+)H(\d+)M(\d+)S/);
    if (match) {
      const hours = parseInt(match[1]);
      const minutes = parseInt(match[2]);
      if (hours > 0) return `${hours}ч ${minutes}мин`;
      return `${minutes} мин`;
    }
    return time;
  }

  getStatusLabel(status: string): string {
    const labels: any = {
      'passed': 'Пройден',
      'completed': 'Завершен',
      'failed': 'Не сдан',
      'incomplete': 'В процессе',
      'browsed': 'Просмотрен',
      'not attempted': 'Не начат'
    };
    return labels[status] || status;
  }
}
