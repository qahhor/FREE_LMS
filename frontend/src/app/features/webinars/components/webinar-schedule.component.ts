import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { WebinarService } from '../services/webinar.service';
import { Webinar, CreateWebinarRequest, WebinarCalendarEvent, WebinarStats } from '../models/webinar.models';

@Component({
  selector: 'app-webinar-schedule',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="webinar-schedule">
      <div class="container">
        <!-- Header -->
        <div class="header">
          <div>
            <h1>Вебинары</h1>
            <p class="subtitle">Планируйте и проводите онлайн-сессии</p>
          </div>
          <button class="btn-primary" (click)="showCreateModal = true">
            + Запланировать вебинар
          </button>
        </div>

        <!-- Stats Cards -->
        <div *ngIf="stats()" class="stats-grid">
          <div class="stat-card">
            <div class="stat-icon">📅</div>
            <div>
              <p class="stat-value">{{ stats()!.upcomingWebinars }}</p>
              <p class="stat-label">Предстоящих</p>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-icon">✅</div>
            <div>
              <p class="stat-value">{{ stats()!.completedWebinars }}</p>
              <p class="stat-label">Завершенных</p>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-icon">👥</div>
            <div>
              <p class="stat-value">{{ stats()!.totalParticipants }}</p>
              <p class="stat-label">Всего участников</p>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-icon">📊</div>
            <div>
              <p class="stat-value">{{ stats()!.averageAttendance }}%</p>
              <p class="stat-label">Средняя посещаемость</p>
            </div>
          </div>
        </div>

        <!-- View Toggle -->
        <div class="view-controls">
          <div class="view-toggle">
            <button
              [class.active]="viewMode === 'list'"
              (click)="viewMode = 'list'"
            >
              📋 Список
            </button>
            <button
              [class.active]="viewMode === 'calendar'"
              (click)="viewMode = 'calendar'"
            >
              📅 Календарь
            </button>
          </div>

          <div class="filters">
            <select [(ngModel)]="statusFilter" (ngModelChange)="filterWebinars()">
              <option value="">Все статусы</option>
              <option value="scheduled">Запланированные</option>
              <option value="live">В прямом эфире</option>
              <option value="ended">Завершенные</option>
            </select>
          </div>
        </div>

        <!-- List View -->
        <div *ngIf="viewMode === 'list'" class="webinars-list">
          <div *ngIf="loading()" class="loading">
            <div class="spinner"></div>
            <p>Загрузка вебинаров...</p>
          </div>

          <div *ngIf="!loading() && filteredWebinars().length === 0" class="empty-state">
            <div class="empty-icon">🎥</div>
            <h2>Нет запланированных вебинаров</h2>
            <p>Создайте первый вебинар для начала работы</p>
          </div>

          <div
            *ngFor="let webinar of filteredWebinars()"
            class="webinar-card"
            [class.live]="webinar.status === 'live'"
          >
            <div class="webinar-header">
              <div class="webinar-time">
                <div class="date">{{ formatDate(webinar.scheduledAt) }}</div>
                <div class="time">{{ formatTime(webinar.scheduledAt) }}</div>
                <div class="duration">{{ webinar.duration }} мин</div>
              </div>

              <span class="status-badge" [class]="webinar.status">
                {{ getStatusLabel(webinar.status) }}
              </span>
            </div>

            <div class="webinar-content">
              <h3>{{ webinar.title }}</h3>
              <p class="description">{{ webinar.description }}</p>

              <div class="webinar-meta">
                <div class="instructor">
                  <div class="avatar">
                    <img
                      *ngIf="webinar.instructor.avatar"
                      [src]="webinar.instructor.avatar"
                      [alt]="webinar.instructor.firstName"
                    />
                    <span *ngIf="!webinar.instructor.avatar">
                      {{ webinar.instructor.firstName[0] }}{{ webinar.instructor.lastName[0] }}
                    </span>
                  </div>
                  <div>
                    <div class="instructor-name">
                      {{ webinar.instructor.firstName }} {{ webinar.instructor.lastName }}
                    </div>
                    <div class="instructor-role">Ведущий</div>
                  </div>
                </div>

                <div class="participants-count">
                  <span class="icon">👥</span>
                  {{ webinar.participants.length }}
                  <span *ngIf="webinar.maxParticipants">
                    / {{ webinar.maxParticipants }}
                  </span>
                  участников
                </div>

                <div class="provider-badge">
                  {{ getProviderLabel(webinar.provider) }}
                </div>
              </div>
            </div>

            <div class="webinar-actions">
              <button
                *ngIf="webinar.status === 'scheduled'"
                class="btn-primary"
                (click)="joinWebinar(webinar)"
              >
                Присоединиться
              </button>
              <button
                *ngIf="webinar.status === 'live'"
                class="btn-live"
                (click)="joinWebinar(webinar)"
              >
                🔴 Присоединиться к эфиру
              </button>
              <button
                *ngIf="webinar.status === 'ended' && webinar.recording?.available"
                class="btn-secondary"
                (click)="viewRecording(webinar)"
              >
                📹 Смотреть запись
              </button>
              <button
                class="btn-icon"
                (click)="editWebinar(webinar)"
                title="Редактировать"
              >
                ✏️
              </button>
              <button
                class="btn-icon danger"
                (click)="deleteWebinar(webinar)"
                title="Удалить"
              >
                🗑️
              </button>
            </div>
          </div>
        </div>

        <!-- Calendar View -->
        <div *ngIf="viewMode === 'calendar'" class="calendar-view">
          <div class="calendar-header">
            <button (click)="previousMonth()">←</button>
            <h2>{{ currentMonthName() }} {{ currentYear() }}</h2>
            <button (click)="nextMonth()">→</button>
          </div>

          <div class="calendar-grid">
            <div class="calendar-day-header" *ngFor="let day of weekDays">
              {{ day }}
            </div>
            <div
              *ngFor="let day of calendarDays()"
              class="calendar-day"
              [class.other-month]="!day.isCurrentMonth"
              [class.today]="day.isToday"
            >
              <div class="day-number">{{ day.number }}</div>
              <div class="day-events">
                <div
                  *ngFor="let event of day.events"
                  class="event"
                  [class]="event.status"
                  (click)="openWebinarFromCalendar(event.id)"
                >
                  <span class="event-time">{{ formatTime(event.start) }}</span>
                  <span class="event-title">{{ event.title }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Create Webinar Modal -->
        <div *ngIf="showCreateModal" class="modal-overlay" (click)="showCreateModal = false">
          <div class="modal" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <h3>Запланировать вебинар</h3>
              <button class="btn-close" (click)="showCreateModal = false">×</button>
            </div>
            <div class="modal-body">
              <div class="form-group">
                <label>Название *</label>
                <input
                  type="text"
                  [(ngModel)]="newWebinar.title"
                  placeholder="Введите название вебинара"
                />
              </div>

              <div class="form-group">
                <label>Описание</label>
                <textarea
                  [(ngModel)]="newWebinar.description"
                  rows="3"
                  placeholder="Краткое описание темы вебинара"
                ></textarea>
              </div>

              <div class="form-row">
                <div class="form-group">
                  <label>Дата *</label>
                  <input type="date" [(ngModel)]="newWebinar.date" />
                </div>
                <div class="form-group">
                  <label>Время *</label>
                  <input type="time" [(ngModel)]="newWebinar.time" />
                </div>
              </div>

              <div class="form-row">
                <div class="form-group">
                  <label>Длительность (мин) *</label>
                  <input
                    type="number"
                    [(ngModel)]="newWebinar.duration"
                    min="15"
                    max="480"
                  />
                </div>
                <div class="form-group">
                  <label>Макс. участников</label>
                  <input
                    type="number"
                    [(ngModel)]="newWebinar.maxParticipants"
                    min="1"
                  />
                </div>
              </div>

              <div class="form-group">
                <label>Платформа *</label>
                <select [(ngModel)]="newWebinar.provider">
                  <option value="zoom">Zoom</option>
                  <option value="jitsi">Jitsi Meet</option>
                  <option value="custom">Пользовательская</option>
                </select>
              </div>
            </div>
            <div class="modal-footer">
              <button class="btn-secondary" (click)="showCreateModal = false">
                Отмена
              </button>
              <button
                class="btn-primary"
                (click)="createWebinar()"
                [disabled]="creating()"
              >
                {{ creating() ? 'Создание...' : 'Создать вебинар' }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .webinar-schedule { padding: 40px 20px; background: #f5f7fa; min-height: 100vh; }
    .container { max-width: 1400px; margin: 0 auto; }
    .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 40px; }
    h1 { font-size: 2rem; color: #333; margin: 0 0 8px 0; }
    .subtitle { color: #666; margin: 0; }

    .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 20px; margin-bottom: 30px; }
    .stat-card { background: white; padding: 24px; border-radius: 12px; display: flex; align-items: center; gap: 20px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
    .stat-icon { font-size: 2.5rem; }
    .stat-value { font-size: 2rem; font-weight: 700; color: #333; margin: 0 0 4px 0; }
    .stat-label { color: #999; font-size: 0.875rem; margin: 0; }

    .view-controls { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
    .view-toggle { display: flex; gap: 8px; }
    .view-toggle button { padding: 10px 20px; border: 2px solid #ddd; background: white; border-radius: 8px; cursor: pointer; font-weight: 600; transition: all 0.3s; }
    .view-toggle button.active { border-color: #667eea; background: #667eea; color: white; }
    .filters select { padding: 10px 16px; border: 1px solid #ddd; border-radius: 8px; background: white; cursor: pointer; }

    .loading { text-align: center; padding: 60px 20px; }
    .spinner { width: 50px; height: 50px; border: 4px solid #f3f3f3; border-top-color: #667eea; border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto 20px; }
    @keyframes spin { to { transform: rotate(360deg); } }

    .empty-state { text-align: center; padding: 80px 20px; background: white; border-radius: 16px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
    .empty-icon { font-size: 5rem; margin-bottom: 20px; }
    .empty-state h2 { color: #333; margin: 0 0 8px 0; }
    .empty-state p { color: #666; margin: 0; }

    .webinars-list { display: flex; flex-direction: column; gap: 20px; }
    .webinar-card { background: white; border-radius: 16px; padding: 24px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); display: grid; grid-template-columns: auto 1fr auto; gap: 24px; align-items: center; }
    .webinar-card.live { border: 3px solid #f44336; box-shadow: 0 0 20px rgba(244, 67, 54, 0.3); }

    .webinar-header { text-align: center; }
    .webinar-time .date { font-size: 1.5rem; font-weight: 700; color: #333; margin-bottom: 4px; }
    .webinar-time .time { font-size: 1.125rem; color: #667eea; font-weight: 600; margin-bottom: 4px; }
    .webinar-time .duration { font-size: 0.875rem; color: #999; }
    .status-badge { display: inline-block; padding: 6px 16px; border-radius: 20px; font-size: 0.875rem; font-weight: 600; margin-top: 12px; }
    .status-badge.scheduled { background: #e3f2fd; color: #1976d2; }
    .status-badge.live { background: #ffebee; color: #f44336; }
    .status-badge.ended { background: #f5f5f5; color: #666; }

    .webinar-content { flex: 1; }
    .webinar-content h3 { margin: 0 0 8px 0; color: #333; font-size: 1.25rem; }
    .description { color: #666; margin: 0 0 16px 0; font-size: 0.875rem; }
    .webinar-meta { display: flex; align-items: center; gap: 24px; flex-wrap: wrap; }
    .instructor { display: flex; align-items: center; gap: 12px; }
    .avatar { width: 40px; height: 40px; border-radius: 50%; background: #667eea; color: white; display: flex; align-items: center; justify-content: center; font-weight: 600; overflow: hidden; }
    .avatar img { width: 100%; height: 100%; object-fit: cover; }
    .instructor-name { font-weight: 600; color: #333; }
    .instructor-role { font-size: 0.875rem; color: #999; }
    .participants-count { color: #666; font-size: 0.875rem; display: flex; align-items: center; gap: 6px; }
    .provider-badge { padding: 4px 12px; background: #f8f9fa; border-radius: 12px; font-size: 0.875rem; color: #666; }

    .webinar-actions { display: flex; flex-direction: column; gap: 8px; }
    .btn-live { padding: 10px 20px; background: #f44336; color: white; border: none; border-radius: 8px; font-weight: 600; cursor: pointer; animation: pulse 2s infinite; }
    @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.7; } }

    .calendar-view { background: white; border-radius: 16px; padding: 30px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
    .calendar-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
    .calendar-header h2 { margin: 0; color: #333; }
    .calendar-header button { width: 40px; height: 40px; border: none; background: #667eea; color: white; border-radius: 8px; cursor: pointer; font-size: 1.25rem; }
    .calendar-grid { display: grid; grid-template-columns: repeat(7, 1fr); gap: 1px; background: #e0e0e0; border: 1px solid #e0e0e0; }
    .calendar-day-header { background: #f8f9fa; padding: 12px; text-align: center; font-weight: 600; color: #666; font-size: 0.875rem; }
    .calendar-day { background: white; min-height: 100px; padding: 8px; }
    .calendar-day.other-month { background: #fafafa; }
    .calendar-day.today { background: #f0f4ff; }
    .day-number { font-weight: 600; color: #333; margin-bottom: 8px; }
    .day-events { display: flex; flex-direction: column; gap: 4px; }
    .event { padding: 4px 8px; border-radius: 4px; font-size: 0.75rem; cursor: pointer; transition: transform 0.2s; }
    .event:hover { transform: scale(1.05); }
    .event.scheduled { background: #e3f2fd; color: #1976d2; }
    .event.live { background: #ffebee; color: #f44336; }
    .event-time { font-weight: 600; margin-right: 4px; }

    .modal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 1000; }
    .modal { background: white; border-radius: 16px; max-width: 600px; width: 90%; max-height: 90vh; overflow-y: auto; }
    .modal-header { padding: 24px; border-bottom: 1px solid #f0f0f0; display: flex; justify-content: space-between; align-items: center; }
    .modal-body { padding: 24px; }
    .modal-footer { padding: 24px; border-top: 1px solid #f0f0f0; display: flex; gap: 12px; justify-content: flex-end; }
    .form-group { margin-bottom: 20px; }
    .form-group label { display: block; margin-bottom: 8px; color: #555; font-weight: 500; }
    .form-group input, .form-group textarea, .form-group select { width: 100%; padding: 12px; border: 1px solid #ddd; border-radius: 8px; font-size: 1rem; }
    .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }

    button { padding: 12px 24px; border: none; border-radius: 8px; font-weight: 600; cursor: pointer; transition: all 0.3s; }
    .btn-primary { background: #667eea; color: white; }
    .btn-primary:hover { background: #5568d3; }
    .btn-primary:disabled { background: #ccc; cursor: not-allowed; }
    .btn-secondary { background: transparent; border: 2px solid #667eea; color: #667eea; }
    .btn-icon { padding: 8px; background: transparent; border: 1px solid #ddd; font-size: 1.125rem; }
    .btn-icon.danger:hover { border-color: #f44336; color: #f44336; }
    .btn-close { background: none; font-size: 2rem; color: #999; padding: 0; width: 32px; height: 32px; }
  `]
})
export class WebinarScheduleComponent implements OnInit {
  private webinarService = inject(WebinarService);
  private router = inject(Router);

  webinars = signal<Webinar[]>([]);
  filteredWebinars = signal<Webinar[]>([]);
  stats = signal<WebinarStats | null>(null);
  loading = signal(true);
  creating = signal(false);

  showCreateModal = false;
  viewMode: 'list' | 'calendar' = 'list';
  statusFilter = '';

  currentMonth = new Date().getMonth();
  currentYear = new Date().getFullYear();
  weekDays = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];

  calendarDays = signal<any[]>([]);

  newWebinar = {
    title: '',
    description: '',
    date: '',
    time: '',
    duration: 60,
    provider: 'zoom' as 'zoom' | 'jitsi' | 'custom',
    maxParticipants: null as number | null
  };

  ngOnInit() {
    this.loadWebinars();
    this.loadStats();
    this.loadCalendar();
  }

  loadWebinars() {
    this.loading.set(true);
    this.webinarService.getWebinars().subscribe({
      next: (data) => {
        this.webinars.set(data.webinars);
        this.filterWebinars();
        this.loading.set(false);
      }
    });
  }

  loadStats() {
    this.webinarService.getStats().subscribe({
      next: (data) => this.stats.set(data)
    });
  }

  loadCalendar() {
    const start = new Date(this.currentYear, this.currentMonth, 1);
    const end = new Date(this.currentYear, this.currentMonth + 1, 0);

    this.webinarService.getCalendarEvents(start, end).subscribe({
      next: (data) => {
        // Generate calendar days with events
        const days = this.generateCalendarDays(data.events);
        this.calendarDays.set(days);
      }
    });
  }

  generateCalendarDays(events: WebinarCalendarEvent[]): any[] {
    const days = [];
    const firstDay = new Date(this.currentYear, this.currentMonth, 1);
    const lastDay = new Date(this.currentYear, this.currentMonth + 1, 0);
    const prevMonthDays = new Date(this.currentYear, this.currentMonth, 0).getDate();

    // Previous month days
    const firstDayOfWeek = firstDay.getDay() || 7;
    for (let i = firstDayOfWeek - 1; i > 0; i--) {
      days.push({
        number: prevMonthDays - i + 1,
        isCurrentMonth: false,
        isToday: false,
        events: []
      });
    }

    // Current month days
    for (let i = 1; i <= lastDay.getDate(); i++) {
      const date = new Date(this.currentYear, this.currentMonth, i);
      const today = new Date();
      const isToday = date.toDateString() === today.toDateString();

      const dayEvents = events.filter(e => {
        const eventDate = new Date(e.start);
        return eventDate.getDate() === i &&
               eventDate.getMonth() === this.currentMonth &&
               eventDate.getFullYear() === this.currentYear;
      });

      days.push({
        number: i,
        isCurrentMonth: true,
        isToday,
        events: dayEvents
      });
    }

    // Next month days
    const remainingDays = 42 - days.length;
    for (let i = 1; i <= remainingDays; i++) {
      days.push({
        number: i,
        isCurrentMonth: false,
        isToday: false,
        events: []
      });
    }

    return days;
  }

  filterWebinars() {
    let filtered = this.webinars();
    if (this.statusFilter) {
      filtered = filtered.filter(w => w.status === this.statusFilter);
    }
    this.filteredWebinars.set(filtered);
  }

  createWebinar() {
    if (!this.newWebinar.title || !this.newWebinar.date || !this.newWebinar.time) {
      alert('Заполните обязательные поля');
      return;
    }

    this.creating.set(true);

    const scheduledAt = new Date(`${this.newWebinar.date}T${this.newWebinar.time}`);

    const request: CreateWebinarRequest = {
      title: this.newWebinar.title,
      description: this.newWebinar.description || undefined,
      scheduledAt,
      duration: this.newWebinar.duration,
      provider: this.newWebinar.provider,
      maxParticipants: this.newWebinar.maxParticipants || undefined
    };

    this.webinarService.createWebinar(request).subscribe({
      next: () => {
        this.creating.set(false);
        this.showCreateModal = false;
        this.loadWebinars();
        this.loadStats();
        alert('Вебинар создан!');
      },
      error: () => {
        this.creating.set(false);
        alert('Ошибка при создании вебинара');
      }
    });
  }

  joinWebinar(webinar: Webinar) {
    this.router.navigate(['/webinars/room', webinar.id]);
  }

  editWebinar(webinar: Webinar) {
    console.log('Edit:', webinar);
  }

  deleteWebinar(webinar: Webinar) {
    if (confirm(`Удалить вебинар "${webinar.title}"?`)) {
      this.webinarService.deleteWebinar(webinar.id).subscribe({
        next: () => {
          this.loadWebinars();
          alert('Вебинар удален');
        }
      });
    }
  }

  viewRecording(webinar: Webinar) {
    this.router.navigate(['/webinars/recording', webinar.id]);
  }

  openWebinarFromCalendar(id: number) {
    this.router.navigate(['/webinars/room', id]);
  }

  previousMonth() {
    if (this.currentMonth === 0) {
      this.currentMonth = 11;
      this.currentYear--;
    } else {
      this.currentMonth--;
    }
    this.loadCalendar();
  }

  nextMonth() {
    if (this.currentMonth === 11) {
      this.currentMonth = 0;
      this.currentYear++;
    } else {
      this.currentMonth++;
    }
    this.loadCalendar();
  }

  currentMonthName(): string {
    const months = ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
                    'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'];
    return months[this.currentMonth];
  }

  formatDate(date: Date): string {
    return new Date(date).toLocaleDateString('ru-RU');
  }

  formatTime(date: Date): string {
    return new Date(date).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
  }

  getStatusLabel(status: string): string {
    const labels: any = {
      'scheduled': 'Запланирован',
      'live': 'В эфире',
      'ended': 'Завершен',
      'cancelled': 'Отменен'
    };
    return labels[status] || status;
  }

  getProviderLabel(provider: string): string {
    const labels: any = {
      'zoom': 'Zoom',
      'jitsi': 'Jitsi Meet',
      'custom': 'Пользовательская'
    };
    return labels[provider] || provider;
  }
}
