import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { OrganizationService } from '../services/organization.service';
import { Organization, OrganizationMember } from '../models/organization.models';

@Component({
  selector: 'app-organization-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  template: `
    <div class="org-dashboard">
      <div class="container">
        <div class="header">
          <h1>Моя организация</h1>
          <button class="btn-primary" (click)="showSettings = !showSettings">
            <i class="icon-settings"></i> Настройки
          </button>
        </div>

        <div *ngIf="loading()" class="loading">
          <div class="spinner"></div>
        </div>

        <div *ngIf="!loading() && organization()">
          <!-- Overview Cards -->
          <div class="cards-grid">
            <div class="stat-card">
              <div class="stat-icon">👥</div>
              <div class="stat-content">
                <h3>Команда</h3>
                <p class="stat-value">{{ members().length }} / {{ organization()!.seats.max || '∞' }}</p>
                <span class="stat-label">участников</span>
              </div>
            </div>

            <div class="stat-card">
              <div class="stat-icon">📚</div>
              <div class="stat-content">
                <h3>Курсы</h3>
                <p class="stat-value">{{ organization()!.courses.used }} / {{ organization()!.courses.max || '∞' }}</p>
                <span class="stat-label">созданных курсов</span>
              </div>
            </div>

            <div class="stat-card">
              <div class="stat-icon">⚡</div>
              <div class="stat-content">
                <h3>Статус</h3>
                <p class="stat-value">{{ organization()!.isActive ? 'Активна' : 'Неактивна' }}</p>
                <span class="stat-label">{{ organization()!.isVerified ? '✓ Верифицирована' : 'Не верифицирована' }}</span>
              </div>
            </div>

            <div class="stat-card">
              <div class="stat-icon">🎨</div>
              <div class="stat-content">
                <h3>Брендинг</h3>
                <p class="stat-value">{{ organization()!.features.whiteLabel ? 'Включен' : 'Выключен' }}</p>
                <span class="stat-label">White-label</span>
              </div>
            </div>
          </div>

          <!-- Team Members -->
          <div class="section">
            <div class="section-header">
              <h2>Команда</h2>
              <button class="btn-secondary" (click)="showInviteModal = true">
                + Пригласить участника
              </button>
            </div>

            <div class="members-list">
              <div *ngFor="let member of members()" class="member-card">
                <div class="member-avatar">
                  {{ member.user.firstName[0] }}{{ member.user.lastName[0] }}
                </div>
                <div class="member-info">
                  <h4>{{ member.user.firstName }} {{ member.user.lastName }}</h4>
                  <p>{{ member.user.email }}</p>
                </div>
                <span class="member-role" [class]="member.role">{{ getRoleLabel(member.role) }}</span>
                <div class="member-actions">
                  <button *ngIf="member.role !== 'owner'" class="btn-icon" (click)="editMember(member)">
                    ✏️
                  </button>
                  <button *ngIf="member.role !== 'owner'" class="btn-icon danger" (click)="removeMember(member)">
                    🗑️
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- Features -->
          <div class="section">
            <h2>Доступные возможности</h2>
            <div class="features-grid">
              <div class="feature-card" [class.enabled]="organization()!.features.whiteLabel">
                <i class="icon">🎨</i>
                <h4>White-label</h4>
                <p>Собственный брендинг</p>
              </div>
              <div class="feature-card" [class.enabled]="organization()!.features.customDomain">
                <i class="icon">🌐</i>
                <h4>Custom Domain</h4>
                <p>Ваш домен</p>
              </div>
              <div class="feature-card" [class.enabled]="organization()!.features.sso">
                <i class="icon">🔐</i>
                <h4>SSO</h4>
                <p>Single Sign-On</p>
              </div>
              <div class="feature-card" [class.enabled]="organization()!.features.apiAccess">
                <i class="icon">⚙️</i>
                <h4>API Access</h4>
                <p>REST API</p>
              </div>
              <div class="feature-card" [class.enabled]="organization()!.features.scorm">
                <i class="icon">📦</i>
                <h4>SCORM</h4>
                <p>SCORM packages</p>
              </div>
              <div class="feature-card" [class.enabled]="organization()!.features.liveSessions">
                <i class="icon">📹</i>
                <h4>Webinars</h4>
                <p>Live sessions</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Invite Modal -->
        <div *ngIf="showInviteModal" class="modal-overlay" (click)="showInviteModal = false">
          <div class="modal" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <h3>Пригласить участника</h3>
              <button class="btn-close" (click)="showInviteModal = false">×</button>
            </div>
            <div class="modal-body">
              <div class="form-group">
                <label>Email</label>
                <input type="email" [(ngModel)]="inviteEmail" placeholder="user@example.com">
              </div>
              <div class="form-group">
                <label>Роль</label>
                <select [(ngModel)]="inviteRole">
                  <option value="member">Участник</option>
                  <option value="instructor">Преподаватель</option>
                  <option value="manager">Менеджер</option>
                  <option value="admin">Администратор</option>
                </select>
              </div>
            </div>
            <div class="modal-footer">
              <button class="btn-secondary" (click)="showInviteModal = false">Отмена</button>
              <button class="btn-primary" (click)="inviteMember()">Пригласить</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .org-dashboard { padding: 40px 20px; background: #f5f7fa; min-height: 100vh; }
    .container { max-width: 1400px; margin: 0 auto; }
    .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 40px; }
    h1 { font-size: 2.5rem; color: #333; margin: 0; }

    .cards-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 24px; margin-bottom: 40px; }
    .stat-card { background: white; padding: 30px; border-radius: 16px; display: flex; gap: 20px; align-items: center; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
    .stat-icon { font-size: 3rem; }
    .stat-content h3 { margin: 0 0 8px 0; color: #666; font-size: 0.875rem; }
    .stat-value { font-size: 2rem; font-weight: 700; color: #333; margin: 0; }
    .stat-label { color: #999; font-size: 0.875rem; }

    .section { background: white; border-radius: 16px; padding: 40px; margin-bottom: 30px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
    .section-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px; }

    .members-list { display: flex; flex-direction: column; gap: 16px; }
    .member-card { display: flex; align-items: center; gap: 20px; padding: 20px; background: #f8f9fa; border-radius: 12px; }
    .member-avatar { width: 50px; height: 50px; border-radius: 50%; background: #667eea; color: white; display: flex; align-items: center; justify-content: center; font-weight: 600; }
    .member-info { flex: 1; }
    .member-info h4 { margin: 0 0 4px 0; color: #333; }
    .member-info p { margin: 0; color: #666; font-size: 0.875rem; }
    .member-role { padding: 6px 16px; border-radius: 20px; font-size: 0.875rem; font-weight: 600; }
    .member-role.owner { background: #e3f2fd; color: #1976d2; }
    .member-role.admin { background: #f3e5f5; color: #7b1fa2; }
    .member-role.manager { background: #e8f5e9; color: #2e7d32; }
    .member-actions { display: flex; gap: 8px; }

    .features-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; }
    .feature-card { padding: 24px; border: 2px solid #e0e0e0; border-radius: 12px; text-align: center; opacity: 0.5; }
    .feature-card.enabled { border-color: #4caf50; opacity: 1; }
    .feature-card .icon { font-size: 2.5rem; margin-bottom: 12px; }
    .feature-card h4 { margin: 0 0 8px 0; color: #333; }
    .feature-card p { margin: 0; color: #666; font-size: 0.875rem; }

    .modal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 1000; }
    .modal { background: white; border-radius: 16px; max-width: 500px; width: 90%; }
    .modal-header { padding: 24px; border-bottom: 1px solid #f0f0f0; display: flex; justify-content: space-between; align-items: center; }
    .modal-body { padding: 24px; }
    .modal-footer { padding: 24px; border-top: 1px solid #f0f0f0; display: flex; gap: 12px; justify-content: flex-end; }

    .form-group { margin-bottom: 20px; }
    .form-group label { display: block; margin-bottom: 8px; color: #333; font-weight: 500; }
    .form-group input, .form-group select { width: 100%; padding: 12px; border: 1px solid #ddd; border-radius: 8px; font-size: 1rem; }

    button { padding: 12px 24px; border: none; border-radius: 8px; font-weight: 600; cursor: pointer; transition: all 0.3s; }
    .btn-primary { background: #667eea; color: white; }
    .btn-primary:hover { background: #5568d3; }
    .btn-secondary { background: transparent; border: 2px solid #667eea; color: #667eea; }
    .btn-icon { padding: 8px; background: transparent; }
    .btn-icon.danger { color: #f44336; }
    .btn-close { background: none; font-size: 2rem; color: #999; padding: 0; width: 32px; height: 32px; }

    .loading { text-align: center; padding: 100px 20px; }
    .spinner { width: 50px; height: 50px; border: 4px solid #f3f3f3; border-top-color: #667eea; border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto; }
    @keyframes spin { to { transform: rotate(360deg); } }
  `]
})
export class OrganizationDashboardComponent implements OnInit {
  private orgService = inject(OrganizationService);

  organization = signal<Organization | null>(null);
  members = signal<OrganizationMember[]>([]);
  loading = signal(true);

  showSettings = false;
  showInviteModal = false;
  inviteEmail = '';
  inviteRole = 'member';

  ngOnInit() {
    this.loadOrganization();
    this.loadMembers();
  }

  loadOrganization() {
    // Assuming we have organization ID from route or service
    const orgId = 1; // Get from route params
    this.orgService.getOrganization(orgId).subscribe({
      next: (org) => {
        this.organization.set(org);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  loadMembers() {
    const orgId = 1;
    this.orgService.getMembers(orgId).subscribe({
      next: (data) => this.members.set(data.members)
    });
  }

  getRoleLabel(role: string): string {
    const labels: any = {
      'owner': 'Владелец',
      'admin': 'Администратор',
      'manager': 'Менеджер',
      'instructor': 'Преподаватель',
      'member': 'Участник'
    };
    return labels[role] || role;
  }

  inviteMember() {
    const orgId = 1;
    this.orgService.inviteMember(orgId, {
      email: this.inviteEmail,
      role: this.inviteRole as any
    }).subscribe({
      next: () => {
        this.showInviteModal = false;
        this.inviteEmail = '';
        this.loadMembers();
        alert('Приглашение отправлено!');
      },
      error: () => alert('Ошибка при отправке приглашения')
    });
  }

  editMember(member: OrganizationMember) {
    // TODO: Implement edit modal
    console.log('Edit member:', member);
  }

  removeMember(member: OrganizationMember) {
    if (confirm('Удалить участника из организации?')) {
      const orgId = 1;
      this.orgService.removeMember(orgId, member.id).subscribe({
        next: () => {
          this.loadMembers();
          alert('Участник удален');
        },
        error: () => alert('Ошибка при удалении')
      });
    }
  }
}
