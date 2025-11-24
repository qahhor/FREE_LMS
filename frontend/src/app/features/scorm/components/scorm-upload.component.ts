import { Component, inject, signal, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ScormService } from '../services/scorm.service';

@Component({
  selector: 'app-scorm-upload',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="scorm-upload">
      <div class="upload-container">
        <h2>Загрузить SCORM пакет</h2>
        <p class="subtitle">Поддерживаются форматы SCORM 1.2 и SCORM 2004</p>

        <!-- Drag & Drop Zone -->
        <div
          class="drop-zone"
          [class.dragging]="isDragging"
          [class.has-file]="selectedFile"
          (dragover)="onDragOver($event)"
          (dragleave)="onDragLeave($event)"
          (drop)="onDrop($event)"
          (click)="fileInput.click()"
        >
          <input
            #fileInput
            type="file"
            accept=".zip"
            (change)="onFileSelected($event)"
            style="display: none;"
          />

          <div *ngIf="!selectedFile" class="drop-content">
            <div class="upload-icon">📦</div>
            <h3>Перетащите ZIP файл сюда</h3>
            <p>или нажмите для выбора файла</p>
            <span class="file-info">Максимальный размер: 100 МБ</span>
          </div>

          <div *ngIf="selectedFile" class="file-preview">
            <div class="file-icon">📄</div>
            <div class="file-details">
              <h4>{{ selectedFile.name }}</h4>
              <p>{{ formatFileSize(selectedFile.size) }}</p>
            </div>
            <button
              class="btn-remove"
              (click)="removeFile($event)"
              type="button"
            >
              ✕
            </button>
          </div>
        </div>

        <!-- Upload Form -->
        <div *ngIf="selectedFile" class="upload-form">
          <div class="form-group">
            <label>Название курса *</label>
            <input
              type="text"
              [(ngModel)]="title"
              placeholder="Введите название курса"
              [class.error]="showErrors && !title"
            />
            <span *ngIf="showErrors && !title" class="error-text">
              Обязательное поле
            </span>
          </div>

          <div class="form-group">
            <label>Описание (опционально)</label>
            <textarea
              [(ngModel)]="description"
              rows="4"
              placeholder="Краткое описание содержания курса"
            ></textarea>
          </div>

          <!-- Upload Progress -->
          <div *ngIf="uploading()" class="upload-progress">
            <div class="progress-info">
              <span>Загрузка и обработка пакета...</span>
              <span>{{ uploadProgress() }}%</span>
            </div>
            <div class="progress-bar">
              <div
                class="progress-fill"
                [style.width.%]="uploadProgress()"
              ></div>
            </div>
            <p class="progress-status">{{ uploadStatus() }}</p>
          </div>

          <!-- Error Message -->
          <div *ngIf="errorMessage()" class="error-message">
            <span class="error-icon">⚠️</span>
            <div>
              <strong>Ошибка загрузки</strong>
              <p>{{ errorMessage() }}</p>
            </div>
          </div>

          <!-- Actions -->
          <div class="form-actions">
            <button
              class="btn-secondary"
              (click)="cancel()"
              type="button"
              [disabled]="uploading()"
            >
              Отмена
            </button>
            <button
              class="btn-primary"
              (click)="upload()"
              type="button"
              [disabled]="uploading() || !selectedFile"
            >
              {{ uploading() ? 'Загрузка...' : 'Загрузить пакет' }}
            </button>
          </div>
        </div>

        <!-- Requirements -->
        <div class="requirements">
          <h3>Требования к SCORM пакету:</h3>
          <ul>
            <li>ZIP архив, содержащий файл imsmanifest.xml в корне</li>
            <li>Соответствие стандарту SCORM 1.2 или SCORM 2004</li>
            <li>Максимальный размер: 100 МБ</li>
            <li>Все ресурсы (изображения, видео, стили) должны быть внутри архива</li>
            <li>Пути к файлам должны быть относительными</li>
          </ul>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .scorm-upload {
      padding: 40px 20px;
      max-width: 800px;
      margin: 0 auto;
    }

    .upload-container {
      background: white;
      border-radius: 16px;
      padding: 40px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }

    h2 {
      margin: 0 0 8px 0;
      color: #333;
      font-size: 1.75rem;
    }

    .subtitle {
      color: #666;
      margin: 0 0 30px 0;
    }

    .drop-zone {
      border: 3px dashed #ddd;
      border-radius: 12px;
      padding: 60px 30px;
      text-align: center;
      cursor: pointer;
      transition: all 0.3s;
      margin-bottom: 30px;
    }

    .drop-zone:hover {
      border-color: #667eea;
      background: #f0f4ff;
    }

    .drop-zone.dragging {
      border-color: #667eea;
      background: #f0f4ff;
      border-style: solid;
    }

    .drop-zone.has-file {
      border-style: solid;
      border-color: #4caf50;
      background: #f1f8f4;
    }

    .drop-content { }
    .upload-icon {
      font-size: 5rem;
      margin-bottom: 20px;
    }

    .drop-content h3 {
      margin: 0 0 8px 0;
      color: #333;
      font-size: 1.25rem;
    }

    .drop-content p {
      margin: 0 0 16px 0;
      color: #666;
    }

    .file-info {
      display: inline-block;
      padding: 6px 16px;
      background: #f8f9fa;
      border-radius: 20px;
      color: #999;
      font-size: 0.875rem;
    }

    .file-preview {
      display: flex;
      align-items: center;
      gap: 20px;
      padding: 20px;
      background: white;
      border-radius: 12px;
    }

    .file-icon {
      font-size: 3rem;
    }

    .file-details {
      flex: 1;
      text-align: left;
    }

    .file-details h4 {
      margin: 0 0 4px 0;
      color: #333;
      font-size: 1.125rem;
    }

    .file-details p {
      margin: 0;
      color: #666;
      font-size: 0.875rem;
    }

    .btn-remove {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      background: #f44336;
      color: white;
      border: none;
      cursor: pointer;
      font-size: 1.25rem;
      transition: transform 0.2s;
    }

    .btn-remove:hover {
      transform: scale(1.1);
    }

    .upload-form { }

    .form-group {
      margin-bottom: 24px;
    }

    .form-group label {
      display: block;
      margin-bottom: 8px;
      color: #555;
      font-weight: 500;
    }

    .form-group input,
    .form-group textarea {
      width: 100%;
      padding: 12px;
      border: 1px solid #ddd;
      border-radius: 8px;
      font-size: 1rem;
      transition: border-color 0.3s;
    }

    .form-group input:focus,
    .form-group textarea:focus {
      outline: none;
      border-color: #667eea;
    }

    .form-group input.error {
      border-color: #f44336;
    }

    .error-text {
      display: block;
      color: #f44336;
      font-size: 0.875rem;
      margin-top: 4px;
    }

    .upload-progress {
      background: #f8f9fa;
      padding: 20px;
      border-radius: 12px;
      margin-bottom: 24px;
    }

    .progress-info {
      display: flex;
      justify-content: space-between;
      margin-bottom: 12px;
      color: #555;
      font-weight: 600;
    }

    .progress-bar {
      height: 8px;
      background: #e0e0e0;
      border-radius: 4px;
      overflow: hidden;
      margin-bottom: 12px;
    }

    .progress-fill {
      height: 100%;
      background: linear-gradient(90deg, #667eea, #764ba2);
      transition: width 0.3s;
    }

    .progress-status {
      color: #999;
      font-size: 0.875rem;
      margin: 0;
    }

    .error-message {
      display: flex;
      align-items: start;
      gap: 12px;
      padding: 16px;
      background: #ffebee;
      border: 2px solid #f44336;
      border-radius: 12px;
      margin-bottom: 24px;
    }

    .error-icon {
      font-size: 1.5rem;
    }

    .error-message strong {
      display: block;
      color: #c62828;
      margin-bottom: 4px;
    }

    .error-message p {
      margin: 0;
      color: #d32f2f;
      font-size: 0.875rem;
    }

    .form-actions {
      display: flex;
      gap: 12px;
      justify-content: flex-end;
    }

    button {
      padding: 12px 32px;
      border: none;
      border-radius: 8px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s;
    }

    .btn-primary {
      background: #667eea;
      color: white;
    }

    .btn-primary:hover {
      background: #5568d3;
    }

    .btn-primary:disabled {
      background: #ccc;
      cursor: not-allowed;
    }

    .btn-secondary {
      background: transparent;
      border: 2px solid #667eea;
      color: #667eea;
    }

    .btn-secondary:hover {
      background: #f0f4ff;
    }

    .btn-secondary:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .requirements {
      margin-top: 40px;
      padding-top: 40px;
      border-top: 1px solid #e0e0e0;
    }

    .requirements h3 {
      color: #333;
      margin: 0 0 16px 0;
      font-size: 1.125rem;
    }

    .requirements ul {
      list-style: none;
      padding: 0;
      margin: 0;
    }

    .requirements li {
      padding: 12px 0 12px 30px;
      position: relative;
      color: #666;
      line-height: 1.5;
    }

    .requirements li:before {
      content: '✓';
      position: absolute;
      left: 0;
      color: #4caf50;
      font-weight: 700;
    }
  `]
})
export class ScormUploadComponent {
  private scormService = inject(ScormService);

  @Output() uploadComplete = new EventEmitter<void>();
  @Output() uploadCancel = new EventEmitter<void>();

  selectedFile: File | null = null;
  title = '';
  description = '';
  isDragging = false;
  showErrors = false;

  uploading = signal(false);
  uploadProgress = signal(0);
  uploadStatus = signal('');
  errorMessage = signal<string | null>(null);

  onDragOver(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = true;
  }

  onDragLeave(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = false;
  }

  onDrop(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = false;

    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      this.handleFile(files[0]);
    }
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.handleFile(file);
    }
  }

  handleFile(file: File) {
    if (!file.name.endsWith('.zip')) {
      alert('Пожалуйста, выберите ZIP файл');
      return;
    }

    if (file.size > 100 * 1024 * 1024) {
      alert('Файл слишком большой. Максимальный размер: 100 МБ');
      return;
    }

    this.selectedFile = file;
    this.errorMessage.set(null);

    // Auto-fill title from filename
    if (!this.title) {
      this.title = file.name.replace('.zip', '').replace(/[_-]/g, ' ');
    }
  }

  removeFile(event: Event) {
    event.stopPropagation();
    this.selectedFile = null;
    this.title = '';
    this.description = '';
    this.errorMessage.set(null);
  }

  formatFileSize(bytes: number): string {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  }

  upload() {
    this.showErrors = true;

    if (!this.title || !this.selectedFile) {
      return;
    }

    this.uploading.set(true);
    this.uploadProgress.set(0);
    this.uploadStatus.set('Загрузка файла...');
    this.errorMessage.set(null);

    const formData = new FormData();
    formData.append('file', this.selectedFile);
    formData.append('title', this.title);
    if (this.description) {
      formData.append('description', this.description);
    }

    // Simulate progress
    const progressInterval = setInterval(() => {
      const current = this.uploadProgress();
      if (current < 90) {
        this.uploadProgress.set(current + 10);
        if (current < 30) {
          this.uploadStatus.set('Загрузка файла...');
        } else if (current < 60) {
          this.uploadStatus.set('Распаковка архива...');
        } else {
          this.uploadStatus.set('Анализ манифеста...');
        }
      }
    }, 500);

    this.scormService.uploadPackage(formData).subscribe({
      next: () => {
        clearInterval(progressInterval);
        this.uploadProgress.set(100);
        this.uploadStatus.set('Готово!');

        setTimeout(() => {
          this.uploading.set(false);
          this.uploadComplete.emit();
          this.reset();
        }, 1000);
      },
      error: (err) => {
        clearInterval(progressInterval);
        this.uploading.set(false);
        this.errorMessage.set(
          err.error?.message ||
          'Не удалось загрузить пакет. Проверьте формат файла.'
        );
      }
    });
  }

  cancel() {
    this.uploadCancel.emit();
    this.reset();
  }

  reset() {
    this.selectedFile = null;
    this.title = '';
    this.description = '';
    this.showErrors = false;
    this.uploadProgress.set(0);
    this.errorMessage.set(null);
  }
}
