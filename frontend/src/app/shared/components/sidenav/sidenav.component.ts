import { Component, Output, EventEmitter, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { AuthService } from '@core/services/auth.service';

@Component({
  selector: 'app-sidenav',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    RouterLinkActive,
    MatListModule,
    MatIconModule,
    MatDividerModule
  ],
  template: `
    <div class="sidenav-content">
      <div class="sidenav-header">
        <h2>FREE-LMS</h2>
        <p>Платформа онлайн обучения</p>
      </div>

      <mat-divider></mat-divider>

      <mat-nav-list>
        <a mat-list-item routerLink="/" routerLinkActive="active" [routerLinkActiveOptions]="{exact: true}" (click)="close()">
          <mat-icon matListItemIcon>home</mat-icon>
          <span matListItemTitle>Главная</span>
        </a>

        <a mat-list-item routerLink="/courses" routerLinkActive="active" (click)="close()">
          <mat-icon matListItemIcon>school</mat-icon>
          <span matListItemTitle>Все курсы</span>
        </a>

        <a mat-list-item routerLink="/currency" routerLinkActive="active" (click)="close()">
          <mat-icon matListItemIcon>currency_exchange</mat-icon>
          <span matListItemTitle>Курсы валют</span>
        </a>

        @if (authService.isAuthenticated()) {
          <mat-divider></mat-divider>

          <a mat-list-item routerLink="/dashboard" routerLinkActive="active" (click)="close()">
            <mat-icon matListItemIcon>dashboard</mat-icon>
            <span matListItemTitle>Панель управления</span>
          </a>

          <a mat-list-item routerLink="/my-courses" routerLinkActive="active" (click)="close()">
            <mat-icon matListItemIcon>book</mat-icon>
            <span matListItemTitle>Мои курсы</span>
          </a>

          <a mat-list-item routerLink="/certificates" routerLinkActive="active" (click)="close()">
            <mat-icon matListItemIcon>card_membership</mat-icon>
            <span matListItemTitle>Сертификаты</span>
          </a>

          <a mat-list-item routerLink="/payments" routerLinkActive="active" (click)="close()">
            <mat-icon matListItemIcon>payment</mat-icon>
            <span matListItemTitle>История платежей</span>
          </a>

          <a mat-list-item routerLink="/profile" routerLinkActive="active" (click)="close()">
            <mat-icon matListItemIcon>person</mat-icon>
            <span matListItemTitle>Профиль</span>
          </a>

          @if (authService.hasRole('ADMIN')) {
            <mat-divider></mat-divider>

            <a mat-list-item routerLink="/admin" routerLinkActive="active" (click)="close()">
              <mat-icon matListItemIcon>admin_panel_settings</mat-icon>
              <span matListItemTitle>Администрирование</span>
            </a>
          }

          <mat-divider></mat-divider>

          <a mat-list-item (click)="logout()">
            <mat-icon matListItemIcon>logout</mat-icon>
            <span matListItemTitle>Выйти</span>
          </a>
        } @else {
          <mat-divider></mat-divider>

          <a mat-list-item routerLink="/auth/login" routerLinkActive="active" (click)="close()">
            <mat-icon matListItemIcon>login</mat-icon>
            <span matListItemTitle>Войти</span>
          </a>

          <a mat-list-item routerLink="/auth/register" routerLinkActive="active" (click)="close()">
            <mat-icon matListItemIcon>person_add</mat-icon>
            <span matListItemTitle>Регистрация</span>
          </a>
        }
      </mat-nav-list>
    </div>
  `,
  styles: [`
    .sidenav-content {
      height: 100%;
      display: flex;
      flex-direction: column;
    }

    .sidenav-header {
      padding: 24px 16px;
      background: linear-gradient(135deg, #3f51b5 0%, #1a237e 100%);
      color: white;

      h2 {
        margin: 0;
        font-size: 24px;
      }

      p {
        margin: 4px 0 0;
        opacity: 0.8;
        font-size: 14px;
      }
    }

    mat-nav-list {
      padding-top: 8px;

      .active {
        background-color: rgba(63, 81, 181, 0.1);

        mat-icon {
          color: #3f51b5;
        }
      }
    }
  `]
})
export class SidenavComponent {
  @Output() closeSidenav = new EventEmitter<void>();

  authService = inject(AuthService);

  close(): void {
    this.closeSidenav.emit();
  }

  logout(): void {
    this.authService.logout().subscribe(() => {
      this.close();
    });
  }
}
