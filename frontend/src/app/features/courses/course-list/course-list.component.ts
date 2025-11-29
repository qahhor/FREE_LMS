import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { CourseService } from '@core/services/course.service';
import { CategoryService } from '@core/services/category.service';
import { Course, Category, CourseLevel, PagedResponse } from '@core/models';

@Component({
  selector: 'app-course-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatPaginatorModule,
    MatProgressSpinnerModule,
    MatChipsModule
  ],
  template: `
    <div class="courses-container">
      <header class="page-header">
        <h1>{{ categoryName || 'Все курсы' }}</h1>
        <p>Найдите курс для своего развития</p>
      </header>

      <!-- Filters -->
      <div class="filters-section">
        <mat-form-field appearance="outline" class="search-field">
          <mat-label>Поиск курсов</mat-label>
          <input matInput [(ngModel)]="searchQuery" (keyup.enter)="onSearch()" placeholder="Введите название...">
          <button mat-icon-button matSuffix (click)="onSearch()">
            <mat-icon>search</mat-icon>
          </button>
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Категория</mat-label>
          <mat-select [(ngModel)]="selectedCategoryId" (selectionChange)="onFilterChange()">
            <mat-option [value]="null">Все категории</mat-option>
            @for (cat of categories; track cat.id) {
              <mat-option [value]="cat.id">{{ cat.name }}</mat-option>
            }
          </mat-select>
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Уровень</mat-label>
          <mat-select [(ngModel)]="selectedLevel" (selectionChange)="onFilterChange()">
            <mat-option [value]="null">Все уровни</mat-option>
            <mat-option value="BEGINNER">Начинающий</mat-option>
            <mat-option value="INTERMEDIATE">Средний</mat-option>
            <mat-option value="ADVANCED">Продвинутый</mat-option>
            <mat-option value="ALL_LEVELS">Все уровни</mat-option>
          </mat-select>
        </mat-form-field>
      </div>

      <!-- Results -->
      @if (isLoading) {
        <div class="loading-container">
          <mat-spinner diameter="50"></mat-spinner>
        </div>
      } @else if (courses.length === 0) {
        <div class="empty-state">
          <mat-icon>search_off</mat-icon>
          <h3>Курсы не найдены</h3>
          <p>Попробуйте изменить параметры поиска</p>
        </div>
      } @else {
        <div class="results-info">
          Найдено {{ totalElements }} курсов
        </div>

        <div class="courses-grid">
          @for (course of courses; track course.id) {
            <mat-card class="course-card card-hover">
              <img mat-card-image [src]="course.thumbnailUrl || 'assets/images/course-placeholder.jpg'"
                   [alt]="course.title">
              <mat-card-content>
                <div class="course-category">{{ course.categoryName }}</div>
                <h3 class="course-title">{{ course.title }}</h3>
                <p class="course-instructor">{{ course.instructorName }}</p>
                <p class="course-description">{{ course.shortDescription }}</p>

                <div class="course-meta">
                  <span class="rating">
                    <mat-icon>star</mat-icon>
                    {{ course.rating | number:'1.1-1' }}
                    ({{ course.reviewsCount }})
                  </span>
                  <span class="students">
                    <mat-icon>people</mat-icon>
                    {{ course.enrollmentCount }}
                  </span>
                  <span class="duration">
                    <mat-icon>schedule</mat-icon>
                    {{ course.duration }} ч
                  </span>
                </div>

                <div class="course-level">
                  <mat-chip-set>
                    <mat-chip [class]="'level-' + course.level.toLowerCase()">
                      {{ getLevelName(course.level) }}
                    </mat-chip>
                  </mat-chip-set>
                </div>

                <div class="course-price">
                  @if (course.originalPrice && course.originalPrice > course.price) {
                    <span class="original-price">{{ course.originalPrice | number }} {{ course.currency }}</span>
                  }
                  @if (course.price > 0) {
                    <span class="current-price">{{ course.price | number }} {{ course.currency }}</span>
                  } @else {
                    <span class="free-badge">Бесплатно</span>
                  }
                </div>
              </mat-card-content>

              <mat-card-actions>
                <a mat-raised-button color="primary" [routerLink]="['/courses', course.slug]">
                  Подробнее
                </a>
              </mat-card-actions>
            </mat-card>
          }
        </div>

        <mat-paginator
          [length]="totalElements"
          [pageSize]="pageSize"
          [pageIndex]="currentPage"
          [pageSizeOptions]="[12, 24, 48]"
          (page)="onPageChange($event)"
          showFirstLastButtons>
        </mat-paginator>
      }
    </div>
  `,
  styles: [`
    .courses-container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 24px;
    }

    .page-header {
      margin-bottom: 32px;

      h1 {
        margin: 0 0 8px;
        font-size: 32px;
      }

      p {
        margin: 0;
        color: #666;
      }
    }

    .filters-section {
      display: flex;
      gap: 16px;
      flex-wrap: wrap;
      margin-bottom: 24px;

      .search-field {
        flex: 1;
        min-width: 250px;
      }

      mat-form-field {
        min-width: 150px;
      }
    }

    .loading-container {
      display: flex;
      justify-content: center;
      padding: 80px;
    }

    .empty-state {
      text-align: center;
      padding: 80px 24px;

      mat-icon {
        font-size: 80px;
        width: 80px;
        height: 80px;
        color: #ccc;
      }

      h3 {
        margin: 16px 0 8px;
        color: #666;
      }

      p {
        color: #999;
      }
    }

    .results-info {
      margin-bottom: 16px;
      color: #666;
    }

    .courses-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: 24px;
      margin-bottom: 24px;
    }

    .course-card {
      display: flex;
      flex-direction: column;

      img {
        height: 180px;
        object-fit: cover;
      }

      mat-card-content {
        flex: 1;
        display: flex;
        flex-direction: column;
      }

      .course-category {
        font-size: 12px;
        color: #3f51b5;
        text-transform: uppercase;
        margin-bottom: 8px;
      }

      .course-title {
        font-size: 18px;
        margin: 0 0 8px;
        line-height: 1.3;
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
      }

      .course-instructor {
        color: #666;
        font-size: 14px;
        margin: 0 0 8px;
      }

      .course-description {
        color: #666;
        font-size: 14px;
        margin: 0 0 12px;
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
      }

      .course-meta {
        display: flex;
        gap: 12px;
        font-size: 13px;
        color: #666;
        margin-bottom: 12px;

        span {
          display: flex;
          align-items: center;
          gap: 4px;

          mat-icon {
            font-size: 16px;
            width: 16px;
            height: 16px;
          }
        }

        .rating mat-icon {
          color: #ffc107;
        }
      }

      .course-level {
        margin-bottom: 12px;

        .level-beginner {
          background-color: #4caf50;
          color: white;
        }

        .level-intermediate {
          background-color: #ff9800;
          color: white;
        }

        .level-advanced {
          background-color: #f44336;
          color: white;
        }

        .level-all_levels {
          background-color: #3f51b5;
          color: white;
        }
      }

      .course-price {
        margin-top: auto;
        padding-top: 12px;

        .original-price {
          text-decoration: line-through;
          color: #999;
          margin-right: 8px;
        }

        .current-price {
          font-size: 20px;
          font-weight: 500;
          color: #3f51b5;
        }

        .free-badge {
          font-size: 20px;
          font-weight: 500;
          color: #4caf50;
        }
      }
    }

    @media (max-width: 600px) {
      .filters-section {
        flex-direction: column;

        mat-form-field {
          width: 100%;
        }
      }
    }
  `]
})
export class CourseListComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private courseService = inject(CourseService);
  private categoryService = inject(CategoryService);

  courses: Course[] = [];
  categories: Category[] = [];
  categoryName: string | null = null;

  searchQuery = '';
  selectedCategoryId: number | null = null;
  selectedLevel: string | null = null;

  currentPage = 0;
  pageSize = 12;
  totalElements = 0;

  isLoading = true;

  ngOnInit(): void {
    this.loadCategories();

    this.route.paramMap.subscribe(params => {
      const categorySlug = params.get('slug');
      if (categorySlug) {
        this.loadCoursesByCategory(categorySlug);
      } else {
        this.loadCourses();
      }
    });
  }

  loadCategories(): void {
    this.categoryService.getAllCategories().subscribe({
      next: categories => this.categories = categories
    });
  }

  loadCourses(): void {
    this.isLoading = true;

    if (this.searchQuery) {
      this.courseService.searchCourses(this.searchQuery, this.currentPage, this.pageSize).subscribe({
        next: response => this.handleResponse(response),
        error: () => this.isLoading = false
      });
    } else if (this.selectedCategoryId || this.selectedLevel) {
      this.courseService.filterCourses({
        categoryId: this.selectedCategoryId ?? undefined,
        level: this.selectedLevel as CourseLevel ?? undefined
      }, this.currentPage, this.pageSize).subscribe({
        next: response => this.handleResponse(response),
        error: () => this.isLoading = false
      });
    } else {
      this.courseService.getCourses(this.currentPage, this.pageSize).subscribe({
        next: response => this.handleResponse(response),
        error: () => this.isLoading = false
      });
    }
  }

  loadCoursesByCategory(slug: string): void {
    this.isLoading = true;
    this.categoryService.getCategoryBySlug(slug).subscribe({
      next: category => {
        this.categoryName = category.name;
        this.selectedCategoryId = category.id;
        this.loadCourses();
      },
      error: () => {
        this.categoryName = null;
        this.loadCourses();
      }
    });
  }

  handleResponse(response: PagedResponse<Course>): void {
    this.courses = response.content;
    this.totalElements = response.totalElements;
    this.isLoading = false;
  }

  onSearch(): void {
    this.currentPage = 0;
    this.loadCourses();
  }

  onFilterChange(): void {
    this.currentPage = 0;
    this.categoryName = null;
    this.loadCourses();
  }

  onPageChange(event: PageEvent): void {
    this.currentPage = event.pageIndex;
    this.pageSize = event.pageSize;
    this.loadCourses();
  }

  getLevelName(level: CourseLevel): string {
    const levels: { [key: string]: string } = {
      'BEGINNER': 'Начинающий',
      'INTERMEDIATE': 'Средний',
      'ADVANCED': 'Продвинутый',
      'ALL_LEVELS': 'Все уровни'
    };
    return levels[level] || level;
  }
}
