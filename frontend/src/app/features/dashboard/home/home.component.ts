import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { CourseService } from '@core/services/course.service';
import { CategoryService } from '@core/services/category.service';
import { Course, Category } from '@core/models';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule
  ],
  template: `
    <div class="home-container">
      <!-- Hero Section -->
      <section class="hero">
        <div class="hero-content">
          <h1>Добро пожаловать в FREE-LMS</h1>
          <p>Современная платформа для онлайн обучения. Развивайте навыки с лучшими курсами.</p>
          <div class="hero-actions">
            <a mat-raised-button color="primary" routerLink="/courses">
              <mat-icon>school</mat-icon>
              Смотреть курсы
            </a>
            <a mat-stroked-button routerLink="/auth/register">
              Начать бесплатно
            </a>
          </div>
        </div>
      </section>

      <!-- Featured Courses -->
      <section class="section">
        <div class="section-header">
          <h2>Рекомендуемые курсы</h2>
          <a mat-button color="primary" routerLink="/courses">Все курсы</a>
        </div>

        @if (isLoadingFeatured) {
          <div class="loading-container">
            <mat-spinner diameter="40"></mat-spinner>
          </div>
        } @else {
          <div class="courses-grid">
            @for (course of featuredCourses; track course.id) {
              <mat-card class="course-card card-hover">
                <img mat-card-image [src]="course.thumbnailUrl || 'assets/images/course-placeholder.jpg'"
                     [alt]="course.title">
                <mat-card-content>
                  <div class="course-category">{{ course.categoryName }}</div>
                  <h3 class="course-title">{{ course.title }}</h3>
                  <p class="course-instructor">{{ course.instructorName }}</p>
                  <div class="course-meta">
                    <span class="rating">
                      <mat-icon>star</mat-icon>
                      {{ course.rating | number:'1.1-1' }}
                    </span>
                    <span class="students">{{ course.enrollmentCount }} студентов</span>
                  </div>
                  <div class="course-price">
                    @if (course.price > 0) {
                      {{ course.price | number }} {{ course.currency }}
                    } @else {
                      Бесплатно
                    }
                  </div>
                </mat-card-content>
                <mat-card-actions>
                  <a mat-button color="primary" [routerLink]="['/courses', course.slug]">Подробнее</a>
                </mat-card-actions>
              </mat-card>
            }
          </div>
        }
      </section>

      <!-- Categories -->
      <section class="section categories-section">
        <div class="section-header">
          <h2>Категории</h2>
        </div>

        @if (isLoadingCategories) {
          <div class="loading-container">
            <mat-spinner diameter="40"></mat-spinner>
          </div>
        } @else {
          <div class="categories-grid">
            @for (category of categories; track category.id) {
              <a [routerLink]="['/courses/category', category.slug]" class="category-card card-hover">
                <mat-icon [style.color]="category.color || '#3f51b5'">folder</mat-icon>
                <h4>{{ category.name }}</h4>
                <span>{{ category.coursesCount }} курсов</span>
              </a>
            }
          </div>
        }
      </section>

      <!-- Popular Courses -->
      <section class="section">
        <div class="section-header">
          <h2>Популярные курсы</h2>
          <a mat-button color="primary" routerLink="/courses">Все курсы</a>
        </div>

        @if (isLoadingPopular) {
          <div class="loading-container">
            <mat-spinner diameter="40"></mat-spinner>
          </div>
        } @else {
          <div class="courses-grid">
            @for (course of popularCourses; track course.id) {
              <mat-card class="course-card card-hover">
                <img mat-card-image [src]="course.thumbnailUrl || 'assets/images/course-placeholder.jpg'"
                     [alt]="course.title">
                <mat-card-content>
                  <div class="course-category">{{ course.categoryName }}</div>
                  <h3 class="course-title">{{ course.title }}</h3>
                  <p class="course-instructor">{{ course.instructorName }}</p>
                  <div class="course-meta">
                    <span class="rating">
                      <mat-icon>star</mat-icon>
                      {{ course.rating | number:'1.1-1' }}
                    </span>
                    <span class="students">{{ course.enrollmentCount }} студентов</span>
                  </div>
                  <div class="course-price">
                    @if (course.price > 0) {
                      {{ course.price | number }} {{ course.currency }}
                    } @else {
                      Бесплатно
                    }
                  </div>
                </mat-card-content>
                <mat-card-actions>
                  <a mat-button color="primary" [routerLink]="['/courses', course.slug]">Подробнее</a>
                </mat-card-actions>
              </mat-card>
            }
          </div>
        }
      </section>

      <!-- Stats -->
      <section class="stats-section">
        <div class="stats-grid">
          <div class="stat-card">
            <mat-icon>school</mat-icon>
            <h3>100+</h3>
            <p>Курсов</p>
          </div>
          <div class="stat-card">
            <mat-icon>people</mat-icon>
            <h3>5000+</h3>
            <p>Студентов</p>
          </div>
          <div class="stat-card">
            <mat-icon>workspace_premium</mat-icon>
            <h3>50+</h3>
            <p>Инструкторов</p>
          </div>
          <div class="stat-card">
            <mat-icon>card_membership</mat-icon>
            <h3>1000+</h3>
            <p>Сертификатов</p>
          </div>
        </div>
      </section>
    </div>
  `,
  styles: [`
    .home-container {
      max-width: 1200px;
      margin: 0 auto;
    }

    .hero {
      background: linear-gradient(135deg, #3f51b5 0%, #1a237e 100%);
      color: white;
      padding: 80px 24px;
      margin: -24px -24px 0;
      text-align: center;
    }

    .hero-content {
      max-width: 800px;
      margin: 0 auto;

      h1 {
        font-size: 48px;
        margin-bottom: 16px;
      }

      p {
        font-size: 20px;
        opacity: 0.9;
        margin-bottom: 32px;
      }
    }

    .hero-actions {
      display: flex;
      gap: 16px;
      justify-content: center;

      a {
        mat-icon {
          margin-right: 8px;
        }
      }
    }

    .section {
      padding: 48px 24px;
    }

    .section-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 24px;

      h2 {
        margin: 0;
      }
    }

    .loading-container {
      display: flex;
      justify-content: center;
      padding: 40px;
    }

    .courses-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: 24px;
    }

    .course-card {
      img {
        height: 160px;
        object-fit: cover;
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
        margin: 0 0 12px;
      }

      .course-meta {
        display: flex;
        gap: 16px;
        font-size: 14px;
        color: #666;
        margin-bottom: 12px;

        .rating {
          display: flex;
          align-items: center;
          gap: 4px;

          mat-icon {
            font-size: 16px;
            width: 16px;
            height: 16px;
            color: #ffc107;
          }
        }
      }

      .course-price {
        font-size: 18px;
        font-weight: 500;
        color: #3f51b5;
      }
    }

    .categories-section {
      background-color: #f5f5f5;
      margin: 0 -24px;
      padding: 48px 24px;
    }

    .categories-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
      gap: 16px;
    }

    .category-card {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 24px;
      background: white;
      border-radius: 8px;
      text-decoration: none;
      color: inherit;
      transition: all 0.3s ease;

      mat-icon {
        font-size: 40px;
        width: 40px;
        height: 40px;
        margin-bottom: 12px;
      }

      h4 {
        margin: 0 0 4px;
        text-align: center;
      }

      span {
        color: #666;
        font-size: 14px;
      }

      &:hover {
        transform: translateY(-4px);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
      }
    }

    .stats-section {
      background: linear-gradient(135deg, #3f51b5 0%, #1a237e 100%);
      color: white;
      padding: 64px 24px;
      margin: 0 -24px;
    }

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 32px;
      max-width: 1000px;
      margin: 0 auto;
    }

    .stat-card {
      text-align: center;

      mat-icon {
        font-size: 48px;
        width: 48px;
        height: 48px;
        margin-bottom: 16px;
      }

      h3 {
        font-size: 36px;
        margin: 0 0 8px;
      }

      p {
        margin: 0;
        opacity: 0.8;
      }
    }

    @media (max-width: 768px) {
      .hero-content h1 {
        font-size: 32px;
      }

      .hero-actions {
        flex-direction: column;
      }

      .stats-grid {
        grid-template-columns: repeat(2, 1fr);
      }
    }
  `]
})
export class HomeComponent implements OnInit {
  private courseService = inject(CourseService);
  private categoryService = inject(CategoryService);

  featuredCourses: Course[] = [];
  popularCourses: Course[] = [];
  categories: Category[] = [];

  isLoadingFeatured = true;
  isLoadingPopular = true;
  isLoadingCategories = true;

  ngOnInit(): void {
    this.loadFeaturedCourses();
    this.loadPopularCourses();
    this.loadCategories();
  }

  private loadFeaturedCourses(): void {
    this.courseService.getFeaturedCourses(4).subscribe({
      next: courses => {
        this.featuredCourses = courses;
        this.isLoadingFeatured = false;
      },
      error: () => this.isLoadingFeatured = false
    });
  }

  private loadPopularCourses(): void {
    this.courseService.getPopularCourses(4).subscribe({
      next: courses => {
        this.popularCourses = courses;
        this.isLoadingPopular = false;
      },
      error: () => this.isLoadingPopular = false
    });
  }

  private loadCategories(): void {
    this.categoryService.getRootCategories().subscribe({
      next: categories => {
        this.categories = categories.slice(0, 8);
        this.isLoadingCategories = false;
      },
      error: () => this.isLoadingCategories = false
    });
  }
}
