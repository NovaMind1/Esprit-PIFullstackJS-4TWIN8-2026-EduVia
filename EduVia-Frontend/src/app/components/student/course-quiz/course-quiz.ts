import { Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpClientModule } from '@angular/common/http';

type QuizQuestionOption = {
  label: string;
  text: string;
};

type QuizQuestion = {
  id: string;
  prompt: string;
  type: 'single' | 'multiple';
  options: QuizQuestionOption[];
  correctAnswers: string[];
  explanation?: string;
};

type QuizContent = {
  _id: string;
  title: string;
  description?: string;
  courseId?: string;
  chapterId?: string;
  partId?: string;
  fileUrl?: string;
  fileName?: string;
  dueDate?: string;
  quizMode?: string;
  quizDifficulty?: string;
  quizAttempts?: number;
  quizPassingScore?: number;
  quizQuestions: QuizQuestion[];
};

type QuizResult = {
  score: number;
  correctCount: number;
  totalQuestions: number;
  passed: boolean;
};

type StoredQuizAttempt = {
  result: QuizResult;
  answers: Record<string, string[]>;
  submittedAt: string;
};

@Component({
  selector: 'app-course-quiz',
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule],
  templateUrl: './course-quiz.html',
  styleUrl: './course-quiz.css',
})
export class CourseQuiz implements OnInit, OnChanges {
  @Input() studentLevel: 'debutant' | 'intermediaire' | 'avance' = 'debutant';
  @Input() selectedQuizId: string | null = null;
  @Input() standaloneQuizData: any | null = null;
  @Input() standalone = false;
  @Output() closed = new EventEmitter<void>();
  quizzes: QuizContent[] = [];
  selectedQuiz: QuizContent | null = null;
  answers: Record<string, string[]> = {};
  loading = false;
  error = '';
  submitted = false;
  result: QuizResult | null = null;
  readonly backendBaseUrl =
    `${window.location.protocol}//${window.location.hostname}:3000`;

  constructor(private http: HttpClient) {}

  ngOnInit() {
    if (this.standalone && this.standaloneQuizData) {
      this.bootstrapStandaloneQuiz(this.standaloneQuizData);
      return;
    }

    this.loadQuizzes();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['standaloneQuizData'] && this.standalone && this.standaloneQuizData) {
      this.bootstrapStandaloneQuiz(this.standaloneQuizData);
      return;
    }

