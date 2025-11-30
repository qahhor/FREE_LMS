import { Routes } from '@angular/router';
import { authGuard, guestGuard } from './core/guards/auth.guard';
import { adminGuard, instructorGuard } from './core/guards/role.guard';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./features/dashboard/home/home.component')
      .then(m => m.HomeComponent)
  },
  {
    path: 'auth',
    canActivate: [guestGuard],
    children: [
      {
        path: 'login',
        loadComponent: () => import('./features/auth/login/login.component')
          .then(m => m.LoginComponent)
      },
      {
        path: 'register',
        loadComponent: () => import('./features/auth/register/register.component')
          .then(m => m.RegisterComponent)
      },
      {
        path: '',
        redirectTo: 'login',
        pathMatch: 'full'
      }
    ]
  },
  {
    path: 'courses',
    children: [
      {
        path: '',
        loadComponent: () => import('./features/courses/course-list/course-list.component')
          .then(m => m.CourseListComponent)
      },
      {
        path: 'category/:slug',
        loadComponent: () => import('./features/courses/course-list/course-list.component')
          .then(m => m.CourseListComponent)
      },
      {
        path: ':slug',
        loadComponent: () => import('./features/courses/course-detail/course-detail.component')
          .then(m => m.CourseDetailComponent)
      }
    ]
  },
  {
    path: 'dashboard',
    canActivate: [authGuard],
    loadComponent: () => import('./features/dashboard/dashboard/dashboard.component')
      .then(m => m.DashboardComponent)
  },
  {
    path: 'my-courses',
    canActivate: [authGuard],
    loadComponent: () => import('./features/enrollments/my-courses/my-courses.component')
      .then(m => m.MyCoursesComponent)
  },
  {
    path: 'certificates',
    canActivate: [authGuard],
    children: [
      {
        path: '',
        loadComponent: () => import('./features/certificates/certificate-list/certificate-list.component')
          .then(m => m.CertificateListComponent)
      },
      {
        path: 'verify/:number',
        loadComponent: () => import('./features/certificates/certificate-verify/certificate-verify.component')
          .then(m => m.CertificateVerifyComponent)
      }
    ]
  },
  {
    path: 'payments',
    canActivate: [authGuard],
    loadComponent: () => import('./features/payments/payment-history/payment-history.component')
      .then(m => m.PaymentHistoryComponent)
  },
  {
    path: 'profile',
    canActivate: [authGuard],
    loadComponent: () => import('./features/users/profile/profile.component')
      .then(m => m.ProfileComponent)
  },
  {
    path: 'currency',
    loadComponent: () => import('./features/currency/currency-rates/currency-rates.component')
      .then(m => m.CurrencyRatesComponent)
  },
  {
    path: 'admin',
    canActivate: [authGuard, adminGuard],
    children: [
      {
        path: '',
        loadComponent: () => import('./features/admin/admin-dashboard/admin-dashboard.component')
          .then(m => m.AdminDashboardComponent)
      },
      {
        path: 'users',
        loadComponent: () => import('./features/admin/user-management/user-management.component')
          .then(m => m.UserManagementComponent)
      },
      {
        path: 'courses',
        loadComponent: () => import('./features/admin/course-management/course-management.component')
          .then(m => m.CourseManagementComponent)
      },
      {
        path: 'categories',
        loadComponent: () => import('./features/admin/category-management/category-management.component')
          .then(m => m.CategoryManagementComponent)
      },
      {
        path: 'payments',
        loadComponent: () => import('./features/admin/payment-management/payment-management.component')
          .then(m => m.PaymentManagementComponent)
      }
    ]
  },
  {
    path: 'unauthorized',
    loadComponent: () => import('./shared/components/unauthorized/unauthorized.component')
      .then(m => m.UnauthorizedComponent)
  },
  {
    path: '**',
    loadComponent: () => import('./shared/components/not-found/not-found.component')
      .then(m => m.NotFoundComponent)
  }
];
