<<<<<<< HEAD
import { Component, OnDestroy, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { AuthService } from './services/auth.service';
import { NotificationService } from './services/notification.service';

import { RoleSelection } from './components/role-selection/role-selection';
import { StudentDashboard } from './components/student-dashboard/student-dashboard';
import { TeacherDashboard } from './components/teacher-dashboard/teacher-dashboard';
import { AdminDashboard } from './components/admin/admin-dashboard/admin-dashboard';
import { Login } from './components/login/login';

type UserRole = 'student' | 'teacher' | 'admin' | null;
type PublicAuthScreen = 'login' | 'forgot-password' | 'reset-password';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    HttpClientModule,
    FormsModule,
    RoleSelection,
    StudentDashboard,
    TeacherDashboard,
    AdminDashboard,
    Login,
  ],
  templateUrl: './app.html',
  styleUrls: ['./app.css']
})
export class AppComponent implements OnInit, OnDestroy {
  userRole = signal<UserRole>(null);
  selectedRole = signal<UserRole>(null);
  publicAuthScreen = signal<PublicAuthScreen>('login');
  loginErrorMessage = signal<string | null>(null);
  transientNotificationMessage = signal<string | null>(null);
  resetToken = signal<string | null>(null);
  resetEmail = signal<string | null>(null);
  resetUserName = signal<string | null>(null);
  isInitializing = signal(true);
  private transientNotificationTimeout: ReturnType<typeof setTimeout> | null = null;

  constructor(
    private authService: AuthService,
    private notificationService: NotificationService
  ) {}

  ngOnInit() {
    this.resetState();
    this.applyRoleFromUrl();
    this.restoreSession();
  }

  ngOnDestroy() {
    this.clearTransientNotification();
  }

  private resetState() {
    this.userRole.set(null);
    this.selectedRole.set(null);
    this.publicAuthScreen.set('login');
    this.loginErrorMessage.set(null);
    this.transientNotificationMessage.set(null);
    this.resetToken.set(null);
    this.resetEmail.set(null);
    this.resetUserName.set(null);
  }

  onRoleSelected(role: UserRole) {
    this.selectedRole.set(role);
    this.publicAuthScreen.set('login');
    this.loginErrorMessage.set(null);
    this.syncUrl(role);
  }

  onLogin(event: { role: 'student' | 'teacher' | 'admin' | null; email: string; password: string }) {
    this.loginErrorMessage.set(null);

    this.authService.login(event.email, event.password).subscribe({
      next: (res: any) => {
        const data = res?.data || res;
        const role = data?.user?.role || data?.role || event.role;
        const roleNormalized = role?.toString().trim().toLowerCase() as UserRole;

        if (!roleNormalized) {
          this.loginErrorMessage.set('Role introuvable dans la reponse du serveur.');
          return;
        }

        localStorage.setItem('role', roleNormalized);
        this.notificationService.clearNotifications();
        localStorage.setItem('current_user_email', event.email);
        this.userRole.set(roleNormalized);
        this.selectedRole.set(null);

        if (roleNormalized !== 'admin') {
          this.checkPasswordStatus();
        } else {
          this.announceLoginSuccess(roleNormalized, false);
        }
      },
      error: (err: any) => {
        this.authService.clearTokens();
        this.loginErrorMessage.set(
          err?.error?.message || 'Echec de connexion. Verifiez votre email et votre mot de passe.'
        );
      }
    });
  }

  dismissTransientNotification() {
    this.clearTransientNotification();
  }

  onForgotPasswordRequested() {
    if (this.selectedRole() === 'teacher' || this.selectedRole() === 'student') {
      this.publicAuthScreen.set('forgot-password');
      this.loginErrorMessage.set(null);
      this.syncUrl(this.selectedRole());
    }
  }

  onBackToLogin() {
    this.publicAuthScreen.set('login');
    this.loginErrorMessage.set(null);
    this.resetToken.set(null);
    this.resetEmail.set(null);
    this.resetUserName.set(null);
    this.syncUrl(this.selectedRole());
  }

  onResetCompleted() {
    this.publicAuthScreen.set('login');
    this.loginErrorMessage.set('Mot de passe reinitialise avec succes. Connectez-vous avec votre nouveau mot de passe.');
    this.resetToken.set(null);
    this.resetEmail.set(null);
    this.resetUserName.set(null);
    this.syncUrl(this.selectedRole());
  }

  private checkPasswordStatus() {
    const role = this.userRole()?.toString().trim().toLowerCase();
    if (role === 'admin') {
      return;
    }

    this.authService.getPasswordStatus().subscribe({
      next: (status) => {
        this.announceLoginSuccess(this.userRole(), status.needsPasswordChange === true && !status.blocked);
        if (status.needsPasswordChange === true && !status.blocked) {
          this.showPasswordWarning();
        }
      },
      error: (err) => console.warn('getPasswordStatus error:', err)
    });
  }

