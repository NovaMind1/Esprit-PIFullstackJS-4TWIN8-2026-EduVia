<<<<<<< HEAD
import { Component, OnDestroy, OnInit, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { AuthService } from '../../../services/auth.service';

type UserRole = 'teacher' | 'student';
type UserAccountStatus = 'active' | 'pending' | 'blocked';

interface User {
  id: number | string;
  name: string;
  email: string;
  role: UserRole;
  isVerified: boolean;
  accountStatus: UserAccountStatus;
  createdAt: Date;
  isActive: boolean;
  isBlocked?: boolean;
  passwordChanged?: boolean;
  lastActivity?: string;
  lastActivityAt?: Date | null;
  firstLoginAt?: Date | null;
  passwordChangedAt?: Date | null;
}

interface UserForm {
  name: string;
  email: string;
  role: UserRole | '';
}

@Component({
  selector: 'app-user-management',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    FormsModule,
    HttpClientModule,
  ],
  templateUrl: './user-management.html',
  styleUrls: ['./user-management.css'],
})
export class UserManagement implements OnInit, OnDestroy {
  rawSearchQuery = '';
  usersUpdated = output<void>();
  selectedRole: 'all' | UserRole = 'all';
  users: User[] = [];
  loading = false;

  showAddUserModal = false;
  showEditUserModal = false;
  showDeleteModal = false;
  showSuccessModal = false;

  isCreatingUser = false;
  isFilterMenuOpen = false;
  isAddRoleMenuOpen = false;
  isEditRoleMenuOpen = false;

  newUser: UserForm = this.getEmptyForm();
  editingUserId: number | string | null = null;
  editUser: UserForm = this.getEmptyForm();
  pendingDeleteUser: User | null = null;
  successMessage = '';
  private activityTickTimer: ReturnType<typeof setInterval> | null = null;
  private nowTs = Date.now();

  constructor(private authService: AuthService) {}

  ngOnInit() {
    this.loadUsers();
    this.activityTickTimer = setInterval(() => {
      this.nowTs = Date.now();
    }, 60_000);
  }

  ngOnDestroy() {
    if (this.activityTickTimer) {
      clearInterval(this.activityTickTimer);
      this.activityTickTimer = null;
    }
  }

  loadUsers() {
    this.loading = true;

    this.authService.getUsers().subscribe({
      next: (response) => {
        Promise.resolve().then(() => {
          this.users = (response?.data || response || [])
            .filter((user: any) => user.role === 'teacher' || user.role === 'student')
            .map((user: any) => {
              const normalizedUser = {
                ...user,
                id: user.id || user._id || user.keycloakId,
                name: this.buildDisplayName(user),
                role: user.role as UserRole,
                isVerified: user.emailVerified ?? user.isVerified ?? user.verified ?? false,
                createdAt: user.createdAt ? new Date(user.createdAt) : new Date(),
                isActive: user.isActive ?? !user.isBlocked,
                isBlocked: !!user.isBlocked,
                passwordChanged: !!user.passwordChanged,
                firstLoginAt: user.firstLoginAt ? new Date(user.firstLoginAt) : null,
                passwordChangedAt: user.passwordChangedAt
                  ? new Date(user.passwordChangedAt)
                  : user.lastPasswordChange
                    ? new Date(user.lastPasswordChange)
                    : null,
                lastActivityAt: this.resolveLastActivityAt(user),
                lastActivity: user.lastActivity || ''
              };

              return {
                ...normalizedUser,
                accountStatus: this.getAccountStatus(normalizedUser),
              };
            });
          this.loading = false;
          this.usersUpdated.emit();
        });
      },
      error: (error) => {
        console.error('Erreur lors du chargement des utilisateurs:', error);
        Promise.resolve().then(() => {
          this.loadMockUsers();
          this.loading = false;
        });
      }
    });
  }

