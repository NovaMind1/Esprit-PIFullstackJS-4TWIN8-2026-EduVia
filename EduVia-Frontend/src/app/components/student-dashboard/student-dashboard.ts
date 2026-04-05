<<<<<<< HEAD
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
=======
import { CommonModule } from '@angular/common';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { AiAssessment } from '../student/ai-assessment/ai-assessment';
import { Chatbot } from '../student/chatbot/chatbot';
import { ClubSuggestions } from '../student/club-suggestions/club-suggestions';
import { CourseQuiz } from '../student/course-quiz/course-quiz';
import { RatingSystem } from '../student/rating-system/rating-system';
import { StudentForum } from '../student/student-forum/student-forum';

type StudentLevel = 'debutant' | 'intermediaire' | 'avance';
type StudentTab =
  | 'parcours'
  | 'evaluation'
  | 'quiz'
  | 'communaute'
  | 'clubs'
  | 'assistant'
  | 'parametres';

type ContentItem = {
  _id: string;
  type: string;
  title: string;
  description?: string;
  courseId?: string;
  chapterId?: string;
  partId?: string;
  fileUrl?: string;
  fileName?: string;
  source?: string;
  dueDate?: string;
  quizMode?: string;
  quizDifficulty?: string;
  quizAttempts?: number;
  quizPassingScore?: number;
  quizQuestions?: unknown[];
  isActive?: boolean;
};

type RecommendationItem = {
  id: string;
  icon: string;
  title: string;
  type: 'Cours' | 'Video' | 'Quiz';
  level: string;
  duration: string;
  reason: string;
  contentType: string;
  description?: string;
  fileUrl?: string;
  source?: string;
  courseId?: string;
  chapterId?: string;
  partId?: string;
  fileName?: string;
  dueDate?: string;
  quizMode?: string;
  quizDifficulty?: string;
  quizPassingScore?: number;
  quizQuestions?: unknown[];
  quizAttempts?: number;
};

type LearningPathCourse = {
  id: string;
  title: string;
  description: string;
  level: string;
  duration: string;
  progress: number;
};

type CourseCatalogItem = {
  id: string;
  title: string;
  description: string;
  level: string;
  chapters: number;
  hours: number;
  students: number;
  rating: number;
  teacher: string;
  progress: number;
  coverStyle: string;
  accent: string;
};

type OverviewCard = {
  title: string;
  icon: string;
  accent: 'blue' | 'orange' | 'green' | 'yellow';
  value: string;
  subtitle: string;
  progress: number | null;
};

type SkillDetail = {
  label: string;
  value: number;
  color: string;
};

@Component({
  selector: 'app-student-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    HttpClientModule,
    MatButtonModule,
    MatIconModule,
    AiAssessment,
    CourseQuiz,
    StudentForum,
    ClubSuggestions,
    Chatbot,
    RatingSystem,
  ],
  templateUrl: './student-dashboard.html',
  styleUrl: './student-dashboard.css',
})
export class StudentDashboard implements OnInit {
  @Output() logout = new EventEmitter<void>();
  @Input() studentLevel: StudentLevel = 'debutant';

  studentProfile = {
    name: 'Marie Dubois',
    levelLabel: 'Debutant',
    learningStyle: 'Visuel & Pratique',
  };

  tabs: { id: StudentTab; label: string }[] = [
    { id: 'parcours', label: 'Parcours' },
    { id: 'evaluation', label: 'Evaluation' },
    { id: 'quiz', label: 'Quiz' },
    { id: 'communaute', label: 'Communaute' },
    { id: 'clubs', label: 'Clubs' },
    { id: 'assistant', label: 'Assistant IA' },
    { id: 'parametres', label: 'Parametres' },
  ];

  activeTab: StudentTab = 'parcours';
  loading = false;
  error = '';
  selectedRecommendation: RecommendationItem | null = null;
  previewUrl: SafeResourceUrl | null = null;
  readonly backendBaseUrl =
    `${window.location.protocol}//${window.location.hostname}:3000`;

  overviewCards: OverviewCard[] = [];
  recommendations: RecommendationItem[] = [];
  learningPath: LearningPathCourse[] = [];
  courseCatalog: CourseCatalogItem[] = [];
  filteredCourseCatalog: CourseCatalogItem[] = [];
  allVisibleContents: ContentItem[] = [];
  selectedCourse: CourseCatalogItem | null = null;
  selectedCourseResources: RecommendationItem[] = [];
  selectedStandaloneQuizId: string | null = null;
  selectedStandaloneQuiz: RecommendationItem | null = null;
  searchTerm = '';
  selectedLevelFilter = 'Tous les niveaux';
  selectedSort = 'Plus populaires';
  readonly levelFilters = ['Tous les niveaux', 'Debutant', 'Intermediaire', 'Avance'];
  readonly sortOptions = ['Plus populaires', 'Mieux notes', 'A continuer', 'Ordre alphabetique'];

