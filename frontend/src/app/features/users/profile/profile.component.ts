import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTabsModule } from '@angular/material/tabs';
import { MatDividerModule } from '@angular/material/divider';
import { AuthService } from '@core/services/auth.service';
import { UserService } from '@core/services/user.service';
import { User } from '@core/models';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatTabsModule,
    MatDividerModule
  ],
  template: `
    <div class="profile-container">
      <header class="page-header">
        <h1>Профиль</h1>
        <p>Управление вашей учётной записью</p>
      </header>

      <mat-tab-group>
        <mat-tab label="Основная информация">
          <div class="tab-content">
            <mat-card>
              <mat-card-header>
                <div class="avatar-section">
                  <img [src]="user?.avatarUrl || 'assets/images/avatar-placeholder.jpg'"
                       alt="Avatar" class="avatar">
                  <div class="user-info">
                    <h2>{{ user?.fullName }}</h2>
                    <p>{{ user?.email }}</p>
                    <span class="role-badge">{{ getRoleName(user?.role) }}</span>
                  </div>
                </div>
              </mat-card-header>

              <mat-card-content>
                <form [formGroup]="profileForm" (ngSubmit)="onSaveProfile()">
                  <div class="form-row">
                    <mat-form-field appearance="outline">
                      <mat-label>Имя</mat-label>
                      <input matInput formControlName="firstName">
                    </mat-form-field>

                    <mat-form-field appearance="outline">
                      <mat-label>Фамилия</mat-label>
                      <input matInput formControlName="lastName">
                    </mat-form-field>
                  </div>

                  <mat-form-field appearance="outline" class="full-width">
                    <mat-label>Телефон</mat-label>
                    <input matInput formControlName="phoneNumber" placeholder="+998 XX XXX XX XX">
                    <mat-icon matPrefix>phone</mat-icon>
                  </mat-form-field>

                  <mat-form-field appearance="outline" class="full-width">
                    <mat-label>URL аватара</mat-label>
                    <input matInput formControlName="avatarUrl" placeholder="https://...">
                    <mat-icon matPrefix>image</mat-icon>
                  </mat-form-field>

                  <button mat-raised-button color="primary" type="submit"
                          [disabled]="profileForm.invalid || isSaving">
                    @if (isSaving) {
                      <mat-spinner diameter="20"></mat-spinner>
                    } @else {
                      Сохранить
                    }
                  </button>
                </form>
              </mat-card-content>
            </mat-card>
          </div>
        </mat-tab>

        <mat-tab label="Изменить пароль">
          <div class="tab-content">
            <mat-card>
              <mat-card-content>
                <form [formGroup]="passwordForm" (ngSubmit)="onChangePassword()">
                  <mat-form-field appearance="outline" class="full-width">
                    <mat-label>Текущий пароль</mat-label>
                    <input matInput [type]="hideCurrentPassword ? 'password' : 'text'"
                           formControlName="currentPassword">
                    <button mat-icon-button matSuffix type="button"
                            (click)="hideCurrentPassword = !hideCurrentPassword">
                      <mat-icon>{{ hideCurrentPassword ? 'visibility_off' : 'visibility' }}</mat-icon>
                    </button>
                  </mat-form-field>

                  <mat-form-field appearance="outline" class="full-width">
                    <mat-label>Новый пароль</mat-label>
                    <input matInput [type]="hideNewPassword ? 'password' : 'text'"
                           formControlName="newPassword">
                    <button mat-icon-button matSuffix type="button"
                            (click)="hideNewPassword = !hideNewPassword">
                      <mat-icon>{{ hideNewPassword ? 'visibility_off' : 'visibility' }}</mat-icon>
                    </button>
                    @if (passwordForm.get('newPassword')?.hasError('minlength')) {
                      <mat-error>Минимум 8 символов</mat-error>
                    }
                  </mat-form-field>

                  <mat-form-field appearance="outline" class="full-width">
                    <mat-label>Подтвердите новый пароль</mat-label>
                    <input matInput [type]="hideConfirmPassword ? 'password' : 'text'"
                           formControlName="confirmPassword">
                    <button mat-icon-button matSuffix type="button"
                            (click)="hideConfirmPassword = !hideConfirmPassword">
                      <mat-icon>{{ hideConfirmPassword ? 'visibility_off' : 'visibility' }}</mat-icon>
                    </button>
                    @if (passwordForm.hasError('passwordMismatch')) {
                      <mat-error>Пароли не совпадают</mat-error>
                    }
                  </mat-form-field>

                  <button mat-raised-button color="primary" type="submit"
                          [disabled]="passwordForm.invalid || isChangingPassword">
                    @if (isChangingPassword) {
                      <mat-spinner diameter="20"></mat-spinner>
                    } @else {
                      Изменить пароль
                    }
                  </button>
                </form>
              </mat-card-content>
            </mat-card>
          </div>
        </mat-tab>

        <mat-tab label="Статистика">
          <div class="tab-content">
            <mat-card>
              <mat-card-content>
                <div class="stats-grid">
                  <div class="stat-item">
                    <mat-icon>event</mat-icon>
                    <div>
                      <span class="label">Дата регистрации</span>
                      <span class="value">{{ user?.createdAt | date:'dd.MM.yyyy' }}</span>
                    </div>
                  </div>
                  <div class="stat-item">
                    <mat-icon>verified_user</mat-icon>
                    <div>
                      <span class="label">Email подтверждён</span>
                      <span class="value">{{ user?.emailVerified ? 'Да' : 'Нет' }}</span>
                    </div>
                  </div>
                  <div class="stat-item">
                    <mat-icon>check_circle</mat-icon>
                    <div>
                      <span class="label">Статус</span>
                      <span class="value">{{ user?.isActive ? 'Активен' : 'Неактивен' }}</span>
                    </div>
                  </div>
                </div>
              </mat-card-content>
            </mat-card>
          </div>
        </mat-tab>
      </mat-tab-group>
    </div>
  `,
  styles: [`
    .profile-container {
      max-width: 800px;
      margin: 0 auto;
      padding: 24px;
    }

    .page-header {
      margin-bottom: 24px;

      h1 { margin: 0 0 8px; }
      p { margin: 0; color: #666; }
    }

    .tab-content {
      padding: 24px 0;
    }

    .avatar-section {
      display: flex;
      align-items: center;
      gap: 16px;
      padding: 16px 0;

      .avatar {
        width: 80px;
        height: 80px;
        border-radius: 50%;
        object-fit: cover;
      }

      .user-info {
        h2 { margin: 0; }
        p { margin: 4px 0; color: #666; }

        .role-badge {
          display: inline-block;
          padding: 4px 12px;
          background: #3f51b5;
          color: white;
          border-radius: 16px;
          font-size: 12px;
        }
      }
    }

    .form-row {
      display: flex;
      gap: 16px;

      mat-form-field { flex: 1; }
    }

    .full-width {
      width: 100%;
    }

    mat-form-field {
      margin-bottom: 8px;
    }

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 24px;

      .stat-item {
        display: flex;
        align-items: center;
        gap: 12px;

        mat-icon {
          font-size: 32px;
          width: 32px;
          height: 32px;
          color: #3f51b5;
        }

        .label {
          display: block;
          font-size: 12px;
          color: #666;
        }

        .value {
          font-weight: 500;
        }
      }
    }
  `]
})
export class ProfileComponent implements OnInit {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private userService = inject(UserService);
  private snackBar = inject(MatSnackBar);

