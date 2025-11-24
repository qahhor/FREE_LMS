import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { environment } from '@environments/environment';

interface CourseProgress {
  courseTitle: string;
  overallProgress: number;
  completedLessons: number;
  totalLessons: number;
  completedModules: number;
  totalModules: number;
  quizzesCompleted: number;
  totalQuizzes: number;
  videosWatched: number;
  totalVideos: number;
  averageQuizScore: number;
  totalTimeSpent: number;
  lastActivity: Date;
  estimatedCompletionDate?: Date;
  status: 'not_started' | 'in_progress' | 'completed';
}

interface LearningPath {
  totalCoursesEnrolled: number;
  coursesInProgress: number;
  coursesCompleted: number;
  totalLessonsCompleted: number;
  totalQuizzesTaken: number;
  averageQuizScore: number;
  totalLearningTime: number;
  certificatesEarned: number;
  currentStreak: number;
  longestStreak: number;
  lastActivityDate: Date;
  recentActivity: Array<{
    date: Date;
    activityType: string;
    description: string;
  }>;
}

/**
 * Progress dashboard showing comprehensive learning analytics
 */
@Component({
  selector: 'app-progress-dashboard',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="progress-dashboard">
      <!-- Learning Path Overview -->
      <div class="dashboard-section" *ngIf="learningPath">
        <h2>📊 My Learning Journey</h2>

        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-icon">📚</div>
            <div class="stat-value">{{ learningPath.totalCoursesEnrolled }}</div>
            <div class="stat-label">Courses Enrolled</div>
          </div>

          <div class="stat-card">
            <div class="stat-icon">⏳</div>
            <div class="stat-value">{{ learningPath.coursesInProgress }}</div>
            <div class="stat-label">In Progress</div>
          </div>

          <div class="stat-card highlight">
            <div class="stat-icon">✅</div>
            <div class="stat-value">{{ learningPath.coursesCompleted }}</div>
            <div class="stat-label">Completed</div>
          </div>

          <div class="stat-card">
            <div class="stat-icon">🏆</div>
            <div class="stat-value">{{ learningPath.certificatesEarned }}</div>
            <div class="stat-label">Certificates</div>
          </div>

          <div class="stat-card">
            <div class="stat-icon">✓</div>
            <div class="stat-value">{{ learningPath.totalLessonsCompleted }}</div>
            <div class="stat-label">Lessons Completed</div>
          </div>

          <div class="stat-card">
            <div class="stat-icon">📝</div>
            <div class="stat-value">{{ learningPath.totalQuizzesTaken }}</div>
            <div class="stat-label">Quizzes Taken</div>
          </div>

          <div class="stat-card">
            <div class="stat-icon">🎯</div>
            <div class="stat-value">{{ learningPath.averageQuizScore.toFixed(0) }}%</div>
            <div class="stat-label">Avg Quiz Score</div>
          </div>

          <div class="stat-card">
            <div class="stat-icon">⏱️</div>
            <div class="stat-value">{{ formatLearningTime(learningPath.totalLearningTime) }}</div>
            <div class="stat-label">Total Time</div>
          </div>
        </div>

        <!-- Learning Streak -->
        <div class="streak-section">
          <div class="streak-card">
            <div class="streak-icon">🔥</div>
            <div class="streak-info">
              <div class="streak-current">
                <span class="streak-number">{{ learningPath.currentStreak }}</span>
                <span class="streak-label">day streak</span>
              </div>
              <div class="streak-best">
                Best: {{ learningPath.longestStreak }} days
              </div>
            </div>
          </div>
        </div>

        <!-- Recent Activity -->
        <div class="activity-section" *ngIf="learningPath.recentActivity.length > 0">
          <h3>Recent Activity</h3>
          <div class="activity-list">
            <div
              *ngFor="let activity of learningPath.recentActivity"
              class="activity-item"
            >
              <div class="activity-icon">
                {{ getActivityIcon(activity.activityType) }}
              </div>
              <div class="activity-content">
                <div class="activity-description">{{ activity.description }}</div>
                <div class="activity-date">{{ formatDate(activity.date) }}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Course Progress Details -->
      <div class="dashboard-section" *ngIf="courseProgress">
        <h2>📖 {{ courseProgress.courseTitle }}</h2>

        <!-- Status Badge -->
        <div class="status-badge" [class]="courseProgress.status">
          {{ getStatusLabel(courseProgress.status) }}
        </div>

        <!-- Overall Progress Circle -->
        <div class="progress-circle-container">
          <svg class="progress-circle" viewBox="0 0 200 200">
            <circle
              cx="100"
              cy="100"
              r="90"
              class="progress-bg"
              fill="none"
              stroke="#e0e0e0"
              stroke-width="12"
            />
            <circle
              cx="100"
              cy="100"
              r="90"
              class="progress-fill"
              fill="none"
              stroke="#4CAF50"
              stroke-width="12"
              [style.stroke-dasharray]="565"
              [style.stroke-dashoffset]="565 - (565 * courseProgress.overallProgress) / 100"
            />
            <text
              x="100"
              y="105"
              text-anchor="middle"
              class="progress-text"
              font-size="36"
              font-weight="bold"
              fill="#4CAF50"
            >
              {{ courseProgress.overallProgress.toFixed(0) }}%
            </text>
          </svg>
        </div>

        <!-- Progress Breakdown -->
        <div class="progress-breakdown">
          <div class="breakdown-item">
            <div class="breakdown-label">
              <span class="breakdown-icon">📚</span>
              Lessons
            </div>
            <div class="breakdown-bar">
              <div
                class="breakdown-fill"
                [style.width.%]="
                  (courseProgress.completedLessons / courseProgress.totalLessons) * 100
                "
              ></div>
            </div>
            <div class="breakdown-text">
              {{ courseProgress.completedLessons }} / {{ courseProgress.totalLessons }}
            </div>
          </div>

          <div class="breakdown-item">
            <div class="breakdown-label">
              <span class="breakdown-icon">📦</span>
              Modules
            </div>
            <div class="breakdown-bar">
              <div
                class="breakdown-fill"
                [style.width.%]="
                  (courseProgress.completedModules / courseProgress.totalModules) * 100
                "
              ></div>
            </div>
            <div class="breakdown-text">
              {{ courseProgress.completedModules }} / {{ courseProgress.totalModules }}
            </div>
          </div>

          <div class="breakdown-item">
            <div class="breakdown-label">
              <span class="breakdown-icon">📝</span>
              Quizzes
            </div>
            <div class="breakdown-bar">
              <div
                class="breakdown-fill quiz"
                [style.width.%]="
                  (courseProgress.quizzesCompleted / courseProgress.totalQuizzes) * 100
                "
              ></div>
            </div>
            <div class="breakdown-text">
              {{ courseProgress.quizzesCompleted }} / {{ courseProgress.totalQuizzes }}
            </div>
          </div>

          <div class="breakdown-item">
            <div class="breakdown-label">
              <span class="breakdown-icon">🎥</span>
              Videos
            </div>
            <div class="breakdown-bar">
              <div
                class="breakdown-fill video"
                [style.width.%]="
                  (courseProgress.videosWatched / courseProgress.totalVideos) * 100
                "
              ></div>
            </div>
            <div class="breakdown-text">
              {{ courseProgress.videosWatched }} / {{ courseProgress.totalVideos }}
            </div>
          </div>
        </div>

        <!-- Additional Stats -->
        <div class="additional-stats">
          <div class="stat-item">
            <div class="stat-label">Average Quiz Score</div>
            <div class="stat-value">{{ courseProgress.averageQuizScore.toFixed(0) }}%</div>
          </div>

          <div class="stat-item">
            <div class="stat-label">Time Spent</div>
            <div class="stat-value">
              {{ formatLearningTime(courseProgress.totalTimeSpent) }}
            </div>
          </div>

          <div class="stat-item" *ngIf="courseProgress.estimatedCompletionDate">
            <div class="stat-label">Est. Completion</div>
            <div class="stat-value">
              {{ formatDate(courseProgress.estimatedCompletionDate) }}
            </div>
          </div>

          <div class="stat-item">
            <div class="stat-label">Last Activity</div>
            <div class="stat-value">
              {{ formatDate(courseProgress.lastActivity) }}
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .progress-dashboard {
      padding: 20px;
      max-width: 1200px;
      margin: 0 auto;
    }

    .dashboard-section {
      background: white;
      border-radius: 12px;
      padding: 30px;
      margin-bottom: 30px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    }

    h2 {
      font-size: 28px;
      margin-bottom: 25px;
      color: #333;
    }

    h3 {
      font-size: 20px;
      margin-bottom: 15px;
      color: #555;
    }

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 20px;
      margin-bottom: 30px;
    }

    .stat-card {
      background: #f8f9fa;
      border-radius: 12px;
      padding: 20px;
      text-align: center;
      transition: transform 0.2s, box-shadow 0.2s;
    }

    .stat-card:hover {
      transform: translateY(-5px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    }

    .stat-card.highlight {
      background: linear-gradient(135deg, #4CAF50 0%, #45a049 100%);
      color: white;
    }

    .stat-icon {
      font-size: 32px;
      margin-bottom: 10px;
    }

    .stat-value {
      font-size: 36px;
      font-weight: bold;
      margin-bottom: 5px;
    }

    .stat-label {
      font-size: 14px;
      opacity: 0.8;
    }

    .streak-section {
      margin: 30px 0;
    }

    .streak-card {
      background: linear-gradient(135deg, #FF6B6B 0%, #FF8E53 100%);
      border-radius: 12px;
      padding: 25px;
      display: flex;
      align-items: center;
      gap: 20px;
      color: white;
    }

    .streak-icon {
      font-size: 48px;
    }

    .streak-current {
      display: flex;
      align-items: baseline;
      gap: 10px;
    }

    .streak-number {
      font-size: 48px;
      font-weight: bold;
    }

    .streak-label {
      font-size: 18px;
    }

    .streak-best {
      font-size: 14px;
      opacity: 0.9;
      margin-top: 5px;
    }

    .activity-section {
      margin-top: 30px;
    }

    .activity-list {
      display: flex;
      flex-direction: column;
      gap: 15px;
    }

    .activity-item {
      display: flex;
      align-items: start;
      gap: 15px;
      padding: 15px;
      background: #f8f9fa;
      border-radius: 8px;
    }

    .activity-icon {
      font-size: 24px;
    }

    .activity-content {
      flex: 1;
    }

    .activity-description {
      font-size: 16px;
      color: #333;
      margin-bottom: 5px;
    }

    .activity-date {
      font-size: 14px;
      color: #666;
    }

    .status-badge {
      display: inline-block;
      padding: 8px 16px;
      border-radius: 20px;
      font-size: 14px;
      font-weight: 600;
      margin-bottom: 20px;
    }

    .status-badge.not_started {
      background: #e0e0e0;
      color: #666;
    }

    .status-badge.in_progress {
      background: #2196F3;
      color: white;
    }

    .status-badge.completed {
      background: #4CAF50;
      color: white;
    }

    .progress-circle-container {
      display: flex;
      justify-content: center;
      margin: 30px 0;
    }

    .progress-circle {
      width: 200px;
      height: 200px;
      transform: rotate(-90deg);
    }

    .progress-fill {
      transition: stroke-dashoffset 1s ease;
    }

    .progress-breakdown {
      display: flex;
      flex-direction: column;
      gap: 20px;
      margin: 30px 0;
    }

    .breakdown-item {
      display: grid;
      grid-template-columns: 150px 1fr 100px;
      gap: 15px;
      align-items: center;
    }

    .breakdown-label {
      font-weight: 600;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .breakdown-icon {
      font-size: 20px;
    }

    .breakdown-bar {
      height: 12px;
      background: #e0e0e0;
      border-radius: 6px;
      overflow: hidden;
    }

    .breakdown-fill {
      height: 100%;
      background: #4CAF50;
      border-radius: 6px;
      transition: width 0.5s ease;
    }

    .breakdown-fill.quiz {
      background: #2196F3;
    }

    .breakdown-fill.video {
      background: #FF9800;
    }

    .breakdown-text {
      text-align: right;
      font-weight: 600;
      color: #666;
    }

    .additional-stats {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 20px;
      margin-top: 30px;
      padding-top: 30px;
      border-top: 2px solid #f5f5f5;
    }

    .stat-item {
      text-align: center;
    }

    .stat-item .stat-label {
      font-size: 14px;
      color: #666;
      margin-bottom: 8px;
    }

    .stat-item .stat-value {
      font-size: 24px;
      font-weight: bold;
      color: #333;
    }
  `],
})
export class ProgressDashboardComponent implements OnInit {
  @Input() courseId?: number;

  learningPath?: LearningPath;
  courseProgress?: CourseProgress;
  loading = true;

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.loadData();
  }

  private async loadData(): Promise<void> {
    try {
      // Load learning path
      this.learningPath = await this.http
        .get<LearningPath>(`${environment.apiUrl}/progress/learning-path`)
        .toPromise() as LearningPath;

      // Load course progress if courseId provided
      if (this.courseId) {
        this.courseProgress = await this.http
          .get<CourseProgress>(
            `${environment.apiUrl}/progress/courses/${this.courseId}`,
          )
          .toPromise() as CourseProgress;
      }
    } catch (error) {
      console.error('Error loading progress data:', error);
    } finally {
      this.loading = false;
    }
  }

  formatLearningTime(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  }

  formatDate(date: Date | string): string {
    const d = new Date(date);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return 'Today';
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return `${diffDays} days ago`;
    } else {
      return d.toLocaleDateString();
    }
  }

  getActivityIcon(activityType: string): string {
    const icons: Record<string, string> = {
      lesson_completed: '✓',
      quiz_completed: '📝',
      course_completed: '🎓',
      video_watched: '🎥',
    };
    return icons[activityType] || '•';
  }

  getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      not_started: 'Not Started',
      in_progress: 'In Progress',
      completed: 'Completed',
    };
    return labels[status] || status;
  }
}
