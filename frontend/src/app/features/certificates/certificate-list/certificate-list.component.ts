import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { CertificateService } from '@core/services/certificate.service';
import { Certificate } from '@core/models';

@Component({
  selector: 'app-certificate-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatPaginatorModule
  ],
  template: `
    <div class="certificates-container">
      <header class="page-header">
        <h1>Мои сертификаты</h1>
        <p>Сертификаты о завершении курсов</p>
      </header>

      @if (isLoading) {
        <div class="loading-container">
          <mat-spinner diameter="40"></mat-spinner>
        </div>
      } @else if (certificates.length === 0) {
        <div class="empty-state">
          <mat-icon>card_membership</mat-icon>
          <h3>Нет сертификатов</h3>
          <p>Завершите курс, чтобы получить сертификат</p>
          <a mat-raised-button color="primary" routerLink="/my-courses">Мои курсы</a>
        </div>
      } @else {
        <div class="certificates-grid">
          @for (cert of certificates; track cert.id) {
            <mat-card class="certificate-card card-hover">
              <mat-card-content>
                <div class="cert-icon-wrapper">
                  <mat-icon>workspace_premium</mat-icon>
                </div>
                <h3>{{ cert.courseTitle }}</h3>
                <p class="cert-user">{{ cert.userName }}</p>
                <p class="cert-number">{{ cert.certificateNumber }}</p>
                <div class="cert-meta">
                  <span><mat-icon>person</mat-icon> {{ cert.instructorName }}</span>
                  <span><mat-icon>event</mat-icon> {{ cert.issuedAt | date:'dd.MM.yyyy' }}</span>
                </div>
              </mat-card-content>
              <mat-card-actions>
                <a mat-button color="primary" [routerLink]="['/certificates/verify', cert.certificateNumber]">
                  <mat-icon>visibility</mat-icon>
                  Просмотреть
                </a>
                @if (cert.downloadUrl) {
                  <a mat-button [href]="cert.downloadUrl" target="_blank">
                    <mat-icon>download</mat-icon>
                    Скачать
                  </a>
                }
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
    </div>
  `,
  styles: [`
    .certificates-container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 24px;
    }

    .page-header {
      margin-bottom: 24px;

      h1 { margin: 0 0 8px; }
      p { margin: 0; color: #666; }
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

      h3 { margin: 16px 0 8px; color: #666; }
      p { color: #999; margin-bottom: 16px; }
    }

    .certificates-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: 24px;
      margin-bottom: 24px;
    }

    .certificate-card {
      text-align: center;

      .cert-icon-wrapper {
        margin: 16px 0;

        mat-icon {
          font-size: 64px;
          width: 64px;
          height: 64px;
          color: #ffc107;
        }
      }

      h3 {
        font-size: 18px;
        margin: 0 0 8px;
      }

      .cert-user {
        color: #333;
        margin: 0 0 8px;
      }

      .cert-number {
        font-family: monospace;
        color: #3f51b5;
        font-size: 14px;
        margin: 0 0 16px;
        padding: 8px;
        background: #f5f5f5;
        border-radius: 4px;
      }

      .cert-meta {
        display: flex;
        justify-content: center;
        gap: 16px;
        font-size: 13px;
        color: #666;

        span {
          display: flex;
          align-items: center;
          gap: 4px;

          mat-icon {
            font-size: 16px;
            width: 16px;
            height: 16px;
          }
        }
      }
    }
  `]
})
export class CertificateListComponent implements OnInit {
  private certificateService = inject(CertificateService);

  certificates: Certificate[] = [];
  currentPage = 0;
  pageSize = 12;
  totalElements = 0;
  isLoading = true;

  ngOnInit(): void {
    this.loadCertificates();
  }

  loadCertificates(): void {
    this.isLoading = true;
    this.certificateService.getMyCertificates(this.currentPage, this.pageSize).subscribe({
      next: response => {
        this.certificates = response.content;
        this.totalElements = response.totalElements;
        this.isLoading = false;
      },
      error: () => this.isLoading = false
    });
  }

  onPageChange(event: PageEvent): void {
    this.currentPage = event.pageIndex;
    this.pageSize = event.pageSize;
    this.loadCertificates();
  }
}
