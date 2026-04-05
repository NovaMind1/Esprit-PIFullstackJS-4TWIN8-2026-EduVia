import { Component, signal } from '@angular/core';
import { RoleSelection } from './components/role-selection/role-selection';
import { TeacherDashboard } from './components/teacher-dashboard/teacher-dashboard';
import { Login } from './components/login/login';

type UserRole = 'teacher' | null;

@Component({
  selector: 'app-root',
  imports: [
    RoleSelection,
    TeacherDashboard,
    Login,
  ],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  protected readonly title = signal('EduVia-Frontend');
  userRole = signal<UserRole>(null);
  selectedRole = signal<UserRole>(null);

  onRoleSelected(role: UserRole) {
    this.selectedRole.set(role);
  }

  onLogin(event: { role: UserRole; email: string; password: string }) {
    this.userRole.set(event.role);
    this.selectedRole.set(null);
  }

  onLogout() {
    this.userRole.set(null);
    this.selectedRole.set(null);
  }
}