  private showPasswordWarning() {
    const message = 'Votre acces sera bloque apres 24 heures si vous ne changerez pas votre mot de passe.';

    this.notificationService.addNotification({
      title: 'Changement de mot de passe requis',
      message,
      type: 'warning'
    });

    this.transientNotificationMessage.set(message);
    if (this.transientNotificationTimeout) {
      clearTimeout(this.transientNotificationTimeout);
    }
    this.transientNotificationTimeout = setTimeout(() => {
      this.transientNotificationMessage.set(null);
      this.transientNotificationTimeout = null;
    }, 5000);
  }

  private announceLoginSuccess(role: UserRole, shouldWarnAboutPassword: boolean) {
    const welcomeMessage = 'Bienvenue sur EduVia, vous avez accede a votre interface.';

    if (role === 'admin') {
      this.speakText(welcomeMessage);
      return;
    }

    if ((role === 'student' || role === 'teacher') && shouldWarnAboutPassword) {
      this.speakText(`${welcomeMessage} Votre acces sera bloque apres 24 heures si vous ne changerez pas votre mot de passe.`);
      return;
    }

    if (role === 'student' || role === 'teacher') {
      this.speakText(welcomeMessage);
    }
  }

  onLogout() {
    this.authService.logout().subscribe({
      next: () => this.finalizeLogout(),
      error: () => this.finalizeLogout()
    });
  }

  private finalizeLogout() {
    this.authService.clearTokens();
    this.notificationService.clearNotifications();
    this.clearTransientNotification();
    localStorage.removeItem('role');
    localStorage.removeItem('current_user_email');
    window.history.replaceState({}, '', window.location.pathname);
    this.resetState();
    this.isInitializing.set(false);
  }

  private applyRoleFromUrl() {
    const params = new URLSearchParams(window.location.search);
    const role = params.get('role');
    const resetToken = params.get('resetToken');

    if (role === 'student' || role === 'teacher' || role === 'admin') {
      this.selectedRole.set(role);
    }

    if (resetToken) {
      this.resetToken.set(resetToken);
    }
  }

  private restoreSession() {
    const storedRole = localStorage.getItem('role') as UserRole;

    if (!this.authService.isLoggedIn() || !storedRole) {
      if (this.selectedRole() && this.resetToken()) {
        this.validateResetFlow(this.resetToken()!);
        return;
      }
      this.isInitializing.set(false);
      return;
    }

    this.authService.verifyToken().subscribe({
      next: (response: any) => {
        const user = response?.user || response?.data?.user || response?.data || response || {};
        const role = user?.roles?.find((value: string) =>
          ['admin', 'teacher', 'student'].includes(value),
        ) || user?.role || storedRole;

        const normalizedRole = role?.toString().trim().toLowerCase() as UserRole;

        if (!normalizedRole) {
          this.finalizeLogout();
          return;
        }

        this.userRole.set(normalizedRole);
        this.selectedRole.set(null);
        this.loginErrorMessage.set(null);
        localStorage.setItem('role', normalizedRole);
        this.isInitializing.set(false);

        if (normalizedRole !== 'admin') {
          this.checkPasswordStatus();
        }
      },
      error: () => {
        this.finalizeLogout();
      }
    });
  }

  private clearTransientNotification() {
    if (this.transientNotificationTimeout) {
      clearTimeout(this.transientNotificationTimeout);
      this.transientNotificationTimeout = null;
    }
    this.transientNotificationMessage.set(null);
  }

  private speakText(text: string) {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'fr-FR';
      utterance.rate = 1;
      utterance.volume = 1;
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(utterance);
    }
  }

  private validateResetFlow(token: string) {
    this.authService.validatePasswordResetToken(token).subscribe({
      next: (data) => {
        this.selectedRole.set(data.role);
        this.resetEmail.set(data.email);
        this.resetUserName.set(data.name);
        this.publicAuthScreen.set('reset-password');
        this.isInitializing.set(false);
        this.syncUrl(data.role, token);
      },
      error: () => {
        this.publicAuthScreen.set('login');
        this.resetToken.set(null);
        this.resetEmail.set(null);
        this.resetUserName.set(null);
        this.loginErrorMessage.set('Le lien de reinitialisation est invalide ou expire.');
        this.isInitializing.set(false);
        this.syncUrl(this.selectedRole());
      }
    });
  }

  private syncUrl(role: UserRole, resetToken?: string | null) {
    const params = new URLSearchParams();
    if (role) {
      params.set('role', role);
    }
    if (resetToken) {
      params.set('resetToken', resetToken);
    }
    const query = params.toString();
    const nextUrl = query ? `${window.location.pathname}?${query}` : window.location.pathname;
    window.history.replaceState({}, '', nextUrl);
=======
import { Component, signal } from '@angular/core';
import { Login } from './components/login/login';
import { StudentDashboard } from './components/student-dashboard/student-dashboard';

@Component({
  selector: 'app-root',
  imports: [StudentDashboard, Login],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  protected readonly title = signal('EduVia-Frontend');
  isLoggedIn = signal(false);

  onLogin(_event: { role: 'student' | null; email: string; password: string }) {
    this.isLoggedIn.set(true);
  }

  onLogout() {
    this.isLoggedIn.set(false);
>>>>>>> souhail
  }
}
