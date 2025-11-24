import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { OrganizationService } from '../services/organization.service';
import { Organization, OrganizationMember } from '../models/organization.models';

@Component({
  selector: 'app-team-members',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="team-members">
      <div class="container">
        <div class="header">
          <div>
            <h1>Управление командой</h1>
            <p class="subtitle">
              {{ members().length }} из {{ organization()?.seats.max || '∞' }} мест занято
            </p>
          </div>
          <button class="btn-primary" (click)="showInviteModal = true">
            + Пригласить участника
          </button>
        </div>

        <div *ngIf="loading()" class="loading">
          <div class="spinner"></div>
        </div>

        <!-- Filters and Search -->
        <div class="filters">
          <input
            type="text"
            class="search-input"
            [(ngModel)]="searchQuery"
            (ngModelChange)="filterMembers()"
            placeholder="🔍 Поиск по имени или email..."
          />
          <select [(ngModel)]="roleFilter" (ngModelChange)="filterMembers()">
            <option value="">Все роли</option>
            <option value="owner">Владелец</option>
            <option value="admin">Администратор</option>
            <option value="manager">Менеджер</option>
            <option value="instructor">Преподаватель</option>
            <option value="member">Участник</option>
          </select>
          <select [(ngModel)]="statusFilter" (ngModelChange)="filterMembers()">
            <option value="">Все статусы</option>
            <option value="active">Активные</option>
            <option value="inactive">Неактивные</option>
          </select>
        </div>

        <!-- Bulk Actions -->
        <div *ngIf="selectedMembers().length > 0" class="bulk-actions">
          <span>{{ selectedMembers().length }} выбрано</span>
          <button class="btn-secondary" (click)="bulkChangeRole()">
            Изменить роль
          </button>
          <button class="btn-danger" (click)="bulkRemove()">
            Удалить выбранных
          </button>
          <button class="btn-text" (click)="clearSelection()">Отменить</button>
        </div>

        <!-- Members Table -->
        <div class="members-table">
          <table>
            <thead>
              <tr>
                <th>
                  <input
                    type="checkbox"
                    [checked]="allSelected()"
                    (change)="toggleSelectAll()"
                  />
                </th>
                <th>Участник</th>
                <th>Email</th>
                <th>Роль</th>
                <th>Статус</th>
                <th>Дата присоединения</th>
                <th>Действия</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let member of filteredMembers()">
                <td>
                  <input
                    type="checkbox"
                    [checked]="isSelected(member)"
                    (change)="toggleSelect(member)"
                    [disabled]="member.role === 'owner'"
                  />
                </td>
                <td>
                  <div class="member-cell">
                    <div class="avatar">
                      {{ member.user.firstName[0] }}{{ member.user.lastName[0] }}
                    </div>
                    <div>
                      <div class="name">
                        {{ member.user.firstName }} {{ member.user.lastName }}
                      </div>
                    </div>
                  </div>
                </td>
                <td>{{ member.user.email }}</td>
                <td>
                  <span class="role-badge" [class]="member.role">
                    {{ getRoleLabel(member.role) }}
                  </span>
                </td>
                <td>
                  <span class="status-badge" [class.active]="member.isActive">
                    {{ member.isActive ? 'Активен' : 'Неактивен' }}
                  </span>
                </td>
                <td>{{ formatDate(member.joinedAt) }}</td>
                <td>
                  <div class="actions">
                    <button
                      *ngIf="member.role !== 'owner'"
                      class="btn-icon"
                      (click)="editMember(member)"
                      title="Редактировать"
                    >
                      ✏️
                    </button>
                    <button
                      *ngIf="member.role !== 'owner'"
                      class="btn-icon"
                      (click)="toggleMemberStatus(member)"
                      [title]="member.isActive ? 'Деактивировать' : 'Активировать'"
                    >
                      {{ member.isActive ? '🔒' : '🔓' }}
                    </button>
                    <button
                      *ngIf="member.role !== 'owner'"
                      class="btn-icon danger"
                      (click)="removeMember(member)"
                      title="Удалить"
                    >
                      🗑️
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>

          <div *ngIf="filteredMembers().length === 0" class="empty-state">
            <p>Участники не найдены</p>
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
                <label>Email *</label>
                <input type="email" [(ngModel)]="inviteEmail" placeholder="user@example.com" />
              </div>
              <div class="form-group">
                <label>Роль *</label>
                <select [(ngModel)]="inviteRole">
                  <option value="member">Участник</option>
                  <option value="instructor">Преподаватель</option>
                  <option value="manager">Менеджер</option>
                  <option value="admin">Администратор</option>
                </select>
              </div>
              <div class="form-group">
                <label>Разрешения (опционально)</label>
                <div class="permissions-grid">
                  <label *ngFor="let perm of availablePermissions">
                    <input
                      type="checkbox"
                      [checked]="invitePermissions.includes(perm.key)"
                      (change)="togglePermission(perm.key)"
                    />
                    {{ perm.label }}
                  </label>
                </div>
              </div>
            </div>
            <div class="modal-footer">
              <button class="btn-secondary" (click)="showInviteModal = false">Отмена</button>
              <button class="btn-primary" (click)="inviteMember()">Отправить приглашение</button>
            </div>
          </div>
        </div>

        <!-- Edit Member Modal -->
        <div *ngIf="showEditModal && editingMember" class="modal-overlay" (click)="showEditModal = false">
          <div class="modal" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <h3>Редактировать участника</h3>
              <button class="btn-close" (click)="showEditModal = false">×</button>
            </div>
            <div class="modal-body">
              <div class="member-info-display">
                <div class="avatar large">
                  {{ editingMember.user.firstName[0] }}{{ editingMember.user.lastName[0] }}
                </div>
                <div>
                  <h4>{{ editingMember.user.firstName }} {{ editingMember.user.lastName }}</h4>
                  <p>{{ editingMember.user.email }}</p>
                </div>
              </div>
              <div class="form-group">
                <label>Роль</label>
                <select [(ngModel)]="editRole">
                  <option value="member">Участник</option>
                  <option value="instructor">Преподаватель</option>
                  <option value="manager">Менеджер</option>
                  <option value="admin">Администратор</option>
                </select>
              </div>
              <div class="form-group">
                <label>Разрешения</label>
                <div class="permissions-grid">
                  <label *ngFor="let perm of availablePermissions">
                    <input
                      type="checkbox"
                      [checked]="editPermissions.includes(perm.key)"
                      (change)="toggleEditPermission(perm.key)"
                    />
                    {{ perm.label }}
                  </label>
                </div>
              </div>
            </div>
            <div class="modal-footer">
              <button class="btn-secondary" (click)="showEditModal = false">Отмена</button>
              <button class="btn-primary" (click)="updateMember()">Сохранить</button>
            </div>
          </div>
        </div>

        <!-- Bulk Role Change Modal -->
        <div *ngIf="showBulkRoleModal" class="modal-overlay" (click)="showBulkRoleModal = false">
          <div class="modal" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <h3>Изменить роль для {{ selectedMembers().length }} участников</h3>
              <button class="btn-close" (click)="showBulkRoleModal = false">×</button>
            </div>
            <div class="modal-body">
              <div class="form-group">
                <label>Новая роль</label>
                <select [(ngModel)]="bulkRole">
                  <option value="member">Участник</option>
                  <option value="instructor">Преподаватель</option>
                  <option value="manager">Менеджер</option>
                  <option value="admin">Администратор</option>
                </select>
              </div>
            </div>
            <div class="modal-footer">
              <button class="btn-secondary" (click)="showBulkRoleModal = false">Отмена</button>
              <button class="btn-primary" (click)="applyBulkRoleChange()">Применить</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .team-members { padding: 40px 20px; background: #f5f7fa; min-height: 100vh; }
    .container { max-width: 1400px; margin: 0 auto; }
    .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 40px; }
    h1 { font-size: 2rem; color: #333; margin: 0 0 8px 0; }
    .subtitle { color: #666; margin: 0; }

    .filters { display: flex; gap: 16px; margin-bottom: 24px; }
    .search-input { flex: 1; padding: 12px 16px; border: 1px solid #ddd; border-radius: 8px; font-size: 1rem; }
    select { padding: 12px 16px; border: 1px solid #ddd; border-radius: 8px; background: white; cursor: pointer; }

    .bulk-actions { background: #667eea; color: white; padding: 16px 24px; border-radius: 8px; display: flex; align-items: center; gap: 16px; margin-bottom: 24px; }
    .bulk-actions span { font-weight: 600; }

    .members-table { background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
    table { width: 100%; border-collapse: collapse; }
    thead { background: #f8f9fa; }
    th { padding: 16px; text-align: left; font-weight: 600; color: #555; border-bottom: 2px solid #e0e0e0; }
    td { padding: 16px; border-bottom: 1px solid #f0f0f0; }
    tr:hover { background: #f8f9fa; }

    .member-cell { display: flex; align-items: center; gap: 12px; }
    .avatar { width: 40px; height: 40px; border-radius: 50%; background: #667eea; color: white; display: flex; align-items: center; justify-content: center; font-weight: 600; font-size: 0.875rem; }
    .avatar.large { width: 60px; height: 60px; font-size: 1.25rem; }
    .name { font-weight: 600; color: #333; }

    .role-badge { padding: 6px 12px; border-radius: 20px; font-size: 0.875rem; font-weight: 600; }
    .role-badge.owner { background: #e3f2fd; color: #1976d2; }
    .role-badge.admin { background: #f3e5f5; color: #7b1fa2; }
    .role-badge.manager { background: #e8f5e9; color: #2e7d32; }
    .role-badge.instructor { background: #fff3e0; color: #f57c00; }
    .role-badge.member { background: #f5f5f5; color: #666; }

    .status-badge { padding: 6px 12px; border-radius: 20px; font-size: 0.875rem; background: #ffebee; color: #c62828; }
    .status-badge.active { background: #e8f5e9; color: #2e7d32; }

    .actions { display: flex; gap: 8px; }
    .btn-icon { padding: 8px; background: transparent; border: none; cursor: pointer; font-size: 1.125rem; transition: transform 0.2s; }
    .btn-icon:hover { transform: scale(1.2); }
    .btn-icon.danger:hover { filter: brightness(0.8); }

    .empty-state { padding: 60px 20px; text-align: center; color: #999; }

    .modal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 1000; }
    .modal { background: white; border-radius: 16px; max-width: 600px; width: 90%; max-height: 90vh; overflow-y: auto; }
    .modal-header { padding: 24px; border-bottom: 1px solid #f0f0f0; display: flex; justify-content: space-between; align-items: center; }
    .modal-body { padding: 24px; }
    .modal-footer { padding: 24px; border-top: 1px solid #f0f0f0; display: flex; gap: 12px; justify-content: flex-end; }

    .member-info-display { display: flex; align-items: center; gap: 16px; margin-bottom: 24px; padding: 20px; background: #f8f9fa; border-radius: 12px; }

    .form-group { margin-bottom: 20px; }
    .form-group label { display: block; margin-bottom: 8px; color: #333; font-weight: 500; }
    .form-group input, .form-group select { width: 100%; padding: 12px; border: 1px solid #ddd; border-radius: 8px; font-size: 1rem; }

    .permissions-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; padding: 16px; background: #f8f9fa; border-radius: 8px; }
    .permissions-grid label { display: flex; align-items: center; gap: 8px; cursor: pointer; }

    button { padding: 12px 24px; border: none; border-radius: 8px; font-weight: 600; cursor: pointer; transition: all 0.3s; }
    .btn-primary { background: #667eea; color: white; }
    .btn-primary:hover { background: #5568d3; }
    .btn-secondary { background: transparent; border: 2px solid #667eea; color: #667eea; }
    .btn-danger { background: #f44336; color: white; }
    .btn-text { background: none; color: white; padding: 8px 16px; }
    .btn-close { background: none; font-size: 2rem; color: #999; padding: 0; width: 32px; height: 32px; }

    .loading { text-align: center; padding: 60px 20px; }
    .spinner { width: 50px; height: 50px; border: 4px solid #f3f3f3; border-top-color: #667eea; border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto; }
    @keyframes spin { to { transform: rotate(360deg); } }
  `]
})
export class TeamMembersComponent implements OnInit {
  private orgService = inject(OrganizationService);

  organization = signal<Organization | null>(null);
  members = signal<OrganizationMember[]>([]);
  filteredMembers = signal<OrganizationMember[]>([]);
  selectedMembers = signal<OrganizationMember[]>([]);
  loading = signal(true);

  searchQuery = '';
  roleFilter = '';
  statusFilter = '';

  showInviteModal = false;
  inviteEmail = '';
  inviteRole = 'member';
  invitePermissions: string[] = [];

  showEditModal = false;
  editingMember: OrganizationMember | null = null;
  editRole = '';
  editPermissions: string[] = [];

  showBulkRoleModal = false;
  bulkRole = 'member';

  availablePermissions = [
    { key: 'courses.create', label: 'Создание курсов' },
    { key: 'courses.edit', label: 'Редактирование курсов' },
    { key: 'courses.delete', label: 'Удаление курсов' },
    { key: 'users.invite', label: 'Приглашение пользователей' },
    { key: 'users.manage', label: 'Управление пользователями' },
    { key: 'analytics.view', label: 'Просмотр аналитики' },
    { key: 'settings.edit', label: 'Изменение настроек' },
    { key: 'billing.manage', label: 'Управление платежами' },
  ];

  ngOnInit() {
    this.loadOrganization();
    this.loadMembers();
  }

  loadOrganization() {
    const orgId = 1;
    this.orgService.getOrganization(orgId).subscribe({
      next: (org) => this.organization.set(org)
    });
  }

  loadMembers() {
    const orgId = 1;
    this.orgService.getMembers(orgId).subscribe({
      next: (data) => {
        this.members.set(data.members);
        this.filterMembers();
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  filterMembers() {
    let filtered = this.members();

    if (this.searchQuery) {
      const query = this.searchQuery.toLowerCase();
      filtered = filtered.filter(m =>
        m.user.firstName.toLowerCase().includes(query) ||
        m.user.lastName.toLowerCase().includes(query) ||
        m.user.email.toLowerCase().includes(query)
      );
    }

    if (this.roleFilter) {
      filtered = filtered.filter(m => m.role === this.roleFilter);
    }

    if (this.statusFilter === 'active') {
      filtered = filtered.filter(m => m.isActive);
    } else if (this.statusFilter === 'inactive') {
      filtered = filtered.filter(m => !m.isActive);
    }

    this.filteredMembers.set(filtered);
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

  formatDate(date: Date): string {
    return new Date(date).toLocaleDateString('ru-RU');
  }

  isSelected(member: OrganizationMember): boolean {
    return this.selectedMembers().some(m => m.id === member.id);
  }

  toggleSelect(member: OrganizationMember) {
    if (this.isSelected(member)) {
      this.selectedMembers.set(this.selectedMembers().filter(m => m.id !== member.id));
    } else {
      this.selectedMembers.set([...this.selectedMembers(), member]);
    }
  }

  allSelected(): boolean {
    const selectableMembers = this.filteredMembers().filter(m => m.role !== 'owner');
    return selectableMembers.length > 0 && this.selectedMembers().length === selectableMembers.length;
  }

  toggleSelectAll() {
    if (this.allSelected()) {
      this.selectedMembers.set([]);
    } else {
      const selectable = this.filteredMembers().filter(m => m.role !== 'owner');
      this.selectedMembers.set(selectable);
    }
  }

  clearSelection() {
    this.selectedMembers.set([]);
  }

  inviteMember() {
    const orgId = 1;
    this.orgService.inviteMember(orgId, {
      email: this.inviteEmail,
      role: this.inviteRole as any,
      permissions: this.invitePermissions
    }).subscribe({
      next: () => {
        this.showInviteModal = false;
        this.inviteEmail = '';
        this.invitePermissions = [];
        this.loadMembers();
        alert('Приглашение отправлено!');
      },
      error: () => alert('Ошибка при отправке приглашения')
    });
  }

  editMember(member: OrganizationMember) {
    this.editingMember = member;
    this.editRole = member.role;
    this.editPermissions = [...member.permissions];
    this.showEditModal = true;
  }

  updateMember() {
    if (!this.editingMember) return;

    const orgId = 1;
    this.orgService.updateMemberRole(orgId, this.editingMember.id, this.editRole, this.editPermissions).subscribe({
      next: () => {
        this.showEditModal = false;
        this.editingMember = null;
        this.loadMembers();
        alert('Участник обновлен');
      },
      error: () => alert('Ошибка при обновлении')
    });
  }

  removeMember(member: OrganizationMember) {
    if (confirm(`Удалить ${member.user.firstName} ${member.user.lastName} из организации?`)) {
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

  toggleMemberStatus(member: OrganizationMember) {
    console.log('Toggle status for:', member);
    // TODO: Implement status toggle API
  }

  togglePermission(key: string) {
    if (this.invitePermissions.includes(key)) {
      this.invitePermissions = this.invitePermissions.filter(p => p !== key);
    } else {
      this.invitePermissions.push(key);
    }
  }

  toggleEditPermission(key: string) {
    if (this.editPermissions.includes(key)) {
      this.editPermissions = this.editPermissions.filter(p => p !== key);
    } else {
      this.editPermissions.push(key);
    }
  }

  bulkChangeRole() {
    this.showBulkRoleModal = true;
  }

  applyBulkRoleChange() {
    const orgId = 1;
    const updates = this.selectedMembers().map(member =>
      this.orgService.updateMemberRole(orgId, member.id, this.bulkRole, member.permissions)
    );

    // Simple sequential processing
    Promise.all(updates).then(() => {
      this.showBulkRoleModal = false;
      this.clearSelection();
      this.loadMembers();
      alert('Роли обновлены');
    }).catch(() => {
      alert('Ошибка при обновлении ролей');
    });
  }

  bulkRemove() {
    if (confirm(`Удалить ${this.selectedMembers().length} участников?`)) {
      const orgId = 1;
      const removals = this.selectedMembers().map(member =>
        this.orgService.removeMember(orgId, member.id)
      );

      Promise.all(removals).then(() => {
        this.clearSelection();
        this.loadMembers();
        alert('Участники удалены');
      }).catch(() => {
        alert('Ошибка при удалении');
      });
    }
  }
}
