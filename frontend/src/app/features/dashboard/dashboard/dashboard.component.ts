import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuthService } from '@core/services/auth.service';
import { EnrollmentService } from '@core/services/enrollment.service';
import { CertificateService } from '@core/services/certificate.service';
import { Enrollment, Certificate } from '@core/models';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressBarModule,
    MatProgressSpinnerModule
  ],
  template: `
    <div class="dashboard-container">
      <header class="dashboard-header">
        <h1>Добро пожаловать, {{ authService.user()?.firstName }}!</h1>
        <p>Продолжайте обучение и достигайте новых высот</p>
      </header>

      <!-- Stats Cards -->
      <div class="stats-grid">
        <mat-card class="stat-card">
          <mat-icon>school</mat-icon>
          <div class="stat-info">
            <h3>{{ activeEnrollmentsCount }}</h3>
            <p>Активных курсов</p>
          </div>
        </mat-card>

        <mat-card class="stat-card">
          <mat-icon>check_circle</mat-icon>
          <div class="stat-info">
            <h3>{{ completedEnrollmentsCount }}</h3>
            <p>Завершённых</p>
          </div>
        </mat-card>

        <mat-card class="stat-card">
          <mat-icon>card_membership</mat-icon>
          <div class="stat-info">
            <h3>{{ certificatesCount }}</h3>
            <p>Сертификатов</p>
          </div>
        </mat-card>

        <mat-card class="stat-card">
          <mat-icon>trending_up</mat-icon>
          <div class="stat-info">
            <h3>{{ averageProgress }}%</h3>
            <p>Средний прогресс</p>
          </div>
        </mat-card>
      </div>

      <!-- Recent Enrollments -->
      <section class="section">
        <div class="section-header">
          <h2>Продолжить обучение</h2>
          <a mat-button color="primary" routerLink="/my-courses">Все курсы</a>
        </div>

        @if (isLoadingEnrollments) {
          <div class="loading-container">
            <mat-spinner diameter="40"></mat-spinner>
          </div>
        } @else if (recentEnrollments.length === 0) {
          <mat-card class="empty-state">
            <mat-icon>school</mat-icon>
            <h3>Нет активных курсов</h3>
            <p>Запишитесь на курс, чтобы начать обучение</p>
            <a mat-raised-button color="primary" routerLink="/courses">Найти курсы</a>
          </mat-card>
        } @else {
          <div class="enrollments-grid">
            @for (enrollment of recentEnrollments; track enrollment.id) {
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
                    {{ enrollment.completedLessons }} / {{ enrollment.totalLessons }} уроков
                  </div>
                </mat-card-content>
                <mat-card-actions>
                  <a mat-button color="primary" [routerLink]="['/courses', enrollment.courseId]">
                    <mat-icon>play_arrow</mat-icon>
                    Продолжить
                  </a>
                </mat-card-actions>
              </mat-card>
            }
          </div>
        }
      </section>

      <!-- Recent Certificates -->
      <section class="section">
        <div class="section-header">
          <h2>Последние сертификаты</h2>
          <a mat-button color="primary" routerLink="/certificates">Все сертификаты</a>
        </div>

        @if (isLoadingCertificates) {
          <div class="loading-container">
            <mat-spinner diameter="40"></mat-spinner>
          </div>
        } @else if (recentCertificates.length === 0) {
          <mat-card class="empty-state">
            <mat-icon>card_membership</mat-icon>
            <h3>Нет сертификатов</h3>
            <p>Завершите курс, чтобы получить сертификат</p>
          </mat-card>
        } @else {
          <div class="certificates-grid">
            @for (cert of recentCertificates; track cert.id) {
              <mat-card class="certificate-card card-hover">
                <mat-card-content>
                  <mat-icon class="cert-icon">workspace_premium</mat-icon>
                  <h4>{{ cert.courseTitle }}</h4>
                  <p class="cert-number">{{ cert.certificateNumber }}</p>
                  <p class="cert-date">{{ cert.issuedAt | date:'dd.MM.yyyy' }}</p>
                </mat-card-content>
                <mat-card-actions>
                  <a mat-button color="primary" [routerLink]="['/certificates/verify', cert.certificateNumber]">
                    Просмотреть
                  </a>
                </mat-card-actions>
              </mat-card>
            }
          </div>
        }
      </section>
    </div>
  `,
  styles: [`
    .dashboard-container {
      padding: 24px;
      max-width: 1200px;
      margin: 0 auto;
    }

    .dashboard-header {
      margin-bottom: 32px;

      h1 {
        margin: 0 0 8px;
        font-size: 32px;
      }

      p {
        margin: 0;
        color: #666;
      }
    }

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 16px;
      margin-bottom: 32px;
    }

    .stat-card {
      display: flex;
      align-items: center;
      padding: 20px;
      gap: 16px;

      mat-icon {
        font-size: 40px;
        width: 40px;
        height: 40px;
        color: #3f51b5;
      }

      .stat-info {
        h3 {
          margin: 0;
          font-size: 28px;
          color: #333;
        }

        p {
          margin: 0;
          color: #666;
          font-size: 14px;
        }
      }
    }

    .section {
      margin-bottom: 32px;
    }

    .section-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;

      h2 {
        margin: 0;
      }
    }

    .loading-container {
      display: flex;
      justify-content: center;
      padding: 40px;
    }

    .empty-state {
      text-align: center;
      padding: 48px;

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
      gap: 16px;
    }

    .enrollment-card {
      img {
        height: 140px;
        object-fit: cover;
      }

      h3 {
        font-size: 16px;
        margin: 0 0 4px;
        line-height: 1.3;
      }

      .instructor {
        color: #666;
        font-size: 14px;
        margin: 0 0 16px;
      }

      .progress-section {
        margin-bottom: 8px;

        .progress-info {
          display: flex;
          justify-content: space-between;
          font-size: 12px;
          color: #666;
          margin-bottom: 4px;
        }
      }

      .lessons-info {
        font-size: 12px;
        color: #666;
      }
    }

    .certificates-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
      gap: 16px;
    }

    .certificate-card {
      text-align: center;

      .cert-icon {
        font-size: 48px;
        width: 48px;
        height: 48px;
        color: #ffc107;
        margin-bottom: 12px;
      }

      h4 {
        margin: 0 0 8px;
        font-size: 16px;
      }

      .cert-number {
        font-family: monospace;
        color: #3f51b5;
        margin: 0 0 4px;
      }

      .cert-date {
        color: #666;
        font-size: 14px;
        margin: 0;
      }
    }

    @media (max-width: 768px) {
      .stats-grid {
        grid-template-columns: repeat(2, 1fr);
      }
    }

    @media (max-width: 480px) {
      .stats-grid {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class DashboardComponent implements OnInit {
  authService = inject(AuthService);
  private enrollmentService = inject(EnrollmentService);
  private certificateService = inject(CertificateService);

  recentEnrollments: Enrollment[] = [];
  recentCertificates: Certificate[] = [];

  activeEnrollmentsCount = 0;
  completedEnrollmentsCount = 0;
  certificatesCount = 0;
  averageProgress = 0;

  isLoadingEnrollments = true;
  isLoadingCertificates = true;

  ngOnInit(): void {
    this.loadRecentEnrollments();
    this.loadRecentCertificates();
  }

  private loadRecentEnrollments(): void {
    this.enrollmentService.getRecentEnrollments(4).subscribe({
      next: response => {
        this.recentEnrollments = response.content;
        this.calculateStats();
        this.isLoadingEnrollments = false;
      },
      error: () => this.isLoadingEnrollments = false
    });

    this.enrollmentService.getMyActiveEnrollments(0, 100).subscribe({
      next: response => {
        this.activeEnrollmentsCount = response.totalElements;
      }
    });

    this.enrollmentService.getMyCompletedEnrollments(0, 100).subscribe({
      next: response => {
        this.completedEnrollmentsCount = response.totalElements;
      }
    });
  }

  private loadRecentCertificates(): void {
    this.certificateService.getMyCertificates(0, 4).subscribe({
      next: response => {
        this.recentCertificates = response.content;
        this.certificatesCount = response.totalElements;
        this.isLoadingCertificates = false;
      },
      error: () => this.isLoadingCertificates = false
    });
  }

  private calculateStats(): void {
    if (this.recentEnrollments.length > 0) {
      const totalProgress = this.recentEnrollments.reduce((sum, e) => sum + e.progress, 0);
      this.averageProgress = Math.round(totalProgress / this.recentEnrollments.length);
    }
  }
}
