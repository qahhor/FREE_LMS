import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDividerModule } from '@angular/material/divider';
import { CourseService } from '@core/services/course.service';
import { EnrollmentService } from '@core/services/enrollment.service';
import { AuthService } from '@core/services/auth.service';
import { Course, CourseLevel } from '@core/models';

@Component({
  selector: 'app-course-detail',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTabsModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    MatDividerModule
  ],
  template: `
    @if (isLoading) {
      <div class="loading-container">
        <mat-spinner diameter="50"></mat-spinner>
      </div>
    } @else if (course) {
      <div class="course-detail-container">
        <!-- Hero Section -->
        <div class="course-hero">
          <div class="hero-content">
            <div class="hero-info">
              <nav class="breadcrumb">
                <a routerLink="/courses">Курсы</a>
                <mat-icon>chevron_right</mat-icon>
                <a [routerLink]="['/courses/category', course.categoryName | lowercase]">{{ course.categoryName }}</a>
              </nav>

              <h1>{{ course.title }}</h1>
              <p class="course-description">{{ course.shortDescription || course.description }}</p>

              <div class="course-meta">
                <span class="rating">
                  <mat-icon>star</mat-icon>
                  {{ course.rating | number:'1.1-1' }}
                  ({{ course.reviewsCount }} отзывов)
                </span>
                <span class="students">
                  <mat-icon>people</mat-icon>
                  {{ course.enrollmentCount }} студентов
                </span>
                <span class="level">
                  <mat-icon>signal_cellular_alt</mat-icon>
                  {{ getLevelName(course.level) }}
                </span>
              </div>

              <div class="instructor-info">
                <mat-icon>person</mat-icon>
                <span>Инструктор: <strong>{{ course.instructorName }}</strong></span>
              </div>

              <div class="course-details">
                <span><mat-icon>schedule</mat-icon> {{ course.duration }} часов</span>
                <span><mat-icon>play_lesson</mat-icon> {{ course.lessonsCount }} уроков</span>
                <span><mat-icon>language</mat-icon> {{ course.language }}</span>
                <span><mat-icon>update</mat-icon> {{ course.updatedAt | date:'dd.MM.yyyy' }}</span>
              </div>
            </div>

            <div class="hero-card">
              <mat-card>
                <img mat-card-image [src]="course.thumbnailUrl || 'assets/images/course-placeholder.jpg'"
                     [alt]="course.title">
                <mat-card-content>
                  <div class="price-section">
                    @if (course.originalPrice && course.originalPrice > course.price) {
                      <span class="original-price">{{ course.originalPrice | number }} {{ course.currency }}</span>
                    }
                    @if (course.price > 0) {
                      <span class="current-price">{{ course.price | number }} {{ course.currency }}</span>
                    } @else {
                      <span class="free-badge">Бесплатно</span>
                    }
                  </div>

                  @if (authService.isAuthenticated()) {
                    @if (isEnrolled) {
                      <button mat-raised-button color="primary" class="full-width" disabled>
                        <mat-icon>check</mat-icon>
                        Вы записаны
                      </button>
                    } @else {
                      <button mat-raised-button color="primary" class="full-width" (click)="enroll()" [disabled]="isEnrolling">
                        @if (isEnrolling) {
                          <mat-spinner diameter="20"></mat-spinner>
                        } @else if (course.price > 0) {
                          <mat-icon>shopping_cart</mat-icon>
                          Записаться
                        } @else {
                          <mat-icon>add</mat-icon>
                          Записаться бесплатно
                        }
                      </button>
                    }
                  } @else {
                    <a mat-raised-button color="primary" class="full-width" routerLink="/auth/login"
                       [queryParams]="{returnUrl: '/courses/' + course.slug}">
                      Войти для записи
                    </a>
                  }

                  <mat-divider></mat-divider>

                  <div class="course-includes">
                    <h4>Курс включает:</h4>
                    <ul>
                      <li><mat-icon>play_circle</mat-icon> {{ course.lessonsCount }} видео уроков</li>
                      <li><mat-icon>schedule</mat-icon> {{ course.duration }} часов контента</li>
                      <li><mat-icon>all_inclusive</mat-icon> Пожизненный доступ</li>
                      <li><mat-icon>phone_android</mat-icon> Доступ с мобильных</li>
                      <li><mat-icon>card_membership</mat-icon> Сертификат по окончании</li>
                    </ul>
                  </div>
                </mat-card-content>
              </mat-card>
            </div>
          </div>
        </div>

        <!-- Course Content -->
        <div class="course-content">
          <mat-tab-group>
            <mat-tab label="Описание">
              <div class="tab-content">
                <h3>О курсе</h3>
                <p class="description">{{ course.description }}</p>

                @if (course.objectives?.length) {
                  <h3>Чему вы научитесь</h3>
                  <div class="objectives-grid">
                    @for (objective of course.objectives; track objective) {
                      <div class="objective-item">
                        <mat-icon>check_circle</mat-icon>
                        <span>{{ objective }}</span>
                      </div>
                    }
                  </div>
                }

                @if (course.requirements?.length) {
                  <h3>Требования</h3>
                  <ul class="requirements-list">
                    @for (req of course.requirements; track req) {
                      <li>{{ req }}</li>
                    }
                  </ul>
                }
              </div>
            </mat-tab>

            <mat-tab label="Инструктор">
              <div class="tab-content">
                <div class="instructor-card">
                  <img [src]="course.instructorAvatar || 'assets/images/avatar-placeholder.jpg'"
                       [alt]="course.instructorName" class="instructor-avatar">
                  <div class="instructor-details">
                    <h3>{{ course.instructorName }}</h3>
                    <p>Инструктор курса</p>
                  </div>
                </div>
              </div>
            </mat-tab>

            @if (course.tags?.length) {
              <mat-tab label="Теги">
                <div class="tab-content">
                  <mat-chip-set>
                    @for (tag of course.tags; track tag) {
                      <mat-chip>{{ tag }}</mat-chip>
                    }
                  </mat-chip-set>
                </div>
              </mat-tab>
            }
          </mat-tab-group>
        </div>
      </div>
    } @else {
      <div class="not-found">
        <mat-icon>error_outline</mat-icon>
        <h2>Курс не найден</h2>
        <a mat-raised-button color="primary" routerLink="/courses">К списку курсов</a>
      </div>
    }
  `,
  styles: [`
    .loading-container {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 60vh;
    }

    .course-detail-container {
      max-width: 1200px;
      margin: 0 auto;
    }

    .course-hero {
      background: linear-gradient(135deg, #1a237e 0%, #3f51b5 100%);
      color: white;
      padding: 40px 24px;
      margin: -24px -24px 0;
    }

    .hero-content {
      max-width: 1200px;
      margin: 0 auto;
      display: grid;
      grid-template-columns: 1fr 350px;
      gap: 40px;
      align-items: start;
    }

    .breadcrumb {
      display: flex;
      align-items: center;
      gap: 4px;
      margin-bottom: 16px;
      font-size: 14px;

      a {
        color: rgba(255, 255, 255, 0.8);
        text-decoration: none;

        &:hover {
          color: white;
        }
      }

      mat-icon {
        font-size: 16px;
        width: 16px;
        height: 16px;
      }
    }

    .hero-info {
      h1 {
        font-size: 36px;
        margin: 0 0 16px;
        line-height: 1.2;
      }

      .course-description {
        font-size: 18px;
        opacity: 0.9;
        margin-bottom: 24px;
        line-height: 1.6;
      }
    }

    .course-meta {
      display: flex;
      gap: 24px;
      margin-bottom: 16px;

      span {
        display: flex;
        align-items: center;
        gap: 4px;

        mat-icon {
          font-size: 20px;
          width: 20px;
          height: 20px;
        }
      }

      .rating mat-icon {
        color: #ffc107;
      }
    }

    .instructor-info {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 16px;
    }

    .course-details {
      display: flex;
      flex-wrap: wrap;
      gap: 16px;

      span {
        display: flex;
        align-items: center;
        gap: 4px;
        font-size: 14px;
        opacity: 0.9;

        mat-icon {
          font-size: 18px;
          width: 18px;
          height: 18px;
        }
      }
    }

    .hero-card {
      mat-card {
        img {
          height: 200px;
          object-fit: cover;
        }
      }

      .price-section {
        text-align: center;
        padding: 16px 0;

        .original-price {
          text-decoration: line-through;
          color: #999;
          margin-right: 8px;
        }

        .current-price {
          font-size: 32px;
          font-weight: 700;
          color: #3f51b5;
        }

        .free-badge {
          font-size: 32px;
          font-weight: 700;
          color: #4caf50;
        }
      }

      .full-width {
        width: 100%;
        height: 48px;
        margin-bottom: 16px;
      }

      .course-includes {
        h4 {
          margin: 16px 0 12px;
        }

        ul {
          list-style: none;
          padding: 0;
          margin: 0;

          li {
            display: flex;
            align-items: center;
            gap: 8px;
            padding: 8px 0;
            color: #666;

            mat-icon {
              font-size: 20px;
              width: 20px;
              height: 20px;
              color: #3f51b5;
            }
          }
        }
      }
    }

    .course-content {
      padding: 32px 24px;

      .tab-content {
        padding: 24px 0;
      }

      h3 {
        margin: 0 0 16px;
      }

      .description {
        line-height: 1.8;
        color: #444;
        white-space: pre-line;
      }

      .objectives-grid {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 12px;
        margin-bottom: 32px;

        .objective-item {
          display: flex;
          align-items: flex-start;
          gap: 8px;

          mat-icon {
            color: #4caf50;
            flex-shrink: 0;
          }
        }
      }

      .requirements-list {
        padding-left: 24px;

        li {
          margin-bottom: 8px;
        }
      }

      .instructor-card {
        display: flex;
        align-items: center;
        gap: 16px;

        .instructor-avatar {
          width: 80px;
          height: 80px;
          border-radius: 50%;
          object-fit: cover;
        }

        h3 {
          margin: 0;
        }

        p {
          margin: 4px 0 0;
          color: #666;
        }
      }
    }

    .not-found {
      text-align: center;
      padding: 80px 24px;

      mat-icon {
        font-size: 80px;
        width: 80px;
        height: 80px;
        color: #ccc;
      }

      h2 {
        color: #666;
        margin: 16px 0 24px;
      }
    }

    @media (max-width: 900px) {
      .hero-content {
        grid-template-columns: 1fr;
      }

      .hero-card {
        max-width: 400px;
      }

      .course-content .objectives-grid {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class CourseDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private courseService = inject(CourseService);
  private enrollmentService = inject(EnrollmentService);
  private snackBar = inject(MatSnackBar);
  authService = inject(AuthService);

  course: Course | null = null;
  isLoading = true;
  isEnrolled = false;
  isEnrolling = false;

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      const slug = params.get('slug');
      if (slug) {
        this.loadCourse(slug);
      }
    });
  }

  loadCourse(slug: string): void {
    this.isLoading = true;
    this.courseService.getCourseBySlug(slug).subscribe({
      next: course => {
        this.course = course;
        this.isLoading = false;
        if (this.authService.isAuthenticated()) {
          this.checkEnrollment();
        }
      },
      error: () => {
        this.course = null;
        this.isLoading = false;
      }
    });
  }

  checkEnrollment(): void {
    if (this.course) {
      this.enrollmentService.checkEnrollment(this.course.id).subscribe({
        next: isEnrolled => this.isEnrolled = isEnrolled
      });
    }
  }

  enroll(): void {
    if (!this.course) return;

    this.isEnrolling = true;
    this.enrollmentService.enroll({ courseId: this.course.id }).subscribe({
      next: () => {
        this.isEnrolled = true;
        this.isEnrolling = false;
        this.snackBar.open('Вы успешно записались на курс!', 'Закрыть', { duration: 3000 });
      },
      error: (error) => {
        this.isEnrolling = false;
        this.snackBar.open(error.message || 'Ошибка записи на курс', 'Закрыть', { duration: 5000 });
      }
    });
  }

  getLevelName(level: CourseLevel): string {
    const levels: { [key: string]: string } = {
      'BEGINNER': 'Начинающий',
      'INTERMEDIATE': 'Средний',
      'ADVANCED': 'Продвинутый',
      'ALL_LEVELS': 'Все уровни'
    };
    return levels[level] || level;
  }
}
