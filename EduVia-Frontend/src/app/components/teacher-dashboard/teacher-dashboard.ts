import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTabsModule } from '@angular/material/tabs';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { MatCardModule } from '@angular/material/card';
import { StudentTracking } from '../teacher/student-tracking/student-tracking';
import { TeacherProfileSettingsComponent } from '../teacher/teacher-profile-settings/teacher-profile-settings';
import { ContentManagement } from '../teacher/content-management/content-management';
import { ExamReminders } from '../teacher/exam-reminders/exam-reminders';

type DashboardCourse = {
  title: string;
  subtitle: string;
  students: number;
  key: string;
  items?: any[];
};

@Component({
  selector: 'app-teacher-dashboard',
  imports: [
    CommonModule,
    MatTabsModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    HttpClientModule,
    StudentTracking,
    TeacherProfileSettingsComponent,
    ContentManagement,
    ExamReminders,
  ],
  templateUrl: './teacher-dashboard.html',
  styleUrls: ['./teacher-dashboard.css'],
})
export class TeacherDashboard implements OnInit {
  isMenuOpen = false;
  tabIndex = 0;

  @Output() logout = new EventEmitter<void>();

  readonly fallbackCourses: DashboardCourse[] = [
    {
      title: 'Mathématiques avancées',
      subtitle: 'Algèbre et calcul',
      students: 42,
      key: 'Mathématiques avancées',
    },
    {
      title: 'Physique I',
      subtitle: 'Mécanique classique',
      students: 38,
      key: 'Physique I',
    },
    {
      title: 'Programmation Web',
      subtitle: 'Angular & TypeScript',
      students: 56,
      key: 'Programmation Web',
    },
  ];

  courses: DashboardCourse[] = [];

  selectedCourse: {
    title: string;
    subtitle: string;
    students: number;
    key: string;
    items: any[];
  } | null = null;

  showCourseModal = false;
  courseContentMap: Record<string, any[]> = {};

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.loadCourses();
  }

  toggleMenu() {
    this.isMenuOpen = !this.isMenuOpen;
  }

  onLogout() {
    this.logout.emit();
  }

  viewDetails(course: DashboardCourse) {
    const items = this.courseContentMap[course.key] || [];
    this.selectedCourse = { ...course, items };
    this.showCourseModal = true;
  }

  closeCourseModal() {
    this.showCourseModal = false;
    this.selectedCourse = null;
  }

  loadCourses() {
    this.http.get<any[]>('/api/contents').subscribe(
      data => {
        const grouped = data.reduce((acc, item) => {
          const courseKey = item.courseId || item.course || 'Cours inconnu';
          const chapterName = item.chapterId || item.chapter || 'Chapitre 1';

          if (!acc[courseKey]) {
            acc[courseKey] = {
              title: courseKey,
              subtitle: chapterName,
              students: 0,
              items: [] as any[],
            };
          }

          acc[courseKey].students += 1;
          acc[courseKey].items.push(item);
          return acc;
        }, {} as Record<string, { title: string; subtitle: string; students: number; items: any[] }>);

        const apiCourses = Object.keys(grouped).map(key => ({ ...grouped[key], key }));

        setTimeout(() => {
          if (apiCourses.length > 0) {
            this.courses = apiCourses;
            this.courseContentMap = Object.keys(grouped).reduce((map, key) => {
              map[key] = grouped[key].items;
              return map;
            }, {} as Record<string, any[]>);
            return;
          }

          this.courses = [];
          this.courseContentMap = {};
        }, 0);
      },
      () => {
        setTimeout(() => {
          this.courses = [];
          this.courseContentMap = {};
        }, 0);
      },
    );
  }
}