  get filteredUsers(): User[] {
    const normalizedSearch = this.rawSearchQuery.trim().toLowerCase();

    return this.users.filter((user) => {
      const userName = user.name.toLowerCase();
      const userEmail = user.email.toLowerCase();
      const nameWords = userName.split(/\s+/);

      const matchesSearch =
        normalizedSearch === '' ||
        userName.startsWith(normalizedSearch) ||
        userEmail.startsWith(normalizedSearch) ||
        nameWords.some((word) => word.startsWith(normalizedSearch));
      const matchesRole = this.selectedRole === 'all' || user.role === this.selectedRole;
      return matchesSearch && matchesRole;
    });
  }

  get userCounts() {
    return {
      all: this.users.length,
      teacher: this.users.filter((u) => u.role === 'teacher').length,
      student: this.users.filter((u) => u.role === 'student').length
    };
  }

  get selectedRoleLabel(): string {
    return this.selectedRole === 'all'
      ? 'Tous les roles'
      : this.getRoleLabel(this.selectedRole);
  }

  get addRoleLabel(): string {
    return this.newUser.role ? this.getRoleLabel(this.newUser.role) : 'Selectionner un role';
  }

  get isCreateUserFormValid(): boolean {
    return !!this.newUser.name.trim() && !!this.newUser.email.trim() && !!this.newUser.role;
  }

  get editRoleLabel(): string {
    return this.editUser.role ? this.getRoleLabel(this.editUser.role) : 'Selectionner un role';
  }

  getRoleIcon(role: UserRole): string {
    return role === 'teacher' ? 'person_search' : 'school';
  }

  getRoleLabel(role: UserRole): string {
    return role === 'teacher' ? 'Enseignant' : 'Etudiant';
  }

  getRoleChipClass(role: UserRole): string {
    return role === 'teacher' ? 'chip chip--teacher' : 'chip chip--student';
  }

  getRolePanelClass(role: UserRole): string {
    return role === 'teacher' ? 'avatar avatar--teacher' : 'avatar avatar--student';
  }

  getAccountStatusClass(status: UserAccountStatus): string {
    if (status === 'active') {
      return 'verification-chip verification-chip--verified';
    }

    if (status === 'blocked') {
      return 'verification-chip verification-chip--blocked';
    }

    return 'verification-chip verification-chip--pending';
  }

  getVerificationClass(isVerified: boolean): string {
    return isVerified ? 'verification-chip verification-chip--verified' : 'verification-chip verification-chip--pending';
  }

  getVerificationLabel(isVerified: boolean): string {
    return isVerified ? 'Verifie' : 'Non verifie';
  }

  getAccountStatusLabel(status: UserAccountStatus): string {
    if (status === 'active') {
      return 'Actif';
    }

    if (status === 'blocked') {
      return 'Bloque';
    }

    return 'En attente';
  }

  getLastActivityLabel(user: User): string {
    if (!user.lastActivityAt || Number.isNaN(user.lastActivityAt.getTime())) {
      return 'Aucune activite recente';
    }

    const diffMs = Math.max(0, this.nowTs - user.lastActivityAt.getTime());
    const minute = 60 * 1000;
    const hour = 60 * minute;
    const day = 24 * hour;

    if (diffMs < minute) return 'A l instant';
    if (diffMs < hour) {
      const minutes = Math.floor(diffMs / minute);
      return `Il y a ${minutes} minute${minutes > 1 ? 's' : ''}`;
    }
    if (diffMs < day) {
      const hours = Math.floor(diffMs / hour);
      return `Il y a ${hours} heure${hours > 1 ? 's' : ''}`;
    }

    const days = Math.floor(diffMs / day);
    return `Il y a ${days} jour${days > 1 ? 's' : ''}`;
  }

  trackByUserId(_: number, user: User) {
    return user.id;
  }

  onSearchInput(value: string) {
    this.rawSearchQuery = value ?? '';
  }

  toggleFilterMenu() {
    this.isFilterMenuOpen = !this.isFilterMenuOpen;
  }

  selectFilterRole(role: 'all' | UserRole) {
    this.selectedRole = role;
    this.isFilterMenuOpen = false;
  }

  openAddUserDialog() {
    this.newUser = this.getEmptyForm();
    this.isAddRoleMenuOpen = false;
    this.showAddUserModal = true;
  }

