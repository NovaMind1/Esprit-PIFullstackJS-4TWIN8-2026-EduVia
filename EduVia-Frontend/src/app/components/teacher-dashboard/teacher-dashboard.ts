import { ChangeDetectorRef, Component, OnInit, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTabsModule } from '@angular/material/tabs';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { StudentTracking } from '../teacher/student-tracking/student-tracking';
import { TeacherProfileSettingsComponent } from '../teacher/teacher-profile-settings/teacher-profile-settings';
import { NotificationBell } from '../notification-bell/notification-bell';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-teacher-dashboard',
  imports: [
    CommonModule,
    MatTabsModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    NotificationBell,
    StudentTracking,
    TeacherProfileSettingsComponent,
  ],
  templateUrl: './teacher-dashboard.html',
  styleUrls: ['./teacher-dashboard.css'],
})

export class TeacherDashboard implements OnInit {
  isMenuOpen = false;
  tabIndex = 0; // tracks which tab is active
  userFullName = 'Enseignant';
  userAvatarUrl = '';

  toggleMenu() {
    this.isMenuOpen = !this.isMenuOpen;
  }
  logout = output();
  

  // sample courses for the overview section
  courses = [
    { title: 'Mathématiques avancées', subtitle: 'Algebra et calcul', students: 42 },
    { title: 'Physique I', subtitle: 'Mécanique classique', students: 38 },
    { title: 'Programmation Web', subtitle: 'Angular & TypeScript', students: 56 },
  ];

  constructor(
    private auth: AuthService,
    private cdr: ChangeDetectorRef,
  ) {
    const identity = this.getIdentityFromToken();
    this.userFullName = identity.fullName || this.userFullName;
  }

  ngOnInit() {
    const identity = this.getIdentityFromToken();

    this.auth.getProfile().subscribe({
      next: (response) => {
        const profile = response?.data || response || {};
        setTimeout(() => {
          this.userFullName = String(profile.fullName || identity.fullName || this.userFullName).trim();
          this.userAvatarUrl = String(profile.avatarDataUrl || '').trim();
          this.cdr.detectChanges();
        }, 0);
      },
      error: () => {
        setTimeout(() => {
          this.userAvatarUrl = '';
          this.cdr.detectChanges();
        }, 0);
      },
    });
  }

  get userInitial(): string {
    return this.userFullName.trim().charAt(0).toUpperCase() || 'E';
  }

  onLogout() {
    this.logout.emit();
  }

  private getIdentityFromToken(): { fullName: string } {
    const token = this.auth.getToken();
    if (!token) return { fullName: '' };

    const payloadPart = token.split('.')[1];
    if (!payloadPart) return { fullName: '' };

    try {
      const base64 = payloadPart.replace(/-/g, '+').replace(/_/g, '/');
      const decoded = JSON.parse(atob(base64));
      const firstName = decoded?.given_name || '';
      const lastName = decoded?.family_name || '';
      const fullName =
        `${firstName} ${lastName}`.trim() ||
        decoded?.name ||
        decoded?.preferred_username ||
        '';

      return { fullName };
    } catch {
      return { fullName: '' };
    }
  }
}
