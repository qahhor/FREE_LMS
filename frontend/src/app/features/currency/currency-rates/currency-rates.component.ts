import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { CurrencyService } from '@core/services/currency.service';
import { CurrencyRate } from '@core/models';

@Component({
  selector: 'app-currency-rates',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatTableModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatDatepickerModule,
    MatNativeDateModule
  ],
  template: `
    <div class="currency-container">
      <header class="page-header">
        <h1>Курсы валют ЦБ Узбекистана</h1>
        <p>Актуальные курсы валют от Центрального банка Республики Узбекистан</p>
      </header>

      <!-- Converter Card -->
      <mat-card class="converter-card">
        <mat-card-header>
          <mat-card-title>Конвертер валют</mat-card-title>
        </mat-card-header>
        <mat-card-content>
          <div class="converter-form">
            <mat-form-field appearance="outline">
              <mat-label>Сумма</mat-label>
              <input matInput type="number" [(ngModel)]="convertAmount" (ngModelChange)="onConvert()">
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Валюта</mat-label>
              <mat-select [(ngModel)]="selectedCurrency" (selectionChange)="onConvert()">
                @for (rate of rates; track rate.code) {
                  <mat-option [value]="rate.code">{{ rate.code }} - {{ rate.ccyNameRu }}</mat-option>
                }
              </mat-select>
            </mat-form-field>

            <button mat-icon-button (click)="swapDirection()">
              <mat-icon>swap_horiz</mat-icon>
            </button>

            <mat-form-field appearance="outline" class="result-field">
              <mat-label>{{ convertToUzs ? 'UZS' : selectedCurrency }}</mat-label>
              <input matInput [value]="convertResult | number:'1.2-2'" readonly>
            </mat-form-field>
          </div>
          <p class="converter-direction">
            {{ convertToUzs ? 'Конвертация в UZS' : 'Конвертация из UZS' }}
          </p>
        </mat-card-content>
      </mat-card>

      <!-- Rates Table -->
      <mat-card class="rates-card">
        <mat-card-header>
          <mat-card-title>Все курсы валют</mat-card-title>
        </mat-card-header>
        <mat-card-content>
          @if (isLoading) {
            <div class="loading-container">
              <mat-spinner diameter="40"></mat-spinner>
            </div>
          } @else {
            <div class="table-container">
              <table mat-table [dataSource]="rates" class="rates-table">
                <ng-container matColumnDef="code">
                  <th mat-header-cell *matHeaderCellDef>Код</th>
                  <td mat-cell *matCellDef="let rate">
                    <strong>{{ rate.code }}</strong>
                  </td>
                </ng-container>

                <ng-container matColumnDef="name">
                  <th mat-header-cell *matHeaderCellDef>Валюта</th>
                  <td mat-cell *matCellDef="let rate">{{ rate.ccyNameRu }}</td>
                </ng-container>

                <ng-container matColumnDef="nominal">
                  <th mat-header-cell *matHeaderCellDef>Номинал</th>
                  <td mat-cell *matCellDef="let rate">{{ rate.nominal }}</td>
                </ng-container>

                <ng-container matColumnDef="rate">
                  <th mat-header-cell *matHeaderCellDef>Курс (UZS)</th>
                  <td mat-cell *matCellDef="let rate">
                    <strong>{{ rate.rate | number:'1.2-2' }}</strong>
                  </td>
                </ng-container>

                <ng-container matColumnDef="diff">
                  <th mat-header-cell *matHeaderCellDef>Изменение</th>
                  <td mat-cell *matCellDef="let rate" [class.positive]="rate.diff > 0" [class.negative]="rate.diff < 0">
                    @if (rate.diff > 0) {
                      <mat-icon>trending_up</mat-icon>
                    } @else if (rate.diff < 0) {
                      <mat-icon>trending_down</mat-icon>
                    } @else {
                      <mat-icon>trending_flat</mat-icon>
                    }
                    {{ rate.diff | number:'1.2-2' }}
                  </td>
                </ng-container>

                <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
                <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
              </table>
            </div>
          }
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .currency-container {
      max-width: 1000px;
      margin: 0 auto;
      padding: 24px;
    }

    .page-header {
      margin-bottom: 24px;
      text-align: center;

      h1 { margin: 0 0 8px; }
      p { margin: 0; color: #666; }
    }

    .converter-card {
      margin-bottom: 24px;

      .converter-form {
        display: flex;
        gap: 16px;
        align-items: center;
        flex-wrap: wrap;

        mat-form-field {
          flex: 1;
          min-width: 150px;
        }

        .result-field {
          flex: 1.5;
        }
      }

      .converter-direction {
        margin: 8px 0 0;
        font-size: 14px;
        color: #666;
      }
    }

    .rates-card {
      .loading-container {
        display: flex;
        justify-content: center;
        padding: 40px;
      }

      .table-container {
        overflow-x: auto;
      }

      .rates-table {
        width: 100%;

        .positive {
          color: #4caf50;

          mat-icon { color: #4caf50; }
        }

        .negative {
          color: #f44336;

          mat-icon { color: #f44336; }
        }

        td {
          mat-icon {
            font-size: 18px;
            width: 18px;
            height: 18px;
            vertical-align: middle;
            margin-right: 4px;
          }
        }
      }
    }
  `]
})
export class CurrencyRatesComponent implements OnInit {
  private currencyService = inject(CurrencyService);

  rates: CurrencyRate[] = [];
  displayedColumns = ['code', 'name', 'nominal', 'rate', 'diff'];
  isLoading = true;

  convertAmount = 1;
  selectedCurrency = 'USD';
  convertToUzs = true;
  convertResult = 0;

  ngOnInit(): void {
    this.loadRates();
  }

  loadRates(): void {
    this.isLoading = true;
    this.currencyService.getAllRates().subscribe({
      next: rates => {
        this.rates = rates;
        this.isLoading = false;
        this.onConvert();
      },
      error: () => this.isLoading = false
    });
  }

  onConvert(): void {
    if (!this.convertAmount || !this.selectedCurrency) return;

    if (this.convertToUzs) {
      this.currencyService.convertToUzs(this.selectedCurrency, this.convertAmount).subscribe({
        next: result => this.convertResult = result
      });
    } else {
      this.currencyService.convertFromUzs(this.selectedCurrency, this.convertAmount).subscribe({
        next: result => this.convertResult = result
      });
    }
  }

  swapDirection(): void {
    this.convertToUzs = !this.convertToUzs;
    this.onConvert();
  }
}
