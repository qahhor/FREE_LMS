import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-unauthorized',
  standalone: true,
  imports: [RouterLink, MatButtonModule, MatIconModule],
  template: `
    <div class="unauthorized-container">
      <mat-icon class="error-icon">block</mat-icon>
      <h1>Доступ запрещён</h1>
      <p>У вас нет прав для просмотра этой страницы.</p>
      <div class="actions">
        <a mat-raised-button color="primary" routerLink="/">
          <mat-icon>home</mat-icon>
          На главную
        </a>
        <a mat-button routerLink="/dashboard">
          <mat-icon>dashboard</mat-icon>
          Панель управления
        </a>
      </div>
    </div>
  `,
  styles: [`
    .unauthorized-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 60vh;
      text-align: center;
      padding: 24px;
    }

    .error-icon {
      font-size: 80px;
      width: 80px;
      height: 80px;
      color: #f44336;
      margin-bottom: 24px;
    }

    h1 {
      font-size: 32px;
      margin-bottom: 8px;
      color: #333;
    }

    p {
      color: #666;
      margin-bottom: 24px;
    }

    .actions {
      display: flex;
      gap: 16px;
    }
  `]
})
export class UnauthorizedComponent {}