  user: User | null = null;
  profileForm!: FormGroup;
  passwordForm!: FormGroup;

  isSaving = false;
  isChangingPassword = false;
  hideCurrentPassword = true;
  hideNewPassword = true;
  hideConfirmPassword = true;

  ngOnInit(): void {
    this.user = this.authService.user();
    this.initForms();
  }

  initForms(): void {
    this.profileForm = this.fb.group({
      firstName: [this.user?.firstName || '', Validators.required],
      lastName: [this.user?.lastName || '', Validators.required],
      phoneNumber: [this.user?.phoneNumber || ''],
      avatarUrl: [this.user?.avatarUrl || '']
    });

    this.passwordForm = this.fb.group({
      currentPassword: ['', Validators.required],
      newPassword: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', Validators.required]
    }, { validators: this.passwordMatchValidator });
  }

  passwordMatchValidator(group: FormGroup): { [key: string]: boolean } | null {
    const newPassword = group.get('newPassword')?.value;
    const confirmPassword = group.get('confirmPassword')?.value;
    return newPassword === confirmPassword ? null : { passwordMismatch: true };
  }

  onSaveProfile(): void {
    if (this.profileForm.invalid) return;

    this.isSaving = true;
    this.userService.updateCurrentUser(this.profileForm.value).subscribe({
      next: user => {
        this.user = user;
        this.isSaving = false;
        this.snackBar.open('Профиль обновлён', 'Закрыть', { duration: 3000 });
        this.authService.getCurrentUser().subscribe();
      },
      error: () => {
        this.isSaving = false;
        this.snackBar.open('Ошибка обновления профиля', 'Закрыть', { duration: 5000 });
      }
    });
  }

  onChangePassword(): void {
    if (this.passwordForm.invalid) return;

    this.isChangingPassword = true;
    this.authService.changePassword(this.passwordForm.value).subscribe({
      next: () => {
        this.isChangingPassword = false;
        this.passwordForm.reset();
        this.snackBar.open('Пароль изменён', 'Закрыть', { duration: 3000 });
      },
      error: () => {
        this.isChangingPassword = false;
        this.snackBar.open('Ошибка изменения пароля', 'Закрыть', { duration: 5000 });
      }
    });
  }

  getRoleName(role?: string): string {
    const roles: { [key: string]: string } = {
      'STUDENT': 'Студент',
      'INSTRUCTOR': 'Инструктор',
      'ORGANIZATION_ADMIN': 'Админ организации',
      'ADMIN': 'Администратор'
    };
    return roles[role || ''] || role || '';
  }
}
