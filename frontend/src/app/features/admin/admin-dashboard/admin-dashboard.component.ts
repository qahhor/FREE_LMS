import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, MatCardModule, MatIconModule, MatButtonModule],
  template: `
    <div class="admin-container">
      <header class="page-header">
        <h1>Панель администратора</h1>
        <p>Управление платформой FREE-LMS</p>
      </header>

      <div class="admin-grid">
        <mat-card class="admin-card card-hover" routerLink="/admin/users">
          <mat-card-content>
            <mat-icon>people</mat-icon>
            <h3>Пользователи</h3>
            <p>Управление учётными записями</p>
          </mat-card-content>
        </mat-card>

        <mat-card class="admin-card card-hover" routerLink="/admin/courses">
          <mat-card-content>
            <mat-icon>school</mat-icon>
            <h3>Курсы</h3>
            <p>Управление курсами</p>
          </mat-card-content>
        </mat-card>

        <mat-card class="admin-card card-hover" routerLink="/admin/categories">
          <mat-card-content>
            <mat-icon>category</mat-icon>
            <h3>Категории</h3>
            <p>Управление категориями</p>
          </mat-card-content>
        </mat-card>

        <mat-card class="admin-card card-hover" routerLink="/admin/payments">
          <mat-card-content>
            <mat-icon>payment</mat-icon>
            <h3>Платежи</h3>
            <p>Управление платежами</p>
          </mat-card-content>
        </mat-card>
      </div>
    </div>
  `,
  styles: [`
    .admin-container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 24px;
    }

    .page-header {
      margin-bottom: 32px;

      h1 { margin: 0 0 8px; }
      p { margin: 0; color: #666; }
    }

    .admin-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 24px;
    }

    .admin-card {
      cursor: pointer;
      text-align: center;
      padding: 24px;

      mat-icon {
        font-size: 48px;
        width: 48px;
        height: 48px;
        color: #3f51b5;
        margin-bottom: 16px;
      }

      h3 {
        margin: 0 0 8px;
      }

      p {
        margin: 0;
        color: #666;
      }
    }
  `]
})
export class AdminDashboardComponent {}
