# Frontend - Angular 17+ SPA

## О Frontend

FREE-LMS Frontend — это современное SPA-приложение на Angular 17+ с Material UI дизайном.

## Технологии

| Технология | Версия | Описание |
|------------|--------|----------|
| **Angular** | 17.3+ | Frontend framework |
| **Angular Material** | 17.3+ | UI компоненты |
| **RxJS** | 7.8+ | Реактивное программирование |
| **TypeScript** | 5.4+ | Язык программирования |

## Структура проекта

```
frontend/
├── src/
│   ├── app/
│   │   ├── core/                    # Ядро приложения
│   │   │   ├── models/              # TypeScript интерфейсы
│   │   │   │   ├── api-response.model.ts
│   │   │   │   ├── user.model.ts
│   │   │   │   ├── auth.model.ts
│   │   │   │   ├── course.model.ts
│   │   │   │   ├── category.model.ts
│   │   │   │   ├── enrollment.model.ts
│   │   │   │   ├── certificate.model.ts
│   │   │   │   ├── payment.model.ts
│   │   │   │   └── currency.model.ts
│   │   │   ├── services/            # API сервисы
│   │   │   │   ├── auth.service.ts
│   │   │   │   ├── course.service.ts
│   │   │   │   ├── category.service.ts
│   │   │   │   ├── enrollment.service.ts
│   │   │   │   ├── certificate.service.ts
│   │   │   │   ├── payment.service.ts
│   │   │   │   ├── user.service.ts
│   │   │   │   └── currency.service.ts
│   │   │   ├── guards/              # Route guards
│   │   │   │   ├── auth.guard.ts
│   │   │   │   └── role.guard.ts
│   │   │   └── interceptors/        # HTTP interceptors
│   │   │       ├── auth.interceptor.ts
│   │   │       └── error.interceptor.ts
│   │   ├── shared/                  # Общие компоненты
│   │   │   └── components/
│   │   │       ├── header/
│   │   │       ├── sidenav/
│   │   │       ├── footer/
│   │   │       ├── unauthorized/
│   │   │       └── not-found/
│   │   ├── features/                # Feature modules
│   │   │   ├── auth/                # Авторизация
│   │   │   │   ├── login/
│   │   │   │   └── register/
│   │   │   ├── dashboard/           # Дашборд
│   │   │   │   ├── home/
│   │   │   │   └── dashboard/
│   │   │   ├── courses/             # Курсы
│   │   │   │   ├── course-list/
│   │   │   │   └── course-detail/
│   │   │   ├── enrollments/         # Записи
│   │   │   │   └── my-courses/
│   │   │   ├── certificates/        # Сертификаты
│   │   │   │   ├── certificate-list/
│   │   │   │   └── certificate-verify/
│   │   │   ├── payments/            # Платежи
│   │   │   │   └── payment-history/
│   │   │   ├── users/               # Профиль
│   │   │   │   └── profile/
│   │   │   ├── currency/            # Курсы валют
│   │   │   │   └── currency-rates/
│   │   │   └── admin/               # Админ панель
│   │   │       ├── admin-dashboard/
│   │   │       ├── user-management/
│   │   │       ├── course-management/
│   │   │       ├── category-management/
│   │   │       └── payment-management/
│   │   ├── app.component.ts
│   │   └── app.routes.ts
│   ├── assets/
│   ├── environments/
│   │   ├── environment.ts
│   │   └── environment.prod.ts
│   ├── index.html
│   ├── main.ts
│   └── styles.scss
├── package.json
├── angular.json
├── tsconfig.json
└── tsconfig.app.json
```

## Быстрый старт

### Установка зависимостей

```bash
cd frontend
npm install
```

### Запуск в режиме разработки

```bash
npm start
# или
ng serve
```

Приложение будет доступно по адресу: http://localhost:4200

### Сборка для production

```bash
npm run build:prod
# или
ng build --configuration production
```

## Функциональность

### Публичные страницы
- **Главная** — рекомендуемые и популярные курсы
- **Каталог курсов** — поиск и фильтрация
- **Детали курса** — описание, требования, инструктор
- **Курсы валют** — данные ЦБ Узбекистана

### Авторизованные страницы
- **Дашборд** — прогресс, активные курсы, сертификаты
- **Мои курсы** — активные и завершённые
- **Сертификаты** — список и верификация
- **История платежей** — все транзакции
- **Профиль** — редактирование, смена пароля

### Админ панель
- **Пользователи** — управление аккаунтами
- **Курсы** — публикация, архивация
- **Категории** — создание, редактирование
- **Платежи** — обработка, возвраты

## API Интеграция

### Base URL

```typescript
// environment.ts
export const environment = {
  production: false,
  apiUrl: 'http://localhost:8080/api/v1',
  wsUrl: 'ws://localhost:8080/ws'
};
```

### Аутентификация

Frontend использует JWT токены с автоматическим обновлением:

```typescript
// auth.interceptor.ts
// Автоматически добавляет Authorization header
// При 401 ошибке — автоматический refresh token
```

### Сервисы

Все API сервисы находятся в `src/app/core/services/`:

```typescript
// Пример использования
import { CourseService } from '@core/services/course.service';

@Component({...})
export class CourseListComponent {
  private courseService = inject(CourseService);

  courses$ = this.courseService.getCourses();
}
```

## Guards

### AuthGuard
Защищает маршруты, требующие авторизации:

```typescript
{
  path: 'dashboard',
  canActivate: [authGuard],
  loadComponent: () => import('./features/dashboard/dashboard.component')
}
```

### RoleGuard
Защищает маршруты по ролям:

```typescript
{
  path: 'admin',
  canActivate: [authGuard, adminGuard],
  loadComponent: () => import('./features/admin/admin-dashboard.component')
}
```

## Стилизация

### Material Theme
Используется стандартная тема indigo-pink. Кастомизация в `styles.scss`.

### SCSS Variables
```scss
$primary-color: #3f51b5;
$accent-color: #ff4081;
$warn-color: #f44336;
```

## Routing

Все маршруты определены в `app.routes.ts` с lazy loading:

| Путь | Компонент | Guard |
|------|-----------|-------|
| `/` | HomeComponent | - |
| `/auth/login` | LoginComponent | guestGuard |
| `/auth/register` | RegisterComponent | guestGuard |
| `/courses` | CourseListComponent | - |
| `/courses/:slug` | CourseDetailComponent | - |
| `/dashboard` | DashboardComponent | authGuard |
| `/my-courses` | MyCoursesComponent | authGuard |
| `/certificates` | CertificateListComponent | authGuard |
| `/payments` | PaymentHistoryComponent | authGuard |
| `/profile` | ProfileComponent | authGuard |
| `/currency` | CurrencyRatesComponent | - |
| `/admin/*` | Admin components | authGuard, adminGuard |

## Тестирование

```bash
# Unit тесты
npm test

# E2E тесты
npm run e2e
```

## Сборка Docker

```dockerfile
# Dockerfile для frontend
FROM node:20-alpine as build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build:prod

FROM nginx:alpine
COPY --from=build /app/dist/freelms /usr/share/nginx/html
```

## OpenAPI/Swagger

Полная документация API Backend доступна:
- Swagger UI: `http://localhost:8080/swagger-ui.html`
- OpenAPI JSON: `http://localhost:8080/v3/api-docs`

## Контакты

По вопросам Frontend: opensource@smartup24.com