  closeAddUserDialog() {
    this.showAddUserModal = false;
    this.isCreatingUser = false;
    this.isAddRoleMenuOpen = false;
  }

  toggleAddRoleMenu() {
    this.isAddRoleMenuOpen = !this.isAddRoleMenuOpen;
  }

  selectAddRole(role: UserRole) {
    this.newUser.role = role;
    this.isAddRoleMenuOpen = false;
  }

  createUser() {
    if (!this.isCreateUserFormValid) {
      return;
    }

    this.isCreatingUser = true;

    const normalizedName = this.newUser.name.trim();
    const [firstName, ...lastNameParts] = normalizedName.split(/\s+/);
    const lastName = lastNameParts.join(' ').trim();
    const email = this.newUser.email.trim().toLowerCase();
    const role = this.newUser.role as UserRole;
    const username = email;

    this.authService.createUser({
      name: normalizedName,
      email,
      role,
      username,
      firstName,
      lastName
    }).subscribe({
      next: (response) => {
        this.closeAddUserDialog();
        this.loadUsers();
        this.openSuccessModal(
          response?.message === 'User synced from Keycloak and saved in database'
            ? 'Utilisateur synchronise avec succes depuis Keycloak et enregistre en base.'
            : 'Utilisateur cree avec succes. Un email a ete envoye.'
        );
      },
      error: (error) => {
        console.error('Erreur lors de la creation:', error);
        this.isCreatingUser = false;
        alert(error?.error?.message || "La creation a echoue cote backend.");
      }
    });
  }

  openEditUserDialog(user: User) {
    this.editingUserId = user.id;
    this.editUser = {
      name: user.name,
      email: user.email,
      role: user.role
    };
    this.isEditRoleMenuOpen = false;
    this.showEditUserModal = true;
  }

  closeEditUserDialog() {
    this.showEditUserModal = false;
    this.isEditRoleMenuOpen = false;
    this.editingUserId = null;
  }

  toggleEditRoleMenu() {
    this.isEditRoleMenuOpen = !this.isEditRoleMenuOpen;
  }

  selectEditRole(role: UserRole) {
    this.editUser.role = role;
    this.isEditRoleMenuOpen = false;
  }

  saveUserChanges() {
    if (!this.editingUserId || !this.editUser.name || !this.editUser.email || !this.editUser.role) {
      return;
    }

    const normalizedName = this.editUser.name.trim();
    const [firstName, ...lastNameParts] = normalizedName.split(/\s+/);
    const lastName = lastNameParts.join(' ').trim();
    const email = this.editUser.email.trim().toLowerCase();
    const role = this.editUser.role as UserRole;

    this.authService.updateUser(this.editingUserId, {
      name: normalizedName,
      email,
      role,
      username: email,
      firstName,
      lastName
    }).subscribe({
      next: () => {
        this.closeEditUserDialog();
        this.loadUsers();
        this.openSuccessModal('Utilisateur modifie avec succes dans la base et Keycloak.');
      },
      error: (error) => {
        console.error('Erreur lors de la modification:', error);
        alert(error?.error?.message || 'La modification a echoue cote backend.');
      }
    });
  }

  openDeleteModal(user: User) {
    this.pendingDeleteUser = user;
    this.showDeleteModal = true;
  }

  closeDeleteModal() {
    this.pendingDeleteUser = null;
    this.showDeleteModal = false;
  }

  confirmDeleteUser() {
    if (!this.pendingDeleteUser) {
      return;
    }

    const userId = this.pendingDeleteUser.id;

    this.authService.deleteUser(userId).subscribe({
      next: () => {
        this.closeDeleteModal();
        this.loadUsers();
        this.openSuccessModal('Utilisateur supprime avec succes de la base et de Keycloak.');
      },
      error: (error) => {
        console.error('Erreur lors de la suppression:', error);
        alert(error?.error?.message || 'La suppression a echoue cote backend.');
      }
    });
  }

  closeSuccessModal() {
    this.showSuccessModal = false;
    this.successMessage = '';
  }

