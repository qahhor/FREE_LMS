import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { CertificateService } from '@core/services/certificate.service';
import { Certificate } from '@core/models';

@Component({
  selector: 'app-certificate-verify',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule
  ],
  template: `
    <div class="verify-container">
      @if (isLoading) {
        <div class="loading-container">
          <mat-spinner diameter="50"></mat-spinner>
          <p>Проверка сертификата...</p>
        </div>
      } @else if (certificate) {
        <mat-card class="certificate-view">
          <div class="certificate-header">
            <mat-icon class="verify-icon success">verified</mat-icon>
            <h2>Сертификат подтверждён</h2>
          </div>

          <div class="certificate-body">
            <div class="cert-badge">
              <mat-icon>workspace_premium</mat-icon>
            </div>

            <h1 class="cert-title">Сертификат о прохождении</h1>
            <p class="cert-subtitle">Настоящим удостоверяется, что</p>

            <h2 class="cert-user">{{ certificate.userName }}</h2>

            <p class="cert-text">успешно завершил(а) курс</p>

            <h3 class="cert-course">{{ certificate.courseTitle }}</h3>

            <p class="cert-instructor">Инструктор: {{ certificate.instructorName }}</p>

            <div class="cert-details">
              <div class="detail-item">
                <span class="label">Номер сертификата</span>
                <span class="value">{{ certificate.certificateNumber }}</span>
              </div>
              <div class="detail-item">
                <span class="label">Дата выдачи</span>
                <span class="value">{{ certificate.issuedAt | date:'dd MMMM yyyy' }}</span>
              </div>
              @if (certificate.expiresAt) {
                <div class="detail-item">
                  <span class="label">Действителен до</span>
                  <span class="value">{{ certificate.expiresAt | date:'dd MMMM yyyy' }}</span>
                </div>
              }
            </div>
          </div>

          <mat-card-actions>
            @if (certificate.downloadUrl) {
              <a mat-raised-button color="primary" [href]="certificate.downloadUrl" target="_blank">
                <mat-icon>download</mat-icon>
                Скачать PDF
              </a>
            }
            <a mat-button routerLink="/courses">
              Посмотреть другие курсы
            </a>
          </mat-card-actions>
        </mat-card>
      } @else {
        <mat-card class="certificate-view error">
          <div class="certificate-header">
            <mat-icon class="verify-icon error">cancel</mat-icon>
            <h2>Сертификат не найден</h2>
          </div>
          <mat-card-content>
            <p>Сертификат с указанным номером не существует или был отозван.</p>
          </mat-card-content>
          <mat-card-actions>
            <a mat-raised-button color="primary" routerLink="/">На главную</a>
          </mat-card-actions>
        </mat-card>
      }
    </div>
  `,
  styles: [`
    .verify-container {
      max-width: 700px;
      margin: 0 auto;
      padding: 24px;
    }

    .loading-container {
      text-align: center;
      padding: 80px;

      p {
        margin-top: 16px;
        color: #666;
      }
    }

    .certificate-view {
      .certificate-header {
        text-align: center;
        padding: 24px;
        background: linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%);
        border-radius: 4px 4px 0 0;

        .verify-icon {
          font-size: 64px;
          width: 64px;
          height: 64px;

          &.success { color: #4caf50; }
          &.error { color: #f44336; }
        }

        h2 {
          margin: 16px 0 0;
          color: #2e7d32;
        }
      }

      &.error .certificate-header {
        background: linear-gradient(135deg, #ffebee 0%, #ffcdd2 100%);

        h2 { color: #c62828; }
      }

      .certificate-body {
        text-align: center;
        padding: 40px 24px;
        background: linear-gradient(to bottom, #fff 0%, #fafafa 100%);
        border: 2px solid #e0e0e0;
        border-top: none;

        .cert-badge mat-icon {
          font-size: 80px;
          width: 80px;
          height: 80px;
          color: #ffc107;
          margin-bottom: 24px;
        }

        .cert-title {
          font-size: 28px;
          font-weight: 300;
          color: #1a237e;
          margin: 0 0 8px;
        }

        .cert-subtitle {
          color: #666;
          margin: 0 0 16px;
        }

        .cert-user {
          font-size: 32px;
          font-weight: 500;
          color: #333;
          margin: 0 0 16px;
        }

        .cert-text {
          color: #666;
          margin: 0 0 8px;
        }

        .cert-course {
          font-size: 24px;
          color: #3f51b5;
          margin: 0 0 16px;
        }

        .cert-instructor {
          color: #666;
          margin: 0 0 32px;
        }

        .cert-details {
          display: flex;
          justify-content: center;
          gap: 32px;
          flex-wrap: wrap;

          .detail-item {
            .label {
              display: block;
              font-size: 12px;
              color: #999;
              text-transform: uppercase;
            }

            .value {
              font-weight: 500;
              color: #333;
            }
          }
        }
      }

      mat-card-actions {
        justify-content: center;
        padding: 24px;
      }
    }
  `]
})
export class CertificateVerifyComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private certificateService = inject(CertificateService);

  certificate: Certificate | null = null;
  isLoading = true;

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      const number = params.get('number');
      if (number) {
        this.verifyCertificate(number);
      }
    });
  }

  verifyCertificate(number: string): void {
    this.isLoading = true;
    this.certificateService.verifyCertificate(number).subscribe({
      next: certificate => {
        this.certificate = certificate;
        this.isLoading = false;
      },
      error: () => {
        this.certificate = null;
        this.isLoading = false;
      }
    });
  }
}