    if (changes['selectedQuizId'] && !changes['selectedQuizId'].firstChange) {
      this.tryOpenSelectedQuiz();
    }
  }

  loadQuizzes() {
    this.loading = true;
    this.error = '';

    this.http.get<any[]>(`/api/student/quizzes?level=${this.studentLevel}`).subscribe({
      next: data => {
        this.quizzes = data
          .map(item => this.mapQuiz(item))
          .filter(
            (item): item is QuizContent =>
              !!item &&
              item.quizQuestions.length > 0,
          );
        this.tryOpenSelectedQuiz();
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.error = "Impossible de charger les quiz pour l'instant.";
      },
    });
  }

  startQuiz(quiz: QuizContent) {
    const previousAttempt = this.previousAttempt(quiz);
    if (this.hasReachedAttemptLimit(quiz) && previousAttempt) {
      this.openAttemptReview(quiz, previousAttempt);
      return;
    }

    this.selectedQuiz = quiz;
    this.answers = {};
    this.submitted = false;
    this.result = null;
  }

  closeQuiz() {
    if (this.standalone) {
      this.closed.emit();
    }
    this.selectedQuiz = null;
    this.answers = {};
    this.submitted = false;
    this.result = null;
  }

  toggleAnswer(question: QuizQuestion, optionLabel: string, checked: boolean) {
    if (!this.selectedQuiz || this.submitted) {
      return;
    }

    const currentAnswers = this.answers[question.id] || [];

    if (question.type === 'single') {
      this.answers[question.id] = [optionLabel];
      return;
    }

    this.answers[question.id] = checked
      ? [...currentAnswers, optionLabel]
      : currentAnswers.filter(answer => answer !== optionLabel);
  }

  isChecked(question: QuizQuestion, optionLabel: string): boolean {
    return (this.answers[question.id] || []).includes(optionLabel);
  }

  submitQuiz() {
    if (!this.selectedQuiz) {
      return;
    }

    let correctCount = 0;

    this.selectedQuiz.quizQuestions.forEach(question => {
      const selectedAnswers = [...(this.answers[question.id] || [])].sort();
      const expectedAnswers = [...question.correctAnswers].sort();
      const isCorrect =
        selectedAnswers.length === expectedAnswers.length &&
        selectedAnswers.every((answer, index) => answer === expectedAnswers[index]);

      if (isCorrect) {
        correctCount += 1;
      }
    });

    const totalQuestions = this.selectedQuiz.quizQuestions.length;
    const score = Math.round((correctCount / totalQuestions) * 100);
    const passed = score >= (this.selectedQuiz.quizPassingScore || 70);

    this.submitted = true;
    this.result = {
      score,
      correctCount,
      totalQuestions,
      passed,
    };

    localStorage.setItem(
      this.storageKey(this.selectedQuiz._id),
      JSON.stringify({
        result: this.result,
        answers: this.answers,
        submittedAt: new Date().toISOString(),
      } satisfies StoredQuizAttempt),
    );
  }

  previousResult(quiz: QuizContent): QuizResult | null {
    return this.previousAttempt(quiz)?.result || null;
  }

  hasReachedAttemptLimit(quiz: QuizContent): boolean {
    if ((quiz.quizAttempts || 1) > 1) {
      return false;
    }

    return !!this.previousAttempt(quiz);
  }

  primaryActionLabel(quiz: QuizContent): string {
    return this.hasReachedAttemptLimit(quiz) ? 'Voir le resultat' : 'Commencer';
  }

  questionAnsweredCorrectly(question: QuizQuestion): boolean {
    const selectedAnswers = [...(this.answers[question.id] || [])].sort();
    const expectedAnswers = [...question.correctAnswers].sort();

    return (
      selectedAnswers.length === expectedAnswers.length &&
      selectedAnswers.every((answer, index) => answer === expectedAnswers[index])
    );
  }

  selectedAnswerLabels(question: QuizQuestion): string {
    const selectedAnswers = this.answers[question.id] || [];
    return selectedAnswers.length > 0 ? selectedAnswers.join(', ') : 'Aucune reponse';
  }

  downloadUrl(quiz: QuizContent): string | null {
    if (!quiz.fileUrl) {
      return null;
    }

    return quiz.fileUrl.startsWith('http')
      ? quiz.fileUrl
      : `${this.backendBaseUrl}${quiz.fileUrl}`;
  }

  private mapQuiz(item: any): QuizContent | null {
    if (!Array.isArray(item.quizQuestions)) {
      return null;
    }

    return {
      _id: item._id,
      title: item.title || 'Quiz sans titre',
      description: item.description || '',
      courseId: item.courseId || '',
      chapterId: item.chapterId || '',
      partId: item.partId || '',
      fileUrl: item.fileUrl || undefined,
      fileName: item.fileName || undefined,
      dueDate: item.dueDate || undefined,
      quizMode: item.quizMode || 'generated',
      quizDifficulty: item.quizDifficulty || undefined,
      quizAttempts: item.quizAttempts || 1,
      quizPassingScore: item.quizPassingScore || 70,
      quizQuestions: item.quizQuestions,
    };
  }

  private matchesStudentLevel(difficulty?: string): boolean {
    const normalized = this.normalizeLevel(difficulty);
    if (!normalized) {
      return true;
    }

    return normalized === this.studentLevel;
  }

  private normalizeLevel(value?: string): 'debutant' | 'intermediaire' | 'avance' | null {
    const normalized = (value || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');

    if (normalized.startsWith('deb') || normalized.includes('facile')) {
      return 'debutant';
    }
    if (normalized.startsWith('int') || normalized.includes('moyen')) {
      return 'intermediaire';
    }
    if (normalized.startsWith('ava') || normalized.includes('difficile')) {
      return 'avance';
    }

    return null;
  }

  private storageKey(quizId: string): string {
    return `eduvia-quiz-result-${quizId}`;
  }

  private previousAttempt(quiz: QuizContent): StoredQuizAttempt | null {
    const raw = localStorage.getItem(this.storageKey(quiz._id));
    if (!raw) {
      return null;
    }

    try {
      const parsed = JSON.parse(raw) as StoredQuizAttempt | QuizResult;
      if ('result' in parsed && 'answers' in parsed) {
        return parsed;
      }

      return {
        result: parsed as QuizResult,
        answers: {},
        submittedAt: '',
      };
    } catch {
      return null;
    }
  }

  private openAttemptReview(quiz: QuizContent, attempt: StoredQuizAttempt) {
    this.selectedQuiz = quiz;
    this.answers = attempt.answers || {};
    this.submitted = true;
    this.result = attempt.result;
  }

  private bootstrapStandaloneQuiz(item: any) {
    const mapped = this.mapQuiz(item);
    this.loading = false;
    this.error = '';

    if (!mapped || mapped.quizQuestions.length === 0) {
      this.quizzes = [];
      this.selectedQuiz = null;
      this.error = "Impossible de charger ce quiz pour le moment.";
      return;
    }

    this.quizzes = [mapped];
    this.startQuiz(mapped);
  }

  private tryOpenSelectedQuiz() {
    if (!this.selectedQuizId) {
      return;
    }

    const targetQuiz = this.quizzes.find(quiz => quiz._id === this.selectedQuizId);
    if (!targetQuiz) {
      return;
    }

    if (this.selectedQuiz?._id === targetQuiz._id) {
      return;
    }

    this.startQuiz(targetQuiz);
  }
}