  private openSuccessModal(message: string) {
    this.successMessage = message;
    this.showSuccessModal = true;
  }

  private getEmptyForm(): UserForm {
    return {
      name: '',
      email: '',
      role: ''
    };
  }

  private buildDisplayName(user: any): string {
    const fullName = [user.firstName, user.lastName]
      .filter((value: string | undefined) => !!value)
      .join(' ')
      .trim();

    return user.name || fullName || user.username || user.email;
  }

  private loadMockUsers() {
    this.users = [
      {
        id: 1,
        name: 'Prof. Jean Dupont',
        email: 'jean.dupont@university.fr',
        role: 'teacher',
        isVerified: true,
        accountStatus: 'active',
        createdAt: new Date('2025-09-15'),
        isActive: true,
        lastActivityAt: new Date(Date.now() - 2 * 60 * 60 * 1000)
      },
      {
        id: 2,
        name: 'Marie Dubois',
        email: 'marie.dubois@student.fr',
        role: 'student',
        isVerified: false,
        accountStatus: 'pending',
        createdAt: new Date('2025-09-20'),
        isActive: true,
        lastActivityAt: new Date(Date.now() - 3 * 60 * 60 * 1000)
      },
      {
        id: 3,
        name: 'Thomas Martin',
        email: 'thomas.martin@student.fr',
        role: 'student',
        isVerified: true,
        accountStatus: 'active',
        createdAt: new Date('2025-09-22'),
        isActive: true,
        lastActivityAt: new Date(Date.now() - 5 * 60 * 60 * 1000)
      },
      {
        id: 4,
        name: 'Prof. Sophie Leroux',
        email: 'sophie.leroux@university.fr',
        role: 'teacher',
        isVerified: true,
        accountStatus: 'active',
        createdAt: new Date('2025-09-18'),
        isActive: true,
        lastActivityAt: new Date(Date.now() - 4 * 60 * 60 * 1000)
      },
      {
        id: 5,
        name: 'Lucas Bernard',
        email: 'lucas.bernard@student.fr',
        role: 'student',
        isVerified: false,
        accountStatus: 'blocked',
        createdAt: new Date('2025-09-25'),
        isActive: false,
        lastActivityAt: new Date(Date.now() - 24 * 60 * 60 * 1000)
      }
    ];
  }

  private resolveLastActivityAt(user: any): Date | null {
    const candidates = [
      user.lastLogin,
      user.lastActivityAt,
      user.lastPasswordChange,
      user.passwordChangedAt,
      user.updatedAt,
      user.firstLoginAt,
      user.createdAt,
    ];

    for (const value of candidates) {
      if (!value) continue;
      const date = new Date(value);
      if (!Number.isNaN(date.getTime())) {
        return date;
      }
    }

    return null;
  }

  private getAccountStatus(user: any): UserAccountStatus {
    const firstLoginAt = user.firstLoginAt ? new Date(user.firstLoginAt) : null;
    const passwordChangedAt = user.passwordChangedAt ? new Date(user.passwordChangedAt) : null;
    const twentyFourHours = 24 * 60 * 60 * 1000;

    if (user.passwordChanged === true) {
      return 'active';
    }

    if (
      passwordChangedAt &&
      !Number.isNaN(passwordChangedAt.getTime()) &&
      (!firstLoginAt || Number.isNaN(firstLoginAt.getTime()) || passwordChangedAt.getTime() >= firstLoginAt.getTime())
    ) {
      return 'active';
    }

    if (user.isBlocked === true) {
      return 'blocked';
    }

    if (
      firstLoginAt &&
      !Number.isNaN(firstLoginAt.getTime()) &&
      Date.now() - firstLoginAt.getTime() > twentyFourHours
    ) {
      return 'blocked';
    }

    return 'pending';
  }
=======
import { Component } from '@angular/core';

@Component({
  selector: 'app-user-management',
  imports: [],
  templateUrl: './user-management.html',
  styleUrl: './user-management.css',
})
export class UserManagement {

>>>>>>> mayarahachani
}