  skillDetails: SkillDetail[] = [
    { label: 'Programmation', value: 75, color: '#3b82f6' },
    { label: 'Mathematiques', value: 60, color: '#22c55e' },
    { label: 'Algorithmique', value: 50, color: '#a855f7' },
    { label: 'Base de donnees', value: 40, color: '#f97316' },
    { label: 'Reseaux', value: 35, color: '#ef4444' },
  ];

  radarPoints = '50,24 72,39 64,66 36,66 28,39';
  private readonly dashboardCacheKeyPrefix = 'eduvia-student-dashboard';

  constructor(
    private http: HttpClient,
    private sanitizer: DomSanitizer,
  ) {}

  ngOnInit(): void {
    this.studentProfile.levelLabel = this.levelLabel(this.studentLevel);
    this.restoreCachedDashboard();
    this.loadStudentContent();
  }

  setActiveTab(tabId: StudentTab) {
    this.activeTab = tabId;
>>>>>>> souhail
  }

  onLogout() {
    this.logout.emit();
  }

<<<<<<< HEAD
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
=======
  startRecommendation(item: RecommendationItem) {
    if (item.type === 'Quiz') {
      this.selectedStandaloneQuizId = item.id;
      this.selectedStandaloneQuiz = item;
      return;
    }

    this.selectedRecommendation = item;
    this.previewUrl = this.buildPreviewUrl(item);
  }

  recommendationActionLabel(item: RecommendationItem) {
    if (item.type !== 'Quiz') {
      return 'Commencer';
    }

    return this.hasReachedQuizLimit(item) ? 'Voir le resultat' : 'Commencer';
  }

  closeRecommendationPreview() {
    this.selectedRecommendation = null;
    this.previewUrl = null;
  }

  recommendationTypeClass(type: RecommendationItem['type']) {
    switch (type) {
      case 'Cours':
        return 'course';
      case 'Video':
        return 'video';
      default:
        return 'quiz';
    }
  }

  courseTrackColor(level: string) {
    return this.normalizeLevel(level) === 'intermediaire' ? 'gold' : 'green';
  }

  courseLevelClass(level: string) {
    const normalized = this.normalizeLevel(level);
    if (normalized === 'intermediaire') {
      return 'course-pill--intermediate';
    }
    if (normalized === 'avance') {
      return 'course-pill--advanced';
    }

    return 'course-pill--beginner';
  }

  openCourse(course: CourseCatalogItem) {
    this.selectedCourse = course;
    this.selectedCourseResources = this.buildCourseResources(course.id);
  }

  closeSelectedCourse() {
    this.selectedCourse = null;
    this.selectedCourseResources = [];
    this.selectedStandaloneQuizId = null;
    this.selectedStandaloneQuiz = null;
  }

  closeStandaloneQuiz() {
    this.selectedStandaloneQuizId = null;
    this.selectedStandaloneQuiz = null;
  }

  private loadStudentContent() {
    this.loading = true;
    this.error = '';

    this.http
      .get<{
        level: StudentLevel;
        contents: ContentItem[];
        recommendations: ContentItem[];
        stats: {
          totalCourses: number;
          totalDocuments: number;
          totalVideos: number;
          totalQuizzes: number;
          totalItems: number;
        };
      }>(`/api/student/dashboard?level=${this.studentLevel}`)
      .subscribe({
      next: payload => {
        this.applyDashboardPayload(payload);
        this.cacheDashboardPayload(payload);
        this.loading = false;
      },
      error: () => {
        this.learningPath = [];
        this.recommendations = [];
        this.overviewCards = this.buildOverviewCards([]);
        this.error =
          "Impossible de charger les contenus de l'espace etudiant pour le moment.";
        this.loading = false;
      },
    });
  }

  private restoreCachedDashboard() {
    const raw = localStorage.getItem(this.dashboardCacheKey());
    if (!raw) {
      return;
    }

    try {
      const payload = JSON.parse(raw) as {
        contents: ContentItem[];
        recommendations?: ContentItem[];
      };
      this.applyDashboardPayload(payload);
    } catch {
      localStorage.removeItem(this.dashboardCacheKey());
    }
  }

  private cacheDashboardPayload(payload: {
    contents: ContentItem[];
    recommendations?: ContentItem[];
  }) {
    localStorage.setItem(this.dashboardCacheKey(), JSON.stringify(payload));
  }

