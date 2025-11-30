import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatSnackBar } from '@angular/material/snack-bar';
import { CourseService } from '@core/services/course.service';
import { Course } from '@core/models';

@Component({
  selector: 'app-course-management',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatMenuModule,
    MatProgressSpinnerModule,
    MatPaginatorModule
  ],
  template: `
    <div class="admin-container">
      <header class="page-header">
        <h1>Управление курсами</h1>
      </header>

      @if (isLoading) {
        <div class="loading-container">
          <mat-spinner diameter="40"></mat-spinner>
        </div>
      } @else {
        <div class="table-container">
          <table mat-table [dataSource]="courses">
            <ng-container matColumnDef="title">
              <th mat-header-cell *matHeaderCellDef>Название</th>
              <td mat-cell *matCellDef="let course">
                <a [routerLink]="['/courses', course.slug]">{{ course.title }}</a>
              </td>
            </ng-container>

            <ng-container matColumnDef="instructor">
              <th mat-header-cell *matHeaderCellDef>Инструктор</th>
              <td mat-cell *matCellDef="let course">{{ course.instructorName }}</td>
            </ng-container>

            <ng-container matColumnDef="category">
              <th mat-header-cell *matHeaderCellDef>Категория</th>
              <td mat-cell *matCellDef="let course">{{ course.categoryName }}</td>
            </ng-container>

            <ng-container matColumnDef="status">
              <th mat-header-cell *matHeaderCellDef>Статус</th>
              <td mat-cell *matCellDef="let course">
                <mat-chip [class]="'status-' + course.status.toLowerCase()">
                  {{ getStatusName(course.status) }}
                </mat-chip>
              </td>
            </ng-container>

            <ng-container matColumnDef="price">
              <th mat-header-cell *matHeaderCellDef>Цена</th>
              <td mat-cell *matCellDef="let course">
                {{ course.price > 0 ? (course.price | number) + ' ' + course.currency : 'Бесплатно' }}
              </td>
            </ng-container>

            <ng-container matColumnDef="students">
              <th mat-header-cell *matHeaderCellDef>Студенты</th>
              <td mat-cell *matCellDef="let course">{{ course.enrollmentCount }}</td>
            </ng-container>

            <ng-container matColumnDef="actions">
              <th mat-header-cell *matHeaderCellDef>Действия</th>
              <td mat-cell *matCellDef="let course">
                <button mat-icon-button [matMenuTriggerFor]="menu">
                  <mat-icon>more_vert</mat-icon>
                </button>
                <mat-menu #menu="matMenu">
                  @if (course.status === 'DRAFT') {
                    <button mat-menu-item (click)="publishCourse(course)">
                      <mat-icon>publish</mat-icon>
                      <span>Опубликовать</span>
                    </button>
                  }
                  @if (course.status === 'PUBLISHED') {
                    <button mat-menu-item (click)="archiveCourse(course)">
                      <mat-icon>archive</mat-icon>
                      <span>Архивировать</span>
                    </button>
                  }
                  <button mat-menu-item (click)="deleteCourse(course)">
                    <mat-icon>delete</mat-icon>
                    <span>Удалить</span>
                  </button>
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

      a {
        color: #3f51b5;
        text-decoration: none;

        &:hover { text-decoration: underline; }
      }

      .status-draft { background: #ff9800; color: white; }
      .status-published { background: #4caf50; color: white; }
      .status-archived { background: #9e9e9e; color: white; }
    }
  `]
})
export class CourseManagementComponent implements OnInit {
  private courseService = inject(CourseService);
  private snackBar = inject(MatSnackBar);

  courses: Course[] = [];
  displayedColumns = ['title', 'instructor', 'category', 'status', 'price', 'students', 'actions'];
  currentPage = 0;
  pageSize = 20;
  totalElements = 0;
  isLoading = true;

  ngOnInit(): void {
    this.loadCourses();
  }

  loadCourses(): void {
    this.isLoading = true;
    this.courseService.getCourses(this.currentPage, this.pageSize).subscribe({
      next: response => {
        this.courses = response.content;
        this.totalElements = response.totalElements;
        this.isLoading = false;
      },
      error: () => this.isLoading = false
    });
  }

  onPageChange(event: PageEvent): void {
    this.currentPage = event.pageIndex;
    this.pageSize = event.pageSize;
    this.loadCourses();
  }

  publishCourse(course: Course): void {
    this.courseService.publishCourse(course.id).subscribe({
      next: () => {
        this.snackBar.open('Курс опубликован', 'Закрыть', { duration: 3000 });
        this.loadCourses();
      },
      error: () => this.snackBar.open('Ошибка публикации', 'Закрыть', { duration: 5000 })
    });
  }

  archiveCourse(course: Course): void {
    this.courseService.archiveCourse(course.id).subscribe({
      next: () => {
        this.snackBar.open('Курс архивирован', 'Закрыть', { duration: 3000 });
        this.loadCourses();
      },
      error: () => this.snackBar.open('Ошибка архивации', 'Закрыть', { duration: 5000 })
    });
  }

  deleteCourse(course: Course): void {
    if (confirm(`Удалить курс "${course.title}"?`)) {
      this.courseService.deleteCourse(course.id).subscribe({
        next: () => {
          this.snackBar.open('Курс удалён', 'Закрыть', { duration: 3000 });
          this.loadCourses();
        },
        error: () => this.snackBar.open('Ошибка удаления', 'Закрыть', { duration: 5000 })
      });
    }
  }

  getStatusName(status: string): string {
    const statuses: { [key: string]: string } = {
      'DRAFT': 'Черновик',
      'PUBLISHED': 'Опубликован',
      'ARCHIVED': 'Архив'
    };
    return statuses[status] || status;
  }
}
