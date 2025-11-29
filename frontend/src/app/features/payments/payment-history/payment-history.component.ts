import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { PaymentService } from '@core/services/payment.service';
import { Payment, PaymentStatus } from '@core/models';

@Component({
  selector: 'app-payment-history',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    MatPaginatorModule
  ],
  template: `
    <div class="payments-container">
      <header class="page-header">
        <h1>История платежей</h1>
        <p>Ваши платежи за курсы</p>
      </header>

      @if (isLoading) {
        <div class="loading-container">
          <mat-spinner diameter="40"></mat-spinner>
        </div>
      } @else if (payments.length === 0) {
        <div class="empty-state">
          <mat-icon>payment</mat-icon>
          <h3>Нет платежей</h3>
          <p>История ваших платежей пуста</p>
        </div>
      } @else {
        <div class="table-container">
          <table mat-table [dataSource]="payments" class="payments-table">
            <ng-container matColumnDef="course">
              <th mat-header-cell *matHeaderCellDef>Курс</th>
              <td mat-cell *matCellDef="let payment">
                <a [routerLink]="['/courses', payment.courseId]">{{ payment.courseTitle }}</a>
              </td>
            </ng-container>

            <ng-container matColumnDef="amount">
              <th mat-header-cell *matHeaderCellDef>Сумма</th>
              <td mat-cell *matCellDef="let payment">
                {{ payment.amount | number }} {{ payment.currency }}
              </td>
            </ng-container>

            <ng-container matColumnDef="status">
              <th mat-header-cell *matHeaderCellDef>Статус</th>
              <td mat-cell *matCellDef="let payment">
                <mat-chip [class]="'status-' + payment.status.toLowerCase()">
                  {{ getStatusName(payment.status) }}
                </mat-chip>
              </td>
            </ng-container>

            <ng-container matColumnDef="date">
              <th mat-header-cell *matHeaderCellDef>Дата</th>
              <td mat-cell *matCellDef="let payment">
                {{ payment.createdAt | date:'dd.MM.yyyy HH:mm' }}
              </td>
            </ng-container>

            <ng-container matColumnDef="method">
              <th mat-header-cell *matHeaderCellDef>Способ оплаты</th>
              <td mat-cell *matCellDef="let payment">
                {{ getMethodName(payment.paymentMethod) }}
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
    .payments-container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 24px;
    }

    .page-header {
      margin-bottom: 24px;

      h1 { margin: 0 0 8px; }
      p { margin: 0; color: #666; }
    }

    .loading-container {
      display: flex;
      justify-content: center;
      padding: 60px;
    }

    .empty-state {
      text-align: center;
      padding: 60px 24px;

      mat-icon {
        font-size: 64px;
        width: 64px;
        height: 64px;
        color: #ccc;
      }

      h3 { margin: 16px 0 8px; color: #666; }
      p { color: #999; }
    }

    .table-container {
      overflow-x: auto;
      margin-bottom: 16px;
    }

    .payments-table {
      width: 100%;

      a {
        color: #3f51b5;
        text-decoration: none;

        &:hover { text-decoration: underline; }
      }

      .status-completed {
        background-color: #4caf50;
        color: white;
      }

      .status-pending {
        background-color: #ff9800;
        color: white;
      }

      .status-failed, .status-cancelled {
        background-color: #f44336;
        color: white;
      }

      .status-refunded {
        background-color: #9e9e9e;
        color: white;
      }
    }
  `]
})
export class PaymentHistoryComponent implements OnInit {
  private paymentService = inject(PaymentService);

  payments: Payment[] = [];
  displayedColumns = ['course', 'amount', 'status', 'date', 'method'];
  currentPage = 0;
  pageSize = 20;
  totalElements = 0;
  isLoading = true;

  ngOnInit(): void {
    this.loadPayments();
  }

  loadPayments(): void {
    this.isLoading = true;
    this.paymentService.getMyPayments(this.currentPage, this.pageSize).subscribe({
      next: response => {
        this.payments = response.content;
        this.totalElements = response.totalElements;
        this.isLoading = false;
      },
      error: () => this.isLoading = false
    });
  }

  onPageChange(event: PageEvent): void {
    this.currentPage = event.pageIndex;
    this.pageSize = event.pageSize;
    this.loadPayments();
  }

  getStatusName(status: PaymentStatus): string {
    const statuses: { [key: string]: string } = {
      'PENDING': 'Ожидание',
      'COMPLETED': 'Завершён',
      'FAILED': 'Ошибка',
      'REFUNDED': 'Возврат',
      'CANCELLED': 'Отменён'
    };
    return statuses[status] || status;
  }

  getMethodName(method: string): string {
    const methods: { [key: string]: string } = {
      'CARD': 'Карта',
      'PAYME': 'Payme',
      'CLICK': 'Click',
      'BANK_TRANSFER': 'Банковский перевод'
    };
    return methods[method] || method;
  }
}