  private applyDashboardPayload(payload: {
    contents: ContentItem[];
    recommendations?: ContentItem[];
  }) {
    const activeContents = (payload.contents || []).filter(item => item && item.type);
    this.allVisibleContents = activeContents;
    this.learningPath = this.buildLearningPath(activeContents);
    this.courseCatalog = this.buildCourseCatalog(activeContents);
    this.updateFilteredCourseCatalog();
    this.recommendations = this.buildRecommendations(payload.recommendations || activeContents);
    this.overviewCards = this.buildOverviewCards(activeContents);

    if (this.selectedCourse) {
      const refreshedCourse =
        this.courseCatalog.find(course => course.id === this.selectedCourse?.id) || null;
      this.selectedCourse = refreshedCourse;
      this.selectedCourseResources = refreshedCourse
        ? this.buildCourseResources(refreshedCourse.id)
        : [];
    }
  }

  private dashboardCacheKey() {
    return `${this.dashboardCacheKeyPrefix}-${this.studentLevel}`;
  }

  private buildLearningPath(contents: ContentItem[]): LearningPathCourse[] {
    const grouped = new Map<
      string,
      {
        title: string;
        descriptions: Set<string>;
        items: ContentItem[];
      }
    >();

    contents.forEach(item => {
      const courseKey = item.courseId || 'Cours';
      if (!grouped.has(courseKey)) {
        grouped.set(courseKey, {
          title: courseKey,
          descriptions: new Set<string>(),
          items: [],
        });
      }

      const bucket = grouped.get(courseKey)!;
      if (item.chapterId) {
        bucket.descriptions.add(item.chapterId);
      }
      bucket.items.push(item);
    });

    return Array.from(grouped.entries()).map(([id, group], index) => {
      const visibleQuizzes = group.items.filter(
        item =>
          this.isQuiz(item) &&
          this.matchesStudentLevel(item.quizDifficulty),
      );
      const visibleItems = group.items.filter(
        item => !this.isQuiz(item) || this.matchesStudentLevel(item.quizDifficulty),
      );
      const quizCount = visibleQuizzes.length;
      const docCount = visibleItems.filter(item => this.isDocument(item)).length;
      const videoCount = visibleItems.filter(item => this.isVideo(item)).length;
      const progress = Math.min(25 + index * 18 + visibleItems.length * 7, 95);

      return {
        id,
        title: group.title,
        description:
          Array.from(group.descriptions).join(' • ') ||
          'Contenus ajoutes par votre professeur',
        level: this.studentProfile.levelLabel,
        duration: `${Math.max(1, visibleItems.length * 2)} heures`,
        progress,
      };
    });
  }

  private buildCourseCatalog(contents: ContentItem[]): CourseCatalogItem[] {
    const grouped = new Map<
      string,
      {
        title: string;
        descriptions: Set<string>;
        items: ContentItem[];
      }
    >();

    contents.forEach(item => {
      const courseKey = item.courseId || 'Cours';
      if (!grouped.has(courseKey)) {
        grouped.set(courseKey, {
          title: courseKey,
          descriptions: new Set<string>(),
          items: [],
        });
      }

      const bucket = grouped.get(courseKey)!;
      if (item.chapterId) {
        bucket.descriptions.add(item.chapterId);
      }
      bucket.items.push(item);
    });

    return Array.from(grouped.entries()).map(([id, group], index) => {
      const chapterCount = Math.max(1, group.descriptions.size);
      const itemCount = group.items.length;
      const progress = Math.min(20 + itemCount * 8 + index * 9, 88);
      const detectedLevel =
        group.items.find(item => this.isQuiz(item) && this.matchesStudentLevel(item.quizDifficulty))
          ?.quizDifficulty || this.studentProfile.levelLabel;

      return {
        id,
        title: group.title,
        description:
          Array.from(group.descriptions).join(', ') ||
          'Choisissez ce cours pour commencer votre apprentissage',
        level: this.levelLabel(this.normalizeLevel(detectedLevel) || this.studentLevel),
        chapters: chapterCount,
        hours: Math.max(2, itemCount * 2),
        students: 120 + index * 37 + itemCount * 6,
        rating: Number((4.2 + ((index % 4) * 0.15)).toFixed(1)),
        teacher: this.teacherNameForIndex(index),
        progress,
        coverStyle: this.coverStyleForIndex(index),
        accent: this.coverAccent(index),
      };
    });
  }

