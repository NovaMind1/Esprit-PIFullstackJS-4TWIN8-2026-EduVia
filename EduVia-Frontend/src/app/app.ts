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
  }
}
