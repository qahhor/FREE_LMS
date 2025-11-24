import { Component, OnInit, OnDestroy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { WebinarService } from '../services/webinar.service';
import { Webinar, WebinarParticipant } from '../models/webinar.models';

interface ChatMessage {
  id: string;
  user: { firstName: string; lastName: string; avatar: string | null };
  message: string;
  timestamp: Date;
}

@Component({
  selector: 'app-webinar-room',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="webinar-room">
      <!-- Header -->
      <div class="room-header">
        <div class="header-left">
          <button class="btn-back" (click)="leaveRoom()">← Выйти</button>
          <div class="webinar-info">
            <h2>{{ webinar()?.title }}</h2>
            <span class="live-badge" *ngIf="webinar()?.status === 'live'">
              🔴 В эфире
            </span>
          </div>
        </div>
        <div class="header-right">
          <span class="participants-count">
            👥 {{ participants().length }} участников
          </span>
          <span class="duration">{{ formatDuration(elapsed()) }}</span>
        </div>
      </div>

      <!-- Main Content -->
      <div class="room-content">
        <!-- Video Area -->
        <div class="video-area">
          <iframe
            *ngIf="joinUrl()"
            [src]="joinUrl()"
            class="video-frame"
            allowfullscreen
            allow="camera; microphone; fullscreen; display-capture"
          ></iframe>

          <div *ngIf="!joinUrl()" class="loading-video">
            <div class="spinner"></div>
            <p>Подключение к вебинару...</p>
          </div>

          <!-- Video Controls -->
          <div class="video-controls">
            <button
              class="control-btn"
              [class.active]="isMuted"
              (click)="toggleMute()"
              title="Микрофон"
            >
              {{ isMuted ? '🎤' : '🔇' }}
            </button>
            <button
              class="control-btn"
              [class.active]="isCameraOff"
              (click)="toggleCamera()"
              title="Камера"
            >
              {{ isCameraOff ? '📹' : '📷' }}
            </button>
            <button
              class="control-btn"
              (click)="toggleScreenShare()"
              title="Демонстрация экрана"
            >
              🖥️
            </button>
            <button
              class="control-btn danger"
              (click)="leaveRoom()"
              title="Завершить"
            >
              📞
            </button>
          </div>
        </div>

        <!-- Sidebar -->
        <div class="sidebar" [class.collapsed]="sidebarCollapsed">
          <div class="sidebar-tabs">
            <button
              [class.active]="sidebarTab === 'chat'"
              (click)="sidebarTab = 'chat'"
            >
              💬 Чат
            </button>
            <button
              [class.active]="sidebarTab === 'participants'"
              (click)="sidebarTab = 'participants'"
            >
              👥 Участники
            </button>
          </div>

          <!-- Chat Tab -->
          <div *ngIf="sidebarTab === 'chat'" class="chat-container">
            <div class="messages" #messagesContainer>
              <div
                *ngFor="let msg of chatMessages"
                class="message"
              >
                <div class="message-avatar">
                  <img
                    *ngIf="msg.user.avatar"
                    [src]="msg.user.avatar"
                    [alt]="msg.user.firstName"
                  />
                  <span *ngIf="!msg.user.avatar">
                    {{ msg.user.firstName[0] }}{{ msg.user.lastName[0] }}
                  </span>
                </div>
                <div class="message-content">
                  <div class="message-header">
                    <span class="message-author">
                      {{ msg.user.firstName }} {{ msg.user.lastName }}
                    </span>
                    <span class="message-time">
                      {{ formatTime(msg.timestamp) }}
                    </span>
                  </div>
                  <div class="message-text">{{ msg.message }}</div>
                </div>
              </div>
            </div>

            <div class="chat-input">
              <input
                type="text"
                [(ngModel)]="newMessage"
                (keyup.enter)="sendMessage()"
                placeholder="Напишите сообщение..."
              />
              <button
                (click)="sendMessage()"
                [disabled]="!newMessage.trim()"
              >
                Отправить
              </button>
            </div>
          </div>

          <!-- Participants Tab -->
          <div *ngIf="sidebarTab === 'participants'" class="participants-list">
            <div
              *ngFor="let participant of participants()"
              class="participant"
            >
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
              <div class="participant-info">
                <div class="participant-name">
                  {{ participant.user.firstName }} {{ participant.user.lastName }}
                </div>
                <div class="participant-status">
                  <span
                    class="status-dot"
                    [class.online]="participant.status === 'joined'"
                  ></span>
                  {{ getParticipantStatusLabel(participant.status) }}
                </div>
              </div>
            </div>
          </div>

          <button class="sidebar-toggle" (click)="sidebarCollapsed = !sidebarCollapsed">
            {{ sidebarCollapsed ? '→' : '←' }}
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .webinar-room {
      display: flex;
      flex-direction: column;
      height: 100vh;
      background: #1a1a1a;
    }

    .room-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 16px 24px;
      background: #2c2c2c;
      border-bottom: 1px solid #3c3c3c;
    }

    .header-left {
      display: flex;
      align-items: center;
      gap: 20px;
    }

    .btn-back {
      padding: 8px 16px;
      background: transparent;
      border: 1px solid #667eea;
      color: #667eea;
      border-radius: 8px;
      cursor: pointer;
      font-weight: 600;
    }

    .webinar-info {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .webinar-info h2 {
      margin: 0;
      color: white;
      font-size: 1.25rem;
    }

    .live-badge {
      padding: 6px 12px;
      background: #f44336;
      color: white;
      border-radius: 16px;
      font-size: 0.875rem;
      font-weight: 600;
      animation: pulse 2s infinite;
    }

    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.7; }
    }

    .header-right {
      display: flex;
      align-items: center;
      gap: 24px;
      color: white;
    }

    .participants-count, .duration {
      font-size: 0.875rem;
      color: #ccc;
    }

    .room-content {
      flex: 1;
      display: flex;
      overflow: hidden;
    }

    .video-area {
      flex: 1;
      position: relative;
      background: #000;
    }

    .video-frame {
      width: 100%;
      height: 100%;
      border: none;
    }

    .loading-video {
      width: 100%;
      height: 100%;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      color: white;
    }

    .spinner {
      width: 60px;
      height: 60px;
      border: 4px solid rgba(255,255,255,0.1);
      border-top-color: white;
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin-bottom: 20px;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    .video-controls {
      position: absolute;
      bottom: 20px;
      left: 50%;
      transform: translateX(-50%);
      display: flex;
      gap: 12px;
      padding: 16px;
      background: rgba(0,0,0,0.7);
      border-radius: 50px;
      backdrop-filter: blur(10px);
    }

    .control-btn {
      width: 56px;
      height: 56px;
      border-radius: 50%;
      border: none;
      background: #3c3c3c;
      color: white;
      font-size: 1.5rem;
      cursor: pointer;
      transition: all 0.3s;
    }

    .control-btn:hover {
      background: #4c4c4c;
      transform: scale(1.1);
    }

    .control-btn.active {
      background: #667eea;
    }

    .control-btn.danger {
      background: #f44336;
    }

    .sidebar {
      width: 350px;
      background: #2c2c2c;
      border-left: 1px solid #3c3c3c;
      display: flex;
      flex-direction: column;
      transition: width 0.3s;
      position: relative;
    }

    .sidebar.collapsed {
      width: 0;
      overflow: hidden;
    }

    .sidebar-tabs {
      display: flex;
      border-bottom: 1px solid #3c3c3c;
    }

    .sidebar-tabs button {
      flex: 1;
      padding: 16px;
      background: transparent;
      border: none;
      color: #ccc;
      cursor: pointer;
      border-bottom: 3px solid transparent;
      transition: all 0.3s;
    }

    .sidebar-tabs button.active {
      color: white;
      border-bottom-color: #667eea;
    }

    .chat-container {
      flex: 1;
      display: flex;
      flex-direction: column;
    }

    .messages {
      flex: 1;
      overflow-y: auto;
      padding: 16px;
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .message {
      display: flex;
      gap: 12px;
    }

    .message-avatar {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      background: #667eea;
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.875rem;
      font-weight: 600;
      flex-shrink: 0;
      overflow: hidden;
    }

    .message-avatar img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .message-content {
      flex: 1;
    }

    .message-header {
      display: flex;
      justify-content: space-between;
      margin-bottom: 4px;
    }

    .message-author {
      font-weight: 600;
      color: white;
      font-size: 0.875rem;
    }

    .message-time {
      font-size: 0.75rem;
      color: #999;
    }

    .message-text {
      color: #ccc;
      font-size: 0.875rem;
      line-height: 1.5;
    }

    .chat-input {
      padding: 16px;
      border-top: 1px solid #3c3c3c;
      display: flex;
      gap: 8px;
    }

    .chat-input input {
      flex: 1;
      padding: 12px;
      background: #3c3c3c;
      border: 1px solid #4c4c4c;
      border-radius: 8px;
      color: white;
      font-size: 0.875rem;
    }

    .chat-input button {
      padding: 12px 24px;
      background: #667eea;
      color: white;
      border: none;
      border-radius: 8px;
      cursor: pointer;
      font-weight: 600;
    }

    .chat-input button:disabled {
      background: #4c4c4c;
      cursor: not-allowed;
    }

    .participants-list {
      flex: 1;
      overflow-y: auto;
      padding: 16px;
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .participant {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px;
      background: #3c3c3c;
      border-radius: 8px;
    }

    .participant-avatar {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      background: #667eea;
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 600;
      overflow: hidden;
    }

    .participant-avatar img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .participant-info {
      flex: 1;
    }

    .participant-name {
      font-weight: 600;
      color: white;
      font-size: 0.875rem;
      margin-bottom: 4px;
    }

    .participant-status {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 0.75rem;
      color: #999;
    }

    .status-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: #666;
    }

    .status-dot.online {
      background: #4caf50;
    }

    .sidebar-toggle {
      position: absolute;
      top: 50%;
      left: -16px;
      transform: translateY(-50%);
      width: 32px;
      height: 64px;
      background: #3c3c3c;
      border: 1px solid #4c4c4c;
      border-radius: 8px 0 0 8px;
      color: white;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.25rem;
    }
  `]
})
export class WebinarRoomComponent implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private webinarService = inject(WebinarService);
  private sanitizer = inject(DomSanitizer);

  webinar = signal<Webinar | null>(null);
  participants = signal<WebinarParticipant[]>([]);
  joinUrl = signal<SafeResourceUrl | null>(null);
  elapsed = signal(0);

  chatMessages: ChatMessage[] = [];
  newMessage = '';
  sidebarTab: 'chat' | 'participants' = 'chat';
  sidebarCollapsed = false;

  isMuted = true;
  isCameraOff = true;
  isScreenSharing = false;

  private elapsedInterval: any;

  ngOnInit() {
    const webinarId = this.route.snapshot.params['id'];
    this.loadWebinar(webinarId);
    this.joinWebinarRoom(webinarId);
    this.startElapsedTimer();
  }

  ngOnDestroy() {
    if (this.elapsedInterval) {
      clearInterval(this.elapsedInterval);
    }
    const webinarId = this.route.snapshot.params['id'];
    this.webinarService.leaveWebinar(webinarId).subscribe();
  }

  loadWebinar(id: number) {
    this.webinarService.getWebinar(id).subscribe({
      next: (webinar) => {
        this.webinar.set(webinar);
        this.participants.set(webinar.participants);
      }
    });
  }

  joinWebinarRoom(id: number) {
    this.webinarService.joinWebinar(id).subscribe({
      next: (response) => {
        this.joinUrl.set(this.sanitizer.bypassSecurityTrustResourceUrl(response.joinUrl));
      },
      error: () => alert('Не удалось подключиться к вебинару')
    });
  }

  startElapsedTimer() {
    this.elapsedInterval = setInterval(() => {
      this.elapsed.set(this.elapsed() + 1);
    }, 1000);
  }

  sendMessage() {
    if (!this.newMessage.trim()) return;

    const message: ChatMessage = {
      id: Date.now().toString(),
      user: {
        firstName: 'Текущий',
        lastName: 'Пользователь',
        avatar: null
      },
      message: this.newMessage,
      timestamp: new Date()
    };

    this.chatMessages.push(message);
    this.newMessage = '';
  }

  toggleMute() {
    this.isMuted = !this.isMuted;
  }

  toggleCamera() {
    this.isCameraOff = !this.isCameraOff;
  }

  toggleScreenShare() {
    this.isScreenSharing = !this.isScreenSharing;
  }

  leaveRoom() {
    if (confirm('Вы уверены, что хотите покинуть вебинар?')) {
      this.router.navigate(['/webinars']);
    }
  }

  formatDuration(seconds: number): string {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }

  formatTime(date: Date): string {
    return new Date(date).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
  }

  getParticipantStatusLabel(status: string): string {
    const labels: any = {
      'registered': 'Зарегистрирован',
      'joined': 'В эфире',
      'left': 'Покинул',
      'absent': 'Отсутствует'
    };
    return labels[status] || status;
  }
}
