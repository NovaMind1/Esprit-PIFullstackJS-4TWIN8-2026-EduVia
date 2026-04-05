import { Component, OnInit, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTabsModule } from '@angular/material/tabs';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatBadgeModule } from '@angular/material/badge';
import { AiAssessment } from '../student/ai-assessment/ai-assessment';
import { CourseQuiz } from '../student/course-quiz/course-quiz';
import { RecommendationSystem } from '../student/recommendation-system/recommendation-system';
import { RatingSystem } from '../student/rating-system/rating-system';
import { Chatbot } from '../student/chatbot/chatbot';
import { ClubSuggestions } from '../student/club-suggestions/club-suggestions';
import { StudentForum } from '../student/student-forum/student-forum';
import { NotificationBell } from '../notification-bell/notification-bell';
import { TeacherProfileSettingsComponent } from '../teacher/teacher-profile-settings/teacher-profile-settings';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-student-dashboard',
  imports: [
    CommonModule,
    MatTabsModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatProgressBarModule,
    MatBadgeModule,
    NotificationBell,
    AiAssessment,
    CourseQuiz,
    RecommendationSystem,
    RatingSystem,
    Chatbot,
    ClubSuggestions,
    StudentForum,
    TeacherProfileSettingsComponent,
  ],
  templateUrl: './student-dashboard.html',
  styleUrls: ['./student-dashboard.css'],
})
export class StudentDashboard implements OnInit {
  logout = output();
  userAvatarUrl = '';

  studentData = {
    name: 'Etudiant',
    level: 'Licence 2 Informatique',
    overallProgress: 75,
    currentCourses: [
      { id: 1, name: 'Structures de données', progress: 60, status: 'en cours' },
      { id: 2, name: 'Algorithmique avancée', progress: 85, status: 'en cours' },
      { id: 3, name: 'Bases de données', progress: 45, status: 'à risque' }
    ],
    notifications: [
      { id: 1, text: 'Courage ! Tu as bien progressé en algorithmique.', type: 'motivation' },
      { id: 2, text: 'Examen de BD dans 5 jours - Révise les chapitres 3 et 4', type: 'exam' }
    ]
  };

  showChatbot = false;

  constructor(private auth: AuthService) {
    const identity = this.getIdentityFromToken();
    this.studentData.name = identity.fullName || this.studentData.name;
  }

  ngOnInit() {
    const identity = this.getIdentityFromToken();

    this.auth.getProfile().subscribe({
      next: (response) => {
        const profile = response?.data || response || {};
        setTimeout(() => {
          this.studentData.name = String(profile.fullName || identity.fullName || this.studentData.name).trim();
          this.userAvatarUrl = String(profile.avatarDataUrl || '').trim();
        }, 0);
      },
      error: () => {
        setTimeout(() => {
          this.userAvatarUrl = '';
        }, 0);
      },
    });
  }

  get userInitial(): string {
    return this.studentData.name.trim().charAt(0).toUpperCase() || 'E';
  }

  onLogout() {
    this.logout.emit();
  }

  toggleChatbot() {
    this.showChatbot = !this.showChatbot;
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
