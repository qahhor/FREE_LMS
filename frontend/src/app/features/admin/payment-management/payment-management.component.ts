import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-payment-management',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatIconModule],
  template: `
    <div class="admin-container">
      <header class="page-header">
        <h1>Управление платежами</h1>
      </header>

      <mat-card>
        <mat-card-content class="coming-soon">
          <mat-icon>construction</mat-icon>
          <h3>В разработке</h3>
          <p>Модуль управления платежами будет доступен в ближайшем обновлении</p>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .admin-container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 24px;
    }

    .page-header {
      margin-bottom: 24px;

      h1 { margin: 0; }
    }

    .coming-soon {
      text-align: center;
      padding: 60px;

      mat-icon {
        font-size: 64px;
        width: 64px;
        height: 64px;
        color: #ff9800;
      }

      h3 { margin: 16px 0 8px; }
      p { color: #666; }
    }
  `]
})
export class PaymentManagementComponent {}
