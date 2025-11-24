import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '@environments/environment';

interface CourseModule {
  id?: number;
  title: string;
  description: string;
  orderIndex: number;
  lessons: Lesson[];
  expanded?: boolean;
}

interface Lesson {
  id?: number;
  title: string;
  description: string;
  type: string;
  content?: string;
  videoUrl?: string;
  fileUrl?: string;
  duration: number;
  orderIndex: number;
}

/**
 * Course builder for creating and managing course structure
 */
@Component({
  selector: 'app-course-builder',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="course-builder">
      <div class="builder-header">
        <h1>📚 Course Builder</h1>
        <button class="btn-save" (click)="saveCourse()">💾 Save Course</button>
      </div>

      <!-- Course Info -->
      <div class="course-info card">
        <h2>Course Information</h2>
        <div class="form-group">
          <label>Course Title *</label>
          <input [(ngModel)]="courseTitle" placeholder="Enter course title" />
        </div>
        <div class="form-group">
          <label>Description *</label>
          <textarea [(ngModel)]="courseDescription" rows="4" placeholder="Describe your course"></textarea>
        </div>
      </div>

      <!-- Modules -->
      <div class="modules-section">
        <div class="section-header">
          <h2>Course Modules</h2>
          <button class="btn-add" (click)="addModule()">+ Add Module</button>
        </div>

        <div class="modules-list">
          <div *ngFor="let module of modules; let i = index" class="module-card card">
            <div class="module-header">
              <div class="module-title-section" (click)="module.expanded = !module.expanded">
                <span class="expand-icon">{{ module.expanded ? '▼' : '▶' }}</span>
                <h3>{{ module.title || 'New Module' }}</h3>
                <span class="lesson-count">({{ module.lessons.length }} lessons)</span>
              </div>
              <div class="module-actions">
                <button class="btn-icon" (click)="moveModule(i, -1)" [disabled]="i === 0" title="Move up">↑</button>
                <button class="btn-icon" (click)="moveModule(i, 1)" [disabled]="i === modules.length - 1" title="Move down">↓</button>
                <button class="btn-icon delete" (click)="deleteModule(i)" title="Delete">🗑️</button>
              </div>
            </div>

            <div *ngIf="module.expanded" class="module-content">
              <div class="form-group">
                <label>Module Title *</label>
                <input [(ngModel)]="module.title" placeholder="Module title" />
              </div>
              <div class="form-group">
                <label>Description</label>
                <textarea [(ngModel)]="module.description" rows="2" placeholder="Module description"></textarea>
              </div>

              <!-- Lessons -->
              <div class="lessons-section">
                <div class="subsection-header">
                  <h4>Lessons</h4>
                  <button class="btn-add-small" (click)="addLesson(i)">+ Add Lesson</button>
                </div>

                <div class="lessons-list">
                  <div *ngFor="let lesson of module.lessons; let j = index" class="lesson-item">
                    <div class="lesson-handle">⋮⋮</div>
                    <div class="lesson-info">
                      <input [(ngModel)]="lesson.title" placeholder="Lesson title" class="lesson-title-input" />
                      <select [(ngModel)]="lesson.type" class="lesson-type-select">
                        <option value="video">📹 Video</option>
                        <option value="text">📝 Text</option>
                        <option value="pdf">📄 PDF</option>
                        <option value="document">📎 Document</option>
                        <option value="audio">🎵 Audio</option>
                        <option value="presentation">📊 Presentation</option>
                        <option value="code">💻 Code</option>
                        <option value="quiz">❓ Quiz</option>
                        <option value="assignment">✍️ Assignment</option>
                      </select>
                    </div>
                    <div class="lesson-actions">
                      <button class="btn-icon-small" (click)="editLesson(i, j)">✏️</button>
                      <button class="btn-icon-small" (click)="moveLesson(i, j, -1)" [disabled]="j === 0">↑</button>
                      <button class="btn-icon-small" (click)="moveLesson(i, j, 1)" [disabled]="j === module.lessons.length - 1">↓</button>
                      <button class="btn-icon-small delete" (click)="deleteLesson(i, j)">🗑️</button>
                    </div>
                  </div>

                  <div *ngIf="module.lessons.length === 0" class="empty-state">
                    No lessons yet. Click "Add Lesson" to start.
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div *ngIf="modules.length === 0" class="empty-state-large">
            <div class="empty-icon">📦</div>
            <h3>No modules yet</h3>
            <p>Start building your course by adding a module</p>
            <button class="btn-primary" (click)="addModule()">+ Add First Module</button>
          </div>
        </div>
      </div>

      <!-- Preview Button -->
      <div class="builder-footer">
        <button class="btn-secondary" (click)="previewCourse()">👁️ Preview</button>
        <button class="btn-primary" (click)="saveCourse()">💾 Save & Publish</button>
      </div>
    </div>
  `,
  styles: [`
    .course-builder {
      max-width: 1200px;
      margin: 0 auto;
      padding: 20px;
    }

    .builder-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 30px;
    }

    .builder-header h1 {
      font-size: 32px;
    }

    .card {
      background: white;
      border-radius: 12px;
      padding: 30px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      margin-bottom: 20px;
    }

    .course-info h2 {
      margin-bottom: 20px;
    }

    .form-group {
      margin-bottom: 20px;
    }

    .form-group label {
      display: block;
      font-weight: 600;
      margin-bottom: 8px;
      color: #333;
    }

    .form-group input,
    .form-group textarea {
      width: 100%;
      padding: 12px;
      border: 2px solid #e0e0e0;
      border-radius: 8px;
      font-size: 16px;
      font-family: inherit;
      transition: border-color 0.2s;
    }

    .form-group input:focus,
    .form-group textarea:focus {
      outline: none;
      border-color: #667eea;
    }

    .section-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
    }

    .module-card {
      margin-bottom: 20px;
    }

    .module-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-bottom: 15px;
      border-bottom: 2px solid #f5f5f5;
    }

    .module-title-section {
      display: flex;
      align-items: center;
      gap: 10px;
      flex: 1;
      cursor: pointer;
    }

    .module-title-section:hover {
      color: #667eea;
    }

    .expand-icon {
      font-size: 12px;
    }

    .lesson-count {
      font-size: 14px;
      color: #999;
    }

    .module-actions,
    .lesson-actions {
      display: flex;
      gap: 8px;
    }

    .btn-icon,
    .btn-icon-small {
      padding: 8px;
      background: #f5f5f5;
      border: none;
      border-radius: 6px;
      cursor: pointer;
      transition: all 0.2s;
    }

    .btn-icon:hover:not(:disabled),
    .btn-icon-small:hover:not(:disabled) {
      background: #e0e0e0;
    }

    .btn-icon:disabled,
    .btn-icon-small:disabled {
      opacity: 0.3;
      cursor: not-allowed;
    }

    .btn-icon.delete,
    .btn-icon-small.delete {
      background: #ffebee;
    }

    .btn-icon.delete:hover,
    .btn-icon-small.delete:hover {
      background: #ffcdd2;
    }

    .module-content {
      margin-top: 20px;
    }

    .subsection-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin: 20px 0 15px;
    }

    .subsection-header h4 {
      font-size: 18px;
    }

    .lessons-list {
      border: 1px solid #e0e0e0;
      border-radius: 8px;
      padding: 10px;
      min-height: 100px;
    }

    .lesson-item {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 12px;
      background: #f9f9f9;
      border-radius: 8px;
      margin-bottom: 8px;
    }

    .lesson-handle {
      cursor: grab;
      color: #999;
      font-size: 16px;
    }

    .lesson-info {
      display: flex;
      gap: 10px;
      flex: 1;
    }

    .lesson-title-input {
      flex: 1;
      padding: 8px 12px;
      border: 1px solid #e0e0e0;
      border-radius: 6px;
    }

    .lesson-type-select {
      padding: 8px 12px;
      border: 1px solid #e0e0e0;
      border-radius: 6px;
      background: white;
      cursor: pointer;
    }

    .btn-add,
    .btn-add-small {
      padding: 10px 20px;
      background: #667eea;
      color: white;
      border: none;
      border-radius: 8px;
      cursor: pointer;
      font-weight: 600;
      transition: all 0.2s;
    }

    .btn-add:hover,
    .btn-add-small:hover {
      background: #5568d3;
      transform: translateY(-2px);
    }

    .btn-add-small {
      padding: 6px 12px;
      font-size: 14px;
    }

    .btn-save,
    .btn-primary,
    .btn-secondary {
      padding: 12px 24px;
      border: none;
      border-radius: 8px;
      font-size: 16px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
    }

    .btn-save,
    .btn-primary {
      background: #4CAF50;
      color: white;
    }

    .btn-save:hover,
    .btn-primary:hover {
      background: #45a049;
    }

    .btn-secondary {
      background: #f5f5f5;
      color: #333;
    }

    .btn-secondary:hover {
      background: #e0e0e0;
    }

    .empty-state,
    .empty-state-large {
      text-align: center;
      padding: 40px 20px;
      color: #999;
    }

    .empty-state-large {
      padding: 80px 20px;
    }

    .empty-icon {
      font-size: 64px;
      margin-bottom: 20px;
    }

    .builder-footer {
      display: flex;
      justify-content: flex-end;
      gap: 15px;
      margin-top: 30px;
      padding-top: 20px;
      border-top: 2px solid #f5f5f5;
    }

    @media (max-width: 768px) {
      .course-builder {
        padding: 10px;
      }

      .builder-header {
        flex-direction: column;
        align-items: flex-start;
        gap: 15px;
      }

      .module-header {
        flex-direction: column;
        align-items: flex-start;
        gap: 10px;
      }

      .lesson-item {
        flex-wrap: wrap;
      }

      .lesson-info {
        flex: 1 1 100%;
      }
    }
  `],
})
export class CourseBuilderComponent implements OnInit {
  courseTitle = '';
  courseDescription = '';
  modules: CourseModule[] = [];

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    // Load existing course if editing
  }

  addModule(): void {
    this.modules.push({
      title: `Module ${this.modules.length + 1}`,
      description: '',
      orderIndex: this.modules.length,
      lessons: [],
      expanded: true,
    });
  }

  deleteModule(index: number): void {
    if (confirm('Delete this module and all its lessons?')) {
      this.modules.splice(index, 1);
      this.updateOrderIndexes();
    }
  }

  moveModule(index: number, direction: number): void {
    const newIndex = index + direction;
    if (newIndex >= 0 && newIndex < this.modules.length) {
      [this.modules[index], this.modules[newIndex]] = [this.modules[newIndex], this.modules[index]];
      this.updateOrderIndexes();
    }
  }

  addLesson(moduleIndex: number): void {
    const module = this.modules[moduleIndex];
    module.lessons.push({
      title: `Lesson ${module.lessons.length + 1}`,
      description: '',
      type: 'video',
      duration: 0,
      orderIndex: module.lessons.length,
    });
  }

  editLesson(moduleIndex: number, lessonIndex: number): void {
    // Open lesson editor modal
    alert('Lesson editor coming soon!');
  }

  deleteLesson(moduleIndex: number, lessonIndex: number): void {
    if (confirm('Delete this lesson?')) {
      this.modules[moduleIndex].lessons.splice(lessonIndex, 1);
      this.updateLessonIndexes(moduleIndex);
    }
  }

  moveLesson(moduleIndex: number, lessonIndex: number, direction: number): void {
    const lessons = this.modules[moduleIndex].lessons;
    const newIndex = lessonIndex + direction;
    if (newIndex >= 0 && newIndex < lessons.length) {
      [lessons[lessonIndex], lessons[newIndex]] = [lessons[newIndex], lessons[lessonIndex]];
      this.updateLessonIndexes(moduleIndex);
    }
  }

  private updateOrderIndexes(): void {
    this.modules.forEach((module, index) => {
      module.orderIndex = index;
    });
  }

  private updateLessonIndexes(moduleIndex: number): void {
    this.modules[moduleIndex].lessons.forEach((lesson, index) => {
      lesson.orderIndex = index;
    });
  }

  async saveCourse(): Promise<void> {
    if (!this.courseTitle || !this.courseDescription) {
      alert('Please fill in course title and description');
      return;
    }

    if (this.modules.length === 0) {
      alert('Please add at least one module');
      return;
    }

    try {
      // Save course logic
      console.log('Saving course:', {
        title: this.courseTitle,
        description: this.courseDescription,
        modules: this.modules,
      });

      alert('Course saved successfully!');
    } catch (error) {
      console.error('Error saving course:', error);
      alert('Failed to save course');
    }
  }

  previewCourse(): void {
    console.log('Preview:', {
      title: this.courseTitle,
      description: this.courseDescription,
      modules: this.modules,
    });
    alert('Preview feature coming soon!');
  }
}
