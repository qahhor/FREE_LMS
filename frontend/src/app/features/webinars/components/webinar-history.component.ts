import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { WebinarService } from '../services/webinar.service';
import { Webinar } from '../models/webinar.models';

@Component({
  selector: 'app-webinar-history',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="webinar-history">
      <div class="container">
        <div class="header">
          <h1>История вебинаров</h1>
          <p class="subtitle">Просматривайте записи прошедших сессий</p>
        </div>

        <div *ngIf="loading()" class="loading">
          <div class="spinner"></div>
          <p>Загрузка истории...</p>
        </div>

        <div *ngIf="!loading() && webinars().length === 0" class="empty-state">
          <div class="empty-icon">📹</div>
          <h2>Нет записей вебинаров</h2>
          <p>Здесь будут отображаться записи завершенных вебинаров</p>
        </div>

        <div *ngIf="!loading() && webinars().length > 0" class="webinars-grid">
          <div
            *ngFor="let webinar of webinars()"
            class="webinar-card"
          >
            <div class="webinar-thumbnail">
              <div class="thumbnail-placeholder">
                <span class="play-icon">▶</span>
              </div>
              <span class="duration-badge" *ngIf="webinar.recording?.duration">
                {{ formatDuration(webinar.recording.duration) }}
              </span>
              <div *ngIf="!webinar.recording?.available" class="processing-overlay">
                <div class="processing-spinner"></div>
                <p>Обработка записи...</p>
              </div>
            </div>

            <div class="webinar-content">
              <h3>{{ webinar.title }}</h3>
              <p class="description">{{ webinar.description }}</p>

              <div class="webinar-meta">
                <div class="meta-row">
                  <span class="meta-icon">📅</span>
                  <span>{{ formatDate(webinar.scheduledAt) }}</span>
                </div>
                <div class="meta-row">
                  <span class="meta-icon">⏱️</span>
                  <span>{{ webinar.duration }} минут</span>
                </div>
                <div class="meta-row">
                  <span class="meta-icon">👨‍🏫</span>
                  <span>
                    {{ webinar.instructor.firstName }} {{ webinar.instructor.lastName }}
                  </span>
                </div>
                <div class="meta-row">
                  <span class="meta-icon">👥</span>
                  <span>{{ getAttendanceCount(webinar) }} участников</span>
                </div>
              </div>

              <div class="webinar-stats">
                <div class="stat">
                  <span class="stat-value">{{ getAttendanceRate(webinar) }}%</span>
                  <span class="stat-label">Посещаемость</span>
                </div>
                <div class="stat">
                  <span class="stat-value">{{ getAverageDuration(webinar) }}</span>
                  <span class="stat-label">Ср. время</span>
                </div>
              </div>

              <div class="webinar-actions">
                <button
                  *ngIf="webinar.recording?.available"
                  class="btn-play"
                  (click)="playRecording(webinar)"
                >
                  ▶ Смотреть запись
                </button>
                <button
                  *ngIf="!webinar.recording?.available"
                  class="btn-disabled"
                  disabled
                >
                  ⏳ Обработка...
                </button>
                <button
                  class="btn-icon"
                  (click)="downloadRecording(webinar)"
                  title="Скачать"
                  [disabled]="!webinar.recording?.available"
                >
                  ⬇️
                </button>
                <button
                  class="btn-icon"
                  (click)="shareRecording(webinar)"
                  title="Поделиться"
                  [disabled]="!webinar.recording?.available"
                >
                  🔗
                </button>
                <button
                  class="btn-icon"
                  (click)="viewParticipants(webinar)"
                  title="Участники"
                >
                  👥
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Participants Modal -->
        <div *ngIf="showParticipantsModal && selectedWebinar" class="modal-overlay" (click)="showParticipantsModal = false">
          <div class="modal" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <h3>Участники вебинара</h3>
              <button class="btn-close" (click)="showParticipantsModal = false">×</button>
            </div>
            <div class="modal-body">
              <div class="participants-table">
                <table>
                  <thead>
                    <tr>
                      <th>Участник</th>
                      <th>Email</th>
                      <th>Присоединился</th>
                      <th>Покинул</th>
                      <th>Длительность</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr *ngFor="let participant of selectedWebinar.participants">
                      <td>
                        <div class="participant-cell">
                          <div class="participant-avatar">
                            <img
                              *ngIf="participant.user.avatar"
                              [src]="participant.user.avatar"
                              [alt]="participant.user.firstName"
                            />
                            <span *ngIf="!participant.user.avatar">
                              {{ participant.user.firstName[0] }}{{ participant.user.lastName[0] }}
                            </span>
                          </div>
                          {{ participant.user.firstName }} {{ participant.user.lastName }}
                        </div>
                      </td>
                      <td>{{ participant.user.email }}</td>
                      <td>
                        {{ participant.joinedAt ? formatTime(participant.joinedAt) : '—' }}
                      </td>
                      <td>
                        {{ participant.leftAt ? formatTime(participant.leftAt) : '—' }}
                      </td>
                      <td>
                        {{ participant.duration ? formatDuration(participant.duration) : '—' }}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
            <div class="modal-footer">
              <button class="btn-secondary" (click)="exportParticipants()">
                📥 Экспорт CSV
              </button>
            </div>
          </div>
        </div>

        <!-- Video Player Modal -->
        <div *ngIf="showPlayerModal && recordingUrl" class="modal-overlay video-modal" (click)="closePlayer()">
          <div class="modal player-modal" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <h3>{{ selectedWebinar?.title }}</h3>
              <button class="btn-close" (click)="closePlayer()">×</button>
            </div>
            <div class="video-container">
              <video
                controls
                autoplay
                [src]="recordingUrl"
                class="video-player"
              ></video>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .webinar-history {
      padding: 40px 20px;
      background: #f5f7fa;
      min-height: 100vh;
    }

    .container {
      max-width: 1400px;
      margin: 0 auto;
    }

    .header {
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
      margin: 0;
    }

    .webinars-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(380px, 1fr));
      gap: 24px;
    }

    .webinar-card {
      background: white;
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      transition: transform 0.3s, box-shadow 0.3s;
    }

    .webinar-card:hover {
      transform: translateY(-4px);
      box-shadow: 0 8px 16px rgba(0,0,0,0.15);
    }

    .webinar-thumbnail {
      position: relative;
      width: 100%;
      height: 200px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      overflow: hidden;
      cursor: pointer;
    }

    .thumbnail-placeholder {
      width: 100%;
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .play-icon {
      width: 70px;
      height: 70px;
      background: rgba(255,255,255,0.9);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 2rem;
      color: #667eea;
    }

    .duration-badge {
      position: absolute;
      bottom: 12px;
      right: 12px;
      padding: 6px 12px;
      background: rgba(0,0,0,0.8);
      color: white;
      border-radius: 6px;
      font-size: 0.875rem;
      font-weight: 600;
    }

    .processing-overlay {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0,0,0,0.7);
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      color: white;
    }

    .processing-spinner {
      width: 40px;
      height: 40px;
      border: 3px solid rgba(255,255,255,0.3);
      border-top-color: white;
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin-bottom: 12px;
    }

    .webinar-content {
      padding: 24px;
    }

    .webinar-content h3 {
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

    .webinar-meta {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 12px;
      margin-bottom: 16px;
    }

    .meta-row {
      display: flex;
      align-items: center;
      gap: 8px;
      color: #666;
      font-size: 0.875rem;
    }

    .meta-icon {
      font-size: 1rem;
    }

    .webinar-stats {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 16px;
      margin-bottom: 20px;
      padding: 16px;
      background: #f8f9fa;
      border-radius: 8px;
    }

    .stat {
      text-align: center;
    }

    .stat-value {
      display: block;
      font-size: 1.5rem;
      font-weight: 700;
      color: #667eea;
      margin-bottom: 4px;
    }

    .stat-label {
      display: block;
      font-size: 0.75rem;
      color: #999;
    }

    .webinar-actions {
      display: flex;
      gap: 8px;
    }

    .btn-play {
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

    .btn-play:hover {
      background: #5568d3;
    }

    .btn-disabled {
      flex: 1;
      padding: 12px;
      background: #ccc;
      color: #666;
      border: none;
      border-radius: 8px;
      font-weight: 600;
      cursor: not-allowed;
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

    .btn-icon:hover:not(:disabled) {
      border-color: #667eea;
      background: #f0f4ff;
    }

    .btn-icon:disabled {
      opacity: 0.5;
      cursor: not-allowed;
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

    .modal-overlay.video-modal {
      background: rgba(0,0,0,0.9);
    }

    .modal {
      background: white;
      border-radius: 16px;
      max-width: 900px;
      width: 90%;
      max-height: 90vh;
      overflow-y: auto;
    }

    .modal.player-modal {
      max-width: 1200px;
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

    .participants-table {
      overflow-x: auto;
    }

    table {
      width: 100%;
      border-collapse: collapse;
    }

    thead {
      background: #f8f9fa;
    }

    th {
      padding: 12px;
      text-align: left;
      font-weight: 600;
      color: #555;
      border-bottom: 2px solid #e0e0e0;
    }

    td {
      padding: 12px;
      border-bottom: 1px solid #f0f0f0;
      color: #666;
    }

    .participant-cell {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .participant-avatar {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      background: #667eea;
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.75rem;
      font-weight: 600;
      overflow: hidden;
    }

    .participant-avatar img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .modal-footer {
      padding: 24px;
      border-top: 1px solid #f0f0f0;
      display: flex;
      justify-content: center;
    }

    .video-container {
      background: #000;
      aspect-ratio: 16 / 9;
    }

    .video-player {
      width: 100%;
      height: 100%;
    }

    button {
      transition: all 0.3s;
    }

    .btn-secondary {
      padding: 12px 32px;
      background: transparent;
      border: 2px solid #667eea;
      color: #667eea;
      border-radius: 8px;
      font-weight: 600;
      cursor: pointer;
    }

    .btn-secondary:hover {
      background: #f0f4ff;
    }

    @media (max-width: 768px) {
      .webinars-grid {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class WebinarHistoryComponent implements OnInit {
  private webinarService = inject(WebinarService);
  private router = inject(Router);

  webinars = signal<Webinar[]>([]);
  loading = signal(true);

  showParticipantsModal = false;
  showPlayerModal = false;
  selectedWebinar: Webinar | null = null;
  recordingUrl: string | null = null;

  ngOnInit() {
    this.loadHistory();
  }

  loadHistory() {
    this.loading.set(true);
    this.webinarService.getWebinars().subscribe({
      next: (data) => {
        const endedWebinars = data.webinars.filter(w => w.status === 'ended');
        this.webinars.set(endedWebinars);
        this.loading.set(false);
      }
    });
  }

  getAttendanceCount(webinar: Webinar): number {
    return webinar.participants.filter(p => p.status === 'joined').length;
  }

  getAttendanceRate(webinar: Webinar): number {
    if (webinar.participants.length === 0) return 0;
    const attended = this.getAttendanceCount(webinar);
    return Math.round((attended / webinar.participants.length) * 100);
  }

  getAverageDuration(webinar: Webinar): string {
    const durations = webinar.participants
      .filter(p => p.duration)
      .map(p => p.duration!);

    if (durations.length === 0) return '—';

    const avg = durations.reduce((a, b) => a + b, 0) / durations.length;
    return this.formatDuration(avg);
  }

  playRecording(webinar: Webinar) {
    if (!webinar.recording?.available) return;

    this.selectedWebinar = webinar;
    this.webinarService.getRecording(webinar.id).subscribe({
      next: (data) => {
        this.recordingUrl = data.url;
        this.showPlayerModal = true;
      },
      error: () => alert('Не удалось загрузить запись')
    });
  }

  closePlayer() {
    this.showPlayerModal = false;
    this.recordingUrl = null;
  }

  downloadRecording(webinar: Webinar) {
    if (!webinar.recording?.available) return;
    this.webinarService.getRecording(webinar.id).subscribe({
      next: (data) => {
        window.open(data.url, '_blank');
      }
    });
  }

  shareRecording(webinar: Webinar) {
    if (!webinar.recording?.available) return;
    const url = `${window.location.origin}/webinars/recording/${webinar.id}`;
    navigator.clipboard.writeText(url);
    alert('Ссылка скопирована в буфер обмена!');
  }

  viewParticipants(webinar: Webinar) {
    this.selectedWebinar = webinar;
    this.showParticipantsModal = true;
  }

  exportParticipants() {
    if (!this.selectedWebinar) return;

    const csv = 'Участник,Email,Присоединился,Покинул,Длительность\n' +
      this.selectedWebinar.participants.map(p =>
        `"${p.user.firstName} ${p.user.lastName}","${p.user.email}",` +
        `"${p.joinedAt || '—'}","${p.leftAt || '—'}","${p.duration || '—'}"`
      ).join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `participants-${this.selectedWebinar.id}.csv`;
    a.click();
  }

  formatDuration(seconds: number): string {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    if (h > 0) return `${h}ч ${m}м`;
    return `${m} мин`;
  }

  formatDate(date: Date): string {
    return new Date(date).toLocaleDateString('ru-RU');
  }

  formatTime(date: Date): string {
    return new Date(date).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
  }
}
