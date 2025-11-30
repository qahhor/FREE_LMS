import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-not-found',
  standalone: true,
  imports: [RouterLink, MatButtonModule, MatIconModule],
  template: `
    <div class="not-found-container">
      <h1 class="error-code">404</h1>
      <h2>Страница не найдена</h2>
      <p>Запрашиваемая страница не существует или была перемещена.</p>
      <div class="actions">
        <a mat-raised-button color="primary" routerLink="/">
          <mat-icon>home</mat-icon>
          На главную
        </a>
        <a mat-button routerLink="/courses">
          <mat-icon>school</mat-icon>
          Посмотреть курсы
        </a>
      </div>
    </div>
  `,
  styles: [`
    .not-found-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 60vh;
      text-align: center;
      padding: 24px;
    }

    .error-code {
      font-size: 120px;
      font-weight: 700;
      color: #3f51b5;
      margin: 0;
      line-height: 1;
    }

    h2 {
      font-size: 24px;
      margin: 16px 0 8px;
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
export class NotFoundComponent {}