  updateFilteredCourseCatalog() {
    const search = this.searchTerm.trim().toLowerCase();

    let result = [...this.courseCatalog].filter(course => {
      const matchesSearch =
        !search ||
        course.title.toLowerCase().includes(search) ||
        course.description.toLowerCase().includes(search);
      const matchesLevel =
        this.selectedLevelFilter === 'Tous les niveaux' ||
        course.level === this.selectedLevelFilter;

      return matchesSearch && matchesLevel;
    });

    switch (this.selectedSort) {
      case 'Mieux notes':
        result.sort((a, b) => b.rating - a.rating);
        break;
      case 'A continuer':
        result.sort((a, b) => b.progress - a.progress);
        break;
      case 'Ordre alphabetique':
        result.sort((a, b) => a.title.localeCompare(b.title));
        break;
      default:
        result.sort((a, b) => b.students - a.students);
        break;
    }

    this.filteredCourseCatalog = result;
  }

  private buildRecommendations(contents: ContentItem[]): RecommendationItem[] {
    const levelLabel = this.levelLabel(this.studentLevel);
    const filtered = contents.filter(item => {
      if (!item.isActive && item.isActive !== undefined) {
        return false;
      }

      if (this.isQuiz(item)) {
        return (
          this.matchesStudentLevel(item.quizDifficulty) &&
          Array.isArray(item.quizQuestions) &&
          item.quizQuestions.length > 0
        );
      }

      return this.isDocument(item) || this.isVideo(item);
    });

    return filtered.slice(0, 6).map(item => ({
      id: item._id,
      icon: this.isQuiz(item)
        ? 'quiz'
        : this.isVideo(item)
          ? 'videocam'
          : 'menu_book',
      title: item.title || 'Contenu sans titre',
      type: this.isQuiz(item)
        ? 'Quiz'
        : this.isVideo(item)
          ? 'Video'
          : 'Cours',
      level: levelLabel,
      duration: this.isQuiz(item) ? '15 min' : this.isVideo(item) ? '12 min' : '25 min',
      reason: this.isQuiz(item)
        ? `Quiz ${levelLabel.toLowerCase()} adapte a votre niveau`
        : `Ajoute par le professeur dans ${item.courseId || 'le cours'}`,
      contentType: item.type,
      description: item.description,
      fileUrl: item.fileUrl,
      source: item.source,
      courseId: item.courseId,
      chapterId: item.chapterId,
      partId: item.partId,
      fileName: item.fileName,
      dueDate: item.dueDate,
      quizMode: item.quizMode,
      quizDifficulty: item.quizDifficulty,
      quizPassingScore: item.quizPassingScore as number | undefined,
      quizQuestions: item.quizQuestions,
      quizAttempts: item.quizAttempts,
    }));
  }

  private buildCourseResources(courseId: string): RecommendationItem[] {
    return this.allVisibleContents
      .filter(item => (item.courseId || 'Cours') === courseId)
      .filter(item => {
        if (this.isQuiz(item)) {
          return (
            this.matchesStudentLevel(item.quizDifficulty) &&
            Array.isArray(item.quizQuestions) &&
            item.quizQuestions.length > 0
          );
        }

        return this.isDocument(item) || this.isVideo(item);
      })
      .map<RecommendationItem>(item => ({
        id: item._id,
        icon: this.isQuiz(item)
          ? 'quiz'
          : this.isVideo(item)
            ? 'videocam'
            : 'menu_book',
        title: item.title || 'Contenu sans titre',
        type: this.isQuiz(item)
          ? 'Quiz'
          : this.isVideo(item)
            ? 'Video'
            : 'Cours',
        level: this.levelLabel(this.studentLevel),
        duration: this.isQuiz(item) ? '15 min' : this.isVideo(item) ? '12 min' : '25 min',
        reason: item.chapterId
          ? `${item.chapterId} dans ${item.courseId || 'le cours'}`
          : `Ajoute dans ${item.courseId || 'le cours'}`,
        contentType: item.type,
        description: item.description,
        fileUrl: item.fileUrl,
        source: item.source,
        courseId: item.courseId,
        chapterId: item.chapterId,
        partId: item.partId,
        fileName: item.fileName,
        dueDate: item.dueDate,
        quizMode: item.quizMode,
        quizDifficulty: item.quizDifficulty,
        quizPassingScore: item.quizPassingScore as number | undefined,
        quizQuestions: item.quizQuestions,
        quizAttempts: item.quizAttempts,
      }))
      .sort((left, right) => {
        const order: Record<RecommendationItem['type'], number> = {
          Cours: 0,
          Video: 1,
          Quiz: 2,
        };
        return order[left.type] - order[right.type];
      });
  }

