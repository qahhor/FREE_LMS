import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatCardModule } from '@angular/material/card';
import { MatSnackBar } from '@angular/material/snack-bar';
import { CategoryService } from '@core/services/category.service';
import { Category } from '@core/models';

@Component({
  selector: 'app-category-management',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatDialogModule,
    MatProgressSpinnerModule,
    MatCardModule
  ],
  template: `
    <div class="admin-container">
      <header class="page-header">
        <h1>Управление категориями</h1>
        <button mat-raised-button color="primary" (click)="showAddForm = !showAddForm">
          <mat-icon>add</mat-icon>
          Добавить категорию
        </button>
      </header>

      @if (showAddForm) {
        <mat-card class="add-form-card">
          <mat-card-content>
            <h3>Новая категория</h3>
            <div class="form-row">
              <mat-form-field appearance="outline">
                <mat-label>Название</mat-label>
                <input matInput [(ngModel)]="newCategory.name">
              </mat-form-field>
              <mat-form-field appearance="outline">
                <mat-label>Описание</mat-label>
                <input matInput [(ngModel)]="newCategory.description">
              </mat-form-field>
              <mat-form-field appearance="outline">
                <mat-label>Цвет</mat-label>
                <input matInput [(ngModel)]="newCategory.color" placeholder="#3f51b5">
              </mat-form-field>
            </div>
            <div class="form-actions">
              <button mat-button (click)="showAddForm = false">Отмена</button>
              <button mat-raised-button color="primary" (click)="createCategory()" [disabled]="!newCategory.name">
                Создать
              </button>
            </div>
          </mat-card-content>
        </mat-card>
      }

      @if (isLoading) {
        <div class="loading-container">
          <mat-spinner diameter="40"></mat-spinner>
        </div>
      } @else {
        <div class="table-container">
          <table mat-table [dataSource]="categories">
            <ng-container matColumnDef="name">
              <th mat-header-cell *matHeaderCellDef>Название</th>
              <td mat-cell *matCellDef="let cat">
                <div class="category-name">
                  <span class="color-dot" [style.background-color]="cat.color || '#3f51b5'"></span>
                  {{ cat.name }}
                </div>
              </td>
            </ng-container>

            <ng-container matColumnDef="slug">
              <th mat-header-cell *matHeaderCellDef>Slug</th>
              <td mat-cell *matCellDef="let cat">{{ cat.slug }}</td>
            </ng-container>

            <ng-container matColumnDef="description">
              <th mat-header-cell *matHeaderCellDef>Описание</th>
              <td mat-cell *matCellDef="let cat">{{ cat.description || '-' }}</td>
            </ng-container>

            <ng-container matColumnDef="courses">
              <th mat-header-cell *matHeaderCellDef>Курсов</th>
              <td mat-cell *matCellDef="let cat">{{ cat.coursesCount }}</td>
            </ng-container>

            <ng-container matColumnDef="actions">
              <th mat-header-cell *matHeaderCellDef>Действия</th>
              <td mat-cell *matCellDef="let cat">
                <button mat-icon-button color="warn" (click)="deleteCategory(cat)">
                  <mat-icon>delete</mat-icon>
                </button>
              </td>
            </ng-container>

            <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
            <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
          </table>
        </div>
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
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 24px;

      h1 { margin: 0; }
    }

    .add-form-card {
      margin-bottom: 24px;

      h3 { margin: 0 0 16px; }

      .form-row {
        display: flex;
        gap: 16px;
        flex-wrap: wrap;

        mat-form-field { flex: 1; min-width: 200px; }
      }

      .form-actions {
        display: flex;
        gap: 8px;
        justify-content: flex-end;
      }
    }

    .loading-container {
      display: flex;
      justify-content: center;
      padding: 60px;
    }

    .table-container {
      overflow-x: auto;
    }

    table {
      width: 100%;

      .category-name {
        display: flex;
        align-items: center;
        gap: 8px;

        .color-dot {
          width: 12px;
          height: 12px;
          border-radius: 50%;
        }
      }
    }
  `]
})
export class CategoryManagementComponent implements OnInit {
  private categoryService = inject(CategoryService);
  private snackBar = inject(MatSnackBar);

  categories: Category[] = [];
  displayedColumns = ['name', 'slug', 'description', 'courses', 'actions'];
  isLoading = true;
  showAddForm = false;
  newCategory = { name: '', description: '', color: '' };

  ngOnInit(): void {
    this.loadCategories();
  }

  loadCategories(): void {
    this.isLoading = true;
    this.categoryService.getAllCategories().subscribe({
      next: categories => {
        this.categories = categories;
        this.isLoading = false;
      },
      error: () => this.isLoading = false
    });
  }

  createCategory(): void {
    this.categoryService.createCategory(
      this.newCategory.name,
      this.newCategory.description || undefined,
      undefined,
      undefined,
      this.newCategory.color || undefined
    ).subscribe({
      next: () => {
        this.snackBar.open('Категория создана', 'Закрыть', { duration: 3000 });
        this.showAddForm = false;
        this.newCategory = { name: '', description: '', color: '' };
        this.loadCategories();
      },
      error: () => this.snackBar.open('Ошибка создания категории', 'Закрыть', { duration: 5000 })
    });
  }

  deleteCategory(category: Category): void {
    if (confirm(`Удалить категорию "${category.name}"?`)) {
      this.categoryService.deleteCategory(category.id).subscribe({
        next: () => {
          this.snackBar.open('Категория удалена', 'Закрыть', { duration: 3000 });
          this.loadCategories();
        },
        error: () => this.snackBar.open('Ошибка удаления категории', 'Закрыть', { duration: 5000 })
      });
    }
  }
}
