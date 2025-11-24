import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

interface Lesson {
  id: number;
  title: string;
  description?: string;
  type: string;
  content?: string;
  videoUrl?: string;
  fileUrl?: string;
  fileType?: string;
  fileSize?: number;
  downloadable: boolean;
  duration: number;
}

/**
 * Universal lesson content viewer supporting multiple content types
 */
@Component({
  selector: 'app-lesson-viewer',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="lesson-viewer" *ngIf="lesson">
      <div class="lesson-header">
        <h2>{{ lesson.title }}</h2>
        <p *ngIf="lesson.description" class="description">{{ lesson.description }}</p>
        <div class="meta">
          <span class="type-badge" [class]="lesson.type">{{ formatType(lesson.type) }}</span>
          <span *ngIf="lesson.duration" class="duration">⏱️ {{ formatDuration(lesson.duration) }}</span>
        </div>
      </div>

      <div class="lesson-content">
        <!-- VIDEO -->
        <div *ngIf="lesson.type === 'video'" class="video-container">
          <app-video-player [videoId]="lesson.id"></app-video-player>
        </div>

        <!-- TEXT -->
        <div *ngIf="lesson.type === 'text'" class="text-content">
          <div [innerHTML]="lesson.content"></div>
        </div>

        <!-- PDF -->
        <div *ngIf="lesson.type === 'pdf'" class="pdf-container">
          <iframe [src]="getSafeUrl(lesson.fileUrl!)" class="pdf-viewer"></iframe>
          <button *ngIf="lesson.downloadable" class="download-btn" (click)="download(lesson.fileUrl!)">
            ⬇️ Download PDF
          </button>
        </div>

        <!-- DOCUMENT -->
        <div *ngIf="lesson.type === 'document'" class="document-container">
          <div class="document-preview">
            <div class="file-icon">📄</div>
            <div class="file-info">
              <h3>{{ lesson.title }}</h3>
              <p>{{ formatFileSize(lesson.fileSize) }}</p>
            </div>
          </div>
          <button *ngIf="lesson.downloadable" class="download-btn" (click)="download(lesson.fileUrl!)">
            ⬇️ Download
          </button>
        </div>

        <!-- AUDIO -->
        <div *ngIf="lesson.type === 'audio'" class="audio-container">
          <audio controls class="audio-player">
            <source [src]="lesson.fileUrl" type="audio/mpeg">
            Your browser does not support audio playback.
          </audio>
        </div>

        <!-- PRESENTATION -->
        <div *ngIf="lesson.type === 'presentation'" class="presentation-container">
          <iframe [src]="getSafeUrl(lesson.fileUrl!)" class="presentation-viewer"></iframe>
        </div>

        <!-- CODE -->
        <div *ngIf="lesson.type === 'code'" class="code-container">
          <pre><code>{{ lesson.content }}</code></pre>
        </div>

        <!-- QUIZ -->
        <div *ngIf="lesson.type === 'quiz'" class="quiz-container">
          <app-quiz-taking [quizId]="lesson.id"></app-quiz-taking>
        </div>

        <!-- ASSIGNMENT -->
        <div *ngIf="lesson.type === 'assignment'" class="assignment-container">
          <div [innerHTML]="lesson.content"></div>
          <div class="assignment-actions">
            <button class="btn-primary">Submit Assignment</button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .lesson-viewer {
      max-width: 1200px;
      margin: 0 auto;
      padding: 20px;
    }

    .lesson-header {
      margin-bottom: 30px;
    }

    .lesson-header h2 {
      font-size: 32px;
      margin-bottom: 10px;
    }

    .description {
      font-size: 18px;
      color: #666;
      margin-bottom: 15px;
    }

    .meta {
      display: flex;
      gap: 15px;
      align-items: center;
    }

    .type-badge {
      padding: 6px 12px;
      border-radius: 20px;
      font-size: 14px;
      font-weight: 600;
      background: #e0e0e0;
    }

    .type-badge.video { background: #FF6B6B; color: white; }
    .type-badge.text { background: #4ECDC4; color: white; }
    .type-badge.pdf { background: #FF6B35; color: white; }
    .type-badge.audio { background: #95E1D3; color: white; }
    .type-badge.code { background: #6C5CE7; color: white; }

    .duration {
      font-size: 14px;
      color: #666;
    }

    .lesson-content {
      background: white;
      border-radius: 12px;
      padding: 30px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    }

    .text-content {
      line-height: 1.8;
      font-size: 16px;
    }

    .pdf-container {
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    .pdf-viewer,
    .presentation-viewer {
      width: 100%;
      height: 800px;
      border: 1px solid #e0e0e0;
      border-radius: 8px;
    }

    .document-container {
      text-align: center;
      padding: 40px;
    }

    .document-preview {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 20px;
      margin-bottom: 30px;
    }

    .file-icon {
      font-size: 64px;
    }

    .file-info h3 {
      margin-bottom: 5px;
    }

    .file-info p {
      color: #666;
    }

    .audio-container {
      display: flex;
      justify-content: center;
      padding: 40px;
    }

    .audio-player {
      width: 100%;
      max-width: 600px;
    }

    .code-container pre {
      background: #2d2d2d;
      color: #f8f8f2;
      padding: 20px;
      border-radius: 8px;
      overflow-x: auto;
    }

    .code-container code {
      font-family: 'Courier New', monospace;
      font-size: 14px;
      line-height: 1.6;
    }

    .download-btn {
      padding: 12px 24px;
      background: #4CAF50;
      color: white;
      border: none;
      border-radius: 8px;
      font-size: 16px;
      cursor: pointer;
      transition: all 0.2s;
    }

    .download-btn:hover {
      background: #45a049;
      transform: translateY(-2px);
    }

    .assignment-actions {
      margin-top: 30px;
      text-align: center;
    }

    .btn-primary {
      padding: 12px 30px;
      background: #667eea;
      color: white;
      border: none;
      border-radius: 8px;
      font-size: 16px;
      cursor: pointer;
    }

    .btn-primary:hover {
      background: #5568d3;
    }

    @media (max-width: 768px) {
      .lesson-viewer {
        padding: 10px;
      }

      .lesson-header h2 {
        font-size: 24px;
      }

      .lesson-content {
        padding: 20px;
      }

      .pdf-viewer,
      .presentation-viewer {
        height: 500px;
      }
    }
  `],
})
export class LessonViewerComponent {
  @Input() lesson!: Lesson;

  constructor(private sanitizer: DomSanitizer) {}

  getSafeUrl(url: string): SafeResourceUrl {
    return this.sanitizer.bypassSecurityTrustResourceUrl(url);
  }

  formatType(type: string): string {
    const types: Record<string, string> = {
      video: 'Video',
      text: 'Text',
      pdf: 'PDF',
      document: 'Document',
      audio: 'Audio',
      presentation: 'Presentation',
      code: 'Code',
      quiz: 'Quiz',
      assignment: 'Assignment',
    };
    return types[type] || type;
  }

  formatDuration(seconds: number): string {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    if (h > 0) return `${h}h ${m}m`;
    return `${m}m`;
  }

  formatFileSize(bytes?: number): string {
    if (!bytes) return '';
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(2)} MB`;
  }

  download(url: string): void {
    window.open(url, '_blank');
  }
}