  private buildOverviewCards(contents: ContentItem[]): OverviewCard[] {
    const visibleQuizzes = contents.filter(
      item => this.isQuiz(item) && this.matchesStudentLevel(item.quizDifficulty),
    );
    const visibleDocs = contents.filter(item => this.isDocument(item));
    const visibleVideos = contents.filter(item => this.isVideo(item));
    const totalLearningItems =
      visibleQuizzes.length + visibleDocs.length + visibleVideos.length;
    const progress = totalLearningItems
      ? Math.min(35 + totalLearningItems * 6, 92)
      : 0;

    return [
      {
        title: 'Progression globale',
        icon: 'trending_up',
        accent: 'blue',
        value: `${progress}%`,
        subtitle: `${totalLearningItems} contenu(s) visible(s)`,
        progress,
      },
      {
        title: "Serie d'activite",
        icon: 'track_changes',
        accent: 'orange',
        value: `${Math.max(1, visibleDocs.length + visibleVideos.length)} jours`,
        subtitle: 'Continuez comme ca',
        progress: null,
      },
      {
        title: "Style d'apprentissage",
        icon: 'psychology',
        accent: 'green',
        value: this.studentProfile.learningStyle,
        subtitle: "Construit a partir du parcours visible",
        progress: null,
      },
      {
        title: 'Niveau actuel',
        icon: 'military_tech',
        accent: 'yellow',
        value: this.studentProfile.levelLabel,
        subtitle: `${visibleQuizzes.length} quiz correspondant(s)`,
        progress: null,
      },
    ];
  }

  private isQuiz(item: ContentItem) {
    return (item.type || '').toLowerCase() === 'quiz';
  }

  private isDocument(item: ContentItem) {
    return (item.type || '').toLowerCase() === 'document';
  }

  private isVideo(item: ContentItem) {
    return (item.type || '').toLowerCase() === 'video';
  }

  private matchesStudentLevel(difficulty?: string) {
    const normalized = this.normalizeLevel(difficulty);
    if (!normalized) {
      return true;
    }

    return normalized === this.studentLevel;
  }

  private normalizeLevel(value?: string): StudentLevel | null {
    const normalized = (value || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');

    if (normalized.startsWith('deb')) {
      return 'debutant';
    }
    if (normalized.startsWith('int') || normalized.includes('moyen')) {
      return 'intermediaire';
    }
    if (normalized.startsWith('ava')) {
      return 'avance';
    }

    return null;
  }

  private levelLabel(level: StudentLevel) {
    switch (level) {
      case 'intermediaire':
        return 'Intermediaire';
      case 'avance':
        return 'Avance';
      default:
        return 'Debutant';
    }
  }

  private buildPreviewUrl(item: RecommendationItem): SafeResourceUrl | null {
    const rawUrl = item.source || item.fileUrl;
    if (!rawUrl) {
      return null;
    }

    const normalizedUrl = rawUrl.startsWith('http')
      ? rawUrl
      : `${this.backendBaseUrl}${rawUrl}`;

    return this.sanitizer.bypassSecurityTrustResourceUrl(normalizedUrl);
  }

  private hasReachedQuizLimit(item: RecommendationItem) {
    if (item.type !== 'Quiz') {
      return false;
    }

    if ((item.quizAttempts || 1) > 1) {
      return false;
    }

    return !!localStorage.getItem(this.quizStorageKey(item.id));
  }

  private quizStorageKey(quizId: string) {
    return `eduvia-quiz-result-${quizId}`;
  }

  private coverStyleForIndex(index: number) {
    const themes = [
      'linear-gradient(135deg, #8b5a2b 0%, #c2864b 45%, #5f3b1f 100%)',
      'linear-gradient(135deg, #111827 0%, #1f2937 40%, #3b82f6 100%)',
      'linear-gradient(135deg, #0f172a 0%, #1d4ed8 35%, #93c5fd 100%)',
      'linear-gradient(135deg, #0b1020 0%, #1f2937 50%, #10b981 100%)',
      'linear-gradient(135deg, #1f2937 0%, #111827 55%, #a855f7 100%)',
    ];

    return themes[index % themes.length];
  }

  private coverAccent(index: number) {
    const accents = ['#ef233c', '#f97316', '#10b981', '#3b82f6', '#a855f7'];
    return accents[index % accents.length];
  }

  private teacherNameForIndex(index: number) {
    const teachers = [
      'Dr. Amira Mansouri',
      'Dr. Hichem Dhouib',
      'Eng. Nadia Hamdi',
      'Dr. Sarah Trabelsi',
      'Prof. Youssef Ben Salem',
    ];

    return teachers[index % teachers.length];
  }
>>>>>>> souhail
}
