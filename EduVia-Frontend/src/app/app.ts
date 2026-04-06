import { Component, signal } from '@angular/core';
import { Login } from './components/login/login';
import { StudentDashboard } from './components/student-dashboard/student-dashboard';
import {
  LevelAssessmentResult,
  StudentLevelOnboarding,
} from './components/student-level-onboarding/student-level-onboarding';

@Component({
  selector: 'app-root',
  imports: [StudentDashboard, Login, StudentLevelOnboarding],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  protected readonly title = signal('EduVia-Frontend');
  isLoggedIn = signal(false);
  isDashboardReady = signal(false);
  studentEmail = signal('');
  studentLevel = signal<'debutant' | 'intermediaire' | 'avance'>('debutant');
  assessmentResult = signal<LevelAssessmentResult | null>(null);

  onLogin(event: { role: 'student' | null; email: string; password: string }) {
    const normalizedEmail = (event.email || '').trim().toLowerCase();
    this.studentEmail.set(normalizedEmail);
    this.isLoggedIn.set(true);

    const existing = this.restoreAssessmentResult(normalizedEmail);
    this.assessmentResult.set(existing);
    this.studentLevel.set(existing?.level || 'debutant');
    this.isDashboardReady.set(!!existing);
  }

  onLogout() {
    this.isLoggedIn.set(false);
    this.isDashboardReady.set(false);
    this.studentEmail.set('');
    this.studentLevel.set('debutant');
    this.assessmentResult.set(null);
  }

  onAssessmentSaved(result: LevelAssessmentResult) {
    this.assessmentResult.set(result);
    this.studentLevel.set(result.level);

    const email = (result.email || this.studentEmail() || '').trim().toLowerCase();
    if (email) {
      localStorage.setItem(this.assessmentStorageKey(email), JSON.stringify(result));
    }
  }

  openStudentDashboard() {
    this.isDashboardReady.set(true);
  }

  private restoreAssessmentResult(email: string) {
    if (!email) {
      return null;
    }

    try {
      const raw = localStorage.getItem(this.assessmentStorageKey(email));
      if (!raw) {
        return null;
      }

      return JSON.parse(raw) as LevelAssessmentResult;
    } catch {
      localStorage.removeItem(this.assessmentStorageKey(email));
      return null;
    }
  }

  private assessmentStorageKey(email: string) {
    return `eduvia-level-assessment-${email}`;
  }
}
