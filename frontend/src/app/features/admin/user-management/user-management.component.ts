import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatChipsModule } from '@angular/material/chips';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatSnackBar } from '@angular/material/snack-bar';
import { UserService } from '@core/services/user.service';
import { User, UserRole } from '@core/models';

@Component({
  selector: 'app-user-management',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatChipsModule,
    MatMenuModule,
    MatProgressSpinnerModule,
    MatPaginatorModule
  ],
  template: `
    <div class="admin-container">
      <header class="page-header">
        <h1>Управление пользователями</h1>
      </header>

      <div class="filters">
        <mat-form-field appearance="outline">
          <mat-label>Поиск</mat-label>
          <input matInput [(ngModel)]="searchQuery" (keyup.enter)="onSearch()">
          <mat-icon matSuffix>search</mat-icon>
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Роль</mat-label>
          <mat-select [(ngModel)]="selectedRole" (selectionChange)="onFilterChange()">
            <mat-option [value]="null">Все роли</mat-option>
            <mat-option value="STUDENT">Студент</mat-option>
            <mat-option value="INSTRUCTOR">Инструктор</mat-option>
            <mat-option value="ORGANIZATION_ADMIN">Админ организации</mat-option>
            <mat-option value="ADMIN">Администратор</mat-option>
          </mat-select>
        </mat-form-field>
      </div>

      @if (isLoading) {
        <div class="loading-container">
          <mat-spinner diameter="40"></mat-spinner>
        </div>
      } @else {
        <div class="table-container">
          <table mat-table [dataSource]="users">
            <ng-container matColumnDef="name">
              <th mat-header-cell *matHeaderCellDef>Имя</th>
              <td mat-cell *matCellDef="let user">{{ user.fullName }}</td>
            </ng-container>

            <ng-container matColumnDef="email">
              <th mat-header-cell *matHeaderCellDef>Email</th>
              <td mat-cell *matCellDef="let user">{{ user.email }}</td>
            </ng-container>

            <ng-container matColumnDef="role">
              <th mat-header-cell *matHeaderCellDef>Роль</th>
              <td mat-cell *matCellDef="let user">
                <mat-chip [class]="'role-' + user.role.toLowerCase()">
                  {{ getRoleName(user.role) }}
                </mat-chip>
              </td>
            </ng-container>

            <ng-container matColumnDef="status">
              <th mat-header-cell *matHeaderCellDef>Статус</th>
              <td mat-cell *matCellDef="let user">
                <mat-chip [class]="user.isActive ? 'active' : 'inactive'">
                  {{ user.isActive ? 'Активен' : 'Неактивен' }}
                </mat-chip>
              </td>
            </ng-container>

            <ng-container matColumnDef="createdAt">
              <th mat-header-cell *matHeaderCellDef>Дата регистрации</th>
              <td mat-cell *matCellDef="let user">{{ user.createdAt | date:'dd.MM.yyyy' }}</td>
            </ng-container>

            <ng-container matColumnDef="actions">
              <th mat-header-cell *matHeaderCellDef>Действия</th>
              <td mat-cell *matCellDef="let user">
                <button mat-icon-button [matMenuTriggerFor]="menu">
                  <mat-icon>more_vert</mat-icon>
                </button>
                <mat-menu #menu="matMenu">
                  <button mat-menu-item (click)="changeRole(user, 'STUDENT')">
                    <mat-icon>person</mat-icon>
                    <span>Сделать студентом</span>
                  </button>
                  <button mat-menu-item (click)="changeRole(user, 'INSTRUCTOR')">
                    <mat-icon>school</mat-icon>
                    <span>Сделать инструктором</span>
                  </button>
                  <button mat-menu-item (click)="changeRole(user, 'ADMIN')">
                    <mat-icon>admin_panel_settings</mat-icon>
                    <span>Сделать администратором</span>
                  </button>
                  <mat-divider></mat-divider>
                  @if (user.isActive) {
                    <button mat-menu-item (click)="deactivateUser(user)">
                      <mat-icon>block</mat-icon>
                      <span>Деактивировать</span>
                    </button>
                  } @else {
                    <button mat-menu-item (click)="activateUser(user)">
                      <mat-icon>check_circle</mat-icon>
                      <span>Активировать</span>
                    </button>
                  }
                </mat-menu>
              </td>
            </ng-container>

            <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
            <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
          </table>
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
    .admin-container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 24px;
    }

    .page-header {
      margin-bottom: 24px;

      h1 { margin: 0; }
    }

    .filters {
      display: flex;
      gap: 16px;
      margin-bottom: 24px;

      mat-form-field {
        min-width: 200px;
      }
    }

    .loading-container {
      display: flex;
      justify-content: center;
      padding: 60px;
    }

    .table-container {
      overflow-x: auto;
      margin-bottom: 16px;
    }

    table {
      width: 100%;

      .role-student { background: #4caf50; color: white; }
      .role-instructor { background: #2196f3; color: white; }
      .role-organization_admin { background: #ff9800; color: white; }
      .role-admin { background: #9c27b0; color: white; }

      .active { background: #4caf50; color: white; }
      .inactive { background: #f44336; color: white; }
    }
  `]
})
export class UserManagementComponent implements OnInit {
  private userService = inject(UserService);
  private snackBar = inject(MatSnackBar);

