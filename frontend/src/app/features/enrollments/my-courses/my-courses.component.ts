import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { EnrollmentService } from '@core/services/enrollment.service';
import { Enrollment } from '@core/models';

@Component({
  selector: 'app-my-courses',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTabsModule,
    MatProgressBarModule,
    MatProgressSpinnerModule,
    MatPaginatorModule
  ],
  template: `
    <div class="my-courses-container">
      <header class="page-header">
        <h1>Мои курсы</h1>
        <p>Ваши записи на курсы</p>
      </header>

      <mat-tab-group (selectedTabChange)="onTabChange($event.index)">
        <mat-tab label="Активные">
          <ng-template matTabContent>
            @if (isLoading) {
              <div class="loading-container">
                <mat-spinner diameter="40"></mat-spinner>
              </div>
            } @else if (enrollments.length === 0) {
              <div class="empty-state">
                <mat-icon>school</mat-icon>
                <h3>Нет активных курсов</h3>
                <p>Запишитесь на курс, чтобы начать обучение</p>
                <a mat-raised-button color="primary" routerLink="/courses">Найти курсы</a>
              </div>
            } @else {
              <div class="enrollments-grid">
                @for (enrollment of enrollments; track enrollment.id) {
                  <mat-card class="enrollment-card card-hover">
                    <img mat-card-image [src]="enrollment.courseThumbnail || 'assets/images/course-placeholder.jpg'"
                         [alt]="enrollment.courseTitle">
                    <mat-card-content>
                      <h3>{{ enrollment.courseTitle }}</h3>
                      <p class="instructor">{{ enrollment.courseInstructor }}</p>

                      <div class="progress-section">
                        <div class="progress-info">
                          <span>Прогресс</span>
                          <span>{{ enrollment.progress }}%</span>
                        </div>
                        <mat-progress-bar mode="determinate" [value]="enrollment.progress"></mat-progress-bar>
                      </div>

                      <div class="lessons-info">
                        <mat-icon>play_lesson</mat-icon>
                        {{ enrollment.completedLessons }} / {{ enrollment.totalLessons }} уроков
                      </div>

                      @if (enrollment.lastAccessedAt) {
                        <div class="last-access">
                          <mat-icon>history</mat-icon>
                          Последний доступ: {{ enrollment.lastAccessedAt | date:'dd.MM.yyyy HH:mm' }}
                        </div>
                      }
                    </mat-card-content>
                    <mat-card-actions>
                      <a mat-raised-button color="primary" [routerLink]="['/courses', enrollment.courseId]">
                        <mat-icon>play_arrow</mat-icon>
                        Продолжить
                      </a>
                    </mat-card-actions>
                  </mat-card>
                }
              </div>

              <mat-paginator
                [length]="totalElements"
                [pageSize]="pageSize"
                [pageIndex]="currentPage"
                (page)="onPageChange($event)">
              </mat-paginator>
            }
          </ng-template>
        </mat-tab>

        <mat-tab label="Завершённые">
          <ng-template matTabContent>
            @if (isLoading) {
              <div class="loading-container">
                <mat-spinner diameter="40"></mat-spinner>
              </div>
            } @else if (enrollments.length === 0) {
              <div class="empty-state">
                <mat-icon>emoji_events</mat-icon>
                <h3>Нет завершённых курсов</h3>
                <p>Завершите курс, чтобы получить сертификат</p>
              </div>
            } @else {
              <div class="enrollments-grid">
                @for (enrollment of enrollments; track enrollment.id) {
                  <mat-card class="enrollment-card completed card-hover">
                    <img mat-card-image [src]="enrollment.courseThumbnail || 'assets/images/course-placeholder.jpg'"
                         [alt]="enrollment.courseTitle">
                    <mat-card-content>
                      <div class="completed-badge">
                        <mat-icon>check_circle</mat-icon>
                        Завершён
                      </div>
                      <h3>{{ enrollment.courseTitle }}</h3>
                      <p class="instructor">{{ enrollment.courseInstructor }}</p>

                      @if (enrollment.completedAt) {
                        <div class="completed-date">
                          <mat-icon>event</mat-icon>
                          Завершён: {{ enrollment.completedAt | date:'dd.MM.yyyy' }}
                        </div>
                      }
                    </mat-card-content>
                    <mat-card-actions>
                      <a mat-button color="primary" routerLink="/certificates">
                        <mat-icon>card_membership</mat-icon>
                        Сертификат
                      </a>
                      <a mat-button [routerLink]="['/courses', enrollment.courseId]">
                        Пересмотреть
                      </a>
                    </mat-card-actions>
                  </mat-card>
                }
              </div>

              <mat-paginator
                [length]="totalElements"
                [pageSize]="pageSize"
                [pageIndex]="currentPage"
                (page)="onPageChange($event)">
              </mat-paginator>
            }
          </ng-template>
        </mat-tab>
      </mat-tab-group>
    </div>
  `,
  styles: [`
    .my-courses-container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 24px;
    }

    .page-header {
      margin-bottom: 24px;

      h1 {
        margin: 0 0 8px;
      }

      p {
        margin: 0;
        color: #666;
      }
    }

    .loading-container {
      display: flex;
      justify-content: center;
      padding: 60px;
    }

    .empty-state {
      text-align: center;
      padding: 60px 24px;

      mat-icon {
        font-size: 64px;
        width: 64px;
        height: 64px;
        color: #ccc;
      }

      h3 {
        margin: 16px 0 8px;
        color: #666;
      }

      p {
        color: #999;
        margin-bottom: 16px;
      }
    }

    .enrollments-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: 24px;
      padding: 24px 0;
    }

    .enrollment-card {
      img {
        height: 160px;
        object-fit: cover;
      }

      h3 {
        font-size: 18px;
        margin: 0 0 8px;
        line-height: 1.3;
      }

      .instructor {
        color: #666;
        font-size: 14px;
        margin: 0 0 16px;
      }

      .progress-section {
        margin-bottom: 12px;

        .progress-info {
          display: flex;
          justify-content: space-between;
          font-size: 12px;
          color: #666;
          margin-bottom: 4px;
        }
      }

      .lessons-info, .last-access, .completed-date {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 13px;
        color: #666;
        margin-top: 8px;

        mat-icon {
          font-size: 18px;
          width: 18px;
          height: 18px;
        }
      }

      &.completed {
        .completed-badge {
          display: flex;
          align-items: center;
          gap: 4px;
          color: #4caf50;
          font-weight: 500;
          margin-bottom: 8px;

          mat-icon {
            font-size: 20px;
            width: 20px;
            height: 20px;
          }
        }
      }
    }
  `]
})
export class MyCoursesComponent implements OnInit {
  private enrollmentService = inject(EnrollmentService);

  enrollments: Enrollment[] = [];
  currentTab = 0;
  currentPage = 0;
  pageSize = 12;
  totalElements = 0;
  isLoading = true;

  ngOnInit(): void {
    this.loadEnrollments();
  }

  loadEnrollments(): void {
    this.isLoading = true;

    const request = this.currentTab === 0
      ? this.enrollmentService.getMyActiveEnrollments(this.currentPage, this.pageSize)
      : this.enrollmentService.getMyCompletedEnrollments(this.currentPage, this.pageSize);

    request.subscribe({
      next: response => {
        this.enrollments = response.content;
        this.totalElements = response.totalElements;
        this.isLoading = false;
      },
      error: () => this.isLoading = false
    });
  }

  onTabChange(index: number): void {
    this.currentTab = index;
    this.currentPage = 0;
    this.loadEnrollments();
  }

  onPageChange(event: PageEvent): void {
    this.currentPage = event.pageIndex;
    this.pageSize = event.pageSize;
    this.loadEnrollments();
  }
}
