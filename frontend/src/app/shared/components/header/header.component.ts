import { Component, Output, EventEmitter, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatBadgeModule } from '@angular/material/badge';
import { MatDividerModule } from '@angular/material/divider';
import { AuthService } from '@core/services/auth.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    RouterLinkActive,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MatBadgeModule,
    MatDividerModule
  ],
  template: `
    <mat-toolbar color="primary" class="header">
      <button mat-icon-button (click)="toggleSidenav.emit()" class="menu-button">
        <mat-icon>menu</mat-icon>
      </button>

      <a routerLink="/" class="logo">
        <span class="logo-text">FREE-LMS</span>
      </a>

      <nav class="nav-links hide-mobile">
        <a mat-button routerLink="/courses" routerLinkActive="active">Курсы</a>
        <a mat-button routerLink="/currency" routerLinkActive="active">Курсы валют</a>
      </nav>

      <span class="spacer"></span>

      @if (authService.isAuthenticated()) {
        <button mat-icon-button routerLink="/dashboard">
          <mat-icon>dashboard</mat-icon>
        </button>

        <button mat-icon-button [matMenuTriggerFor]="userMenu">
          <mat-icon>account_circle</mat-icon>
        </button>

        <mat-menu #userMenu="matMenu">
          <div class="user-info">
            <strong>{{ authService.user()?.fullName }}</strong>
            <small>{{ authService.user()?.email }}</small>
          </div>
          <mat-divider></mat-divider>
          <a mat-menu-item routerLink="/dashboard">
            <mat-icon>dashboard</mat-icon>
            <span>Панель управления</span>
          </a>
          <a mat-menu-item routerLink="/my-courses">
            <mat-icon>school</mat-icon>
            <span>Мои курсы</span>
          </a>
          <a mat-menu-item routerLink="/certificates">
            <mat-icon>card_membership</mat-icon>
            <span>Сертификаты</span>
          </a>
          <a mat-menu-item routerLink="/profile">
            <mat-icon>person</mat-icon>
            <span>Профиль</span>
          </a>
          @if (authService.hasRole('ADMIN')) {
            <mat-divider></mat-divider>
            <a mat-menu-item routerLink="/admin">
              <mat-icon>admin_panel_settings</mat-icon>
              <span>Администрирование</span>
            </a>
          }
          <mat-divider></mat-divider>
          <button mat-menu-item (click)="logout()">
            <mat-icon>logout</mat-icon>
            <span>Выйти</span>
          </button>
        </mat-menu>
      } @else {
        <a mat-button routerLink="/auth/login" class="hide-mobile">Войти</a>
        <a mat-raised-button color="accent" routerLink="/auth/register" class="hide-mobile">
          Регистрация
        </a>
        <button mat-icon-button routerLink="/auth/login" class="hide-desktop">
          <mat-icon>login</mat-icon>
        </button>
      }
    </mat-toolbar>
  `,
  styles: [`
    .header {
      position: sticky;
      top: 0;
      z-index: 1000;
    }

    .menu-button {
      margin-right: 8px;
    }

    .logo {
      text-decoration: none;
      color: inherit;
      display: flex;
      align-items: center;
    }

    .logo-text {
      font-size: 20px;
      font-weight: 500;
    }

    .nav-links {
      margin-left: 24px;

      a.active {
        background-color: rgba(255, 255, 255, 0.1);
      }
    }

    .spacer {
      flex: 1;
    }

    .user-info {
      padding: 16px;
      display: flex;
      flex-direction: column;

      small {
        color: #757575;
        margin-top: 4px;
      }
    }

    @media (max-width: 600px) {
      .hide-mobile {
        display: none !important;
      }
    }

    @media (min-width: 601px) {
      .hide-desktop {
        display: none !important;
      }
    }
  `]
})
export class HeaderComponent {
  @Output() toggleSidenav = new EventEmitter<void>();

  authService = inject(AuthService);

  logout(): void {
    this.authService.logout().subscribe();
  }
}
