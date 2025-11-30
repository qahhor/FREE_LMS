import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [RouterLink, MatIconModule],
  template: `
    <footer class="footer">
      <div class="footer-content">
        <div class="footer-section">
          <h3>FREE-LMS</h3>
          <p>Современная платформа для онлайн обучения</p>
        </div>

        <div class="footer-section">
          <h4>Навигация</h4>
          <ul>
            <li><a routerLink="/">Главная</a></li>
            <li><a routerLink="/courses">Курсы</a></li>
            <li><a routerLink="/currency">Курсы валют</a></li>
          </ul>
        </div>

        <div class="footer-section">
          <h4>Контакты</h4>
          <p>
            <mat-icon>email</mat-icon>
            opensource&#64;smartup24.com
          </p>
        </div>
      </div>

      <div class="footer-bottom">
        <p>&copy; {{ currentYear }} FREE-LMS. Все права защищены.</p>
      </div>
    </footer>
  `,
  styles: [`
    .footer {
      background-color: #1a237e;
      color: white;
      padding: 40px 24px 16px;
      margin-top: auto;
    }

    .footer-content {
      max-width: 1200px;
      margin: 0 auto;
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 32px;
    }

    .footer-section {
      h3 {
        font-size: 20px;
        margin-bottom: 8px;
      }

      h4 {
        font-size: 16px;
        margin-bottom: 12px;
        color: rgba(255, 255, 255, 0.9);
      }

      p {
        color: rgba(255, 255, 255, 0.7);
        display: flex;
        align-items: center;
        gap: 8px;

        mat-icon {
          font-size: 18px;
          width: 18px;
          height: 18px;
        }
      }

      ul {
        list-style: none;
        padding: 0;
        margin: 0;

        li {
          margin-bottom: 8px;

          a {
            color: rgba(255, 255, 255, 0.7);
            text-decoration: none;

            &:hover {
              color: white;
            }
          }
        }
      }
    }

    .footer-bottom {
      max-width: 1200px;
      margin: 32px auto 0;
      padding-top: 16px;
      border-top: 1px solid rgba(255, 255, 255, 0.1);
      text-align: center;

      p {
        color: rgba(255, 255, 255, 0.5);
        font-size: 14px;
        margin: 0;
      }
    }
  `]
})
export class FooterComponent {
  currentYear = new Date().getFullYear();
}
