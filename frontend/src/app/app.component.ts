import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { HeaderComponent } from './shared/components/header/header.component';
import { SidenavComponent } from './shared/components/sidenav/sidenav.component';
import { FooterComponent } from './shared/components/footer/footer.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    RouterOutlet,
    MatToolbarModule,
    MatSidenavModule,
    MatIconModule,
    MatButtonModule,
    MatMenuModule,
    HeaderComponent,
    SidenavComponent,
    FooterComponent
  ],
  template: `
    <div class="app-container">
      <app-header (toggleSidenav)="sidenav.toggle()"></app-header>

      <mat-sidenav-container class="sidenav-container">
        <mat-sidenav #sidenav mode="over" class="sidenav">
          <app-sidenav (closeSidenav)="sidenav.close()"></app-sidenav>
        </mat-sidenav>

        <mat-sidenav-content class="main-content">
          <main>
            <router-outlet></router-outlet>
          </main>
          <app-footer></app-footer>
        </mat-sidenav-content>
      </mat-sidenav-container>
    </div>
  `,
  styles: [`
    .app-container {
      display: flex;
      flex-direction: column;
      min-height: 100vh;
    }

    .sidenav-container {
      flex: 1;
    }

    .sidenav {
      width: 280px;
    }

    .main-content {
      display: flex;
      flex-direction: column;
      min-height: calc(100vh - 64px);
    }

    main {
      flex: 1;
    }
  `]
})
export class AppComponent {
  title = 'FREE-LMS';
}