  users: User[] = [];
  displayedColumns = ['name', 'email', 'role', 'status', 'createdAt', 'actions'];
  searchQuery = '';
  selectedRole: string | null = null;
  currentPage = 0;
  pageSize = 20;
  totalElements = 0;
  isLoading = true;

  ngOnInit(): void {
    this.loadUsers();
  }

  loadUsers(): void {
    this.isLoading = true;

    if (this.searchQuery) {
      this.userService.searchUsers(this.searchQuery, this.currentPage, this.pageSize).subscribe({
        next: response => this.handleResponse(response),
        error: () => this.isLoading = false
      });
    } else if (this.selectedRole) {
      this.userService.getUsersByRole(this.selectedRole as UserRole, this.currentPage, this.pageSize).subscribe({
        next: response => this.handleResponse(response),
        error: () => this.isLoading = false
      });
    } else {
      this.userService.getAllUsers(this.currentPage, this.pageSize).subscribe({
        next: response => this.handleResponse(response),
        error: () => this.isLoading = false
      });
    }
  }

  handleResponse(response: any): void {
    this.users = response.content;
    this.totalElements = response.totalElements;
    this.isLoading = false;
  }

  onSearch(): void {
    this.currentPage = 0;
    this.loadUsers();
  }

  onFilterChange(): void {
    this.currentPage = 0;
    this.searchQuery = '';
    this.loadUsers();
  }

  onPageChange(event: PageEvent): void {
    this.currentPage = event.pageIndex;
    this.pageSize = event.pageSize;
    this.loadUsers();
  }

  changeRole(user: User, role: string): void {
    this.userService.updateUserRole(user.id, role as UserRole).subscribe({
      next: () => {
        this.snackBar.open('Роль пользователя изменена', 'Закрыть', { duration: 3000 });
        this.loadUsers();
      },
      error: () => this.snackBar.open('Ошибка изменения роли', 'Закрыть', { duration: 5000 })
    });
  }

  deactivateUser(user: User): void {
    this.userService.deactivateUser(user.id).subscribe({
      next: () => {
        this.snackBar.open('Пользователь деактивирован', 'Закрыть', { duration: 3000 });
        this.loadUsers();
      },
      error: () => this.snackBar.open('Ошибка деактивации', 'Закрыть', { duration: 5000 })
    });
  }

  activateUser(user: User): void {
    this.userService.activateUser(user.id).subscribe({
      next: () => {
        this.snackBar.open('Пользователь активирован', 'Закрыть', { duration: 3000 });
        this.loadUsers();
      },
      error: () => this.snackBar.open('Ошибка активации', 'Закрыть', { duration: 5000 })
    });
  }

  getRoleName(role: string): string {
    const roles: { [key: string]: string } = {
      'STUDENT': 'Студент',
      'INSTRUCTOR': 'Инструктор',
      'ORGANIZATION_ADMIN': 'Админ орг.',
      'ADMIN': 'Админ'
    };
    return roles[role] || role;
  }
}
