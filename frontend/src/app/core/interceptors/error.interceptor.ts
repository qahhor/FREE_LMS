import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { MatSnackBar } from '@angular/material/snack-bar';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const snackBar = inject(MatSnackBar);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      let errorMessage = 'Произошла ошибка';

      if (error.error instanceof ErrorEvent) {
        // Client-side error
        errorMessage = error.error.message;
      } else {
        // Server-side error
        switch (error.status) {
          case 0:
            errorMessage = 'Нет соединения с сервером';
            break;
          case 400:
            errorMessage = error.error?.message || 'Неверный запрос';
            break;
          case 401:
            errorMessage = 'Необходима авторизация';
            break;
          case 403:
            errorMessage = 'Доступ запрещён';
            break;
          case 404:
            errorMessage = 'Ресурс не найден';
            break;
          case 409:
            errorMessage = error.error?.message || 'Конфликт данных';
            break;
          case 422:
            errorMessage = error.error?.message || 'Ошибка валидации';
            break;
          case 500:
            errorMessage = 'Внутренняя ошибка сервера';
            break;
          default:
            errorMessage = error.error?.message || `Ошибка: ${error.status}`;
        }
      }

      // Show error notification (except for 401 which is handled by auth interceptor)
      if (error.status !== 401) {
        snackBar.open(errorMessage, 'Закрыть', {
          duration: 5000,
          horizontalPosition: 'center',
          verticalPosition: 'bottom',
          panelClass: ['error-snackbar']
        });
      }

      return throwError(() => ({ ...error, message: errorMessage }));
    })
  );
};
