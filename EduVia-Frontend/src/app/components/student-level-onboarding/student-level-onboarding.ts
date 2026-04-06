import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

type StudentLevel = 'debutant' | 'intermediaire' | 'avance';

type LevelAssessmentQuestion = {
  id: string;
  subject: string;
  prompt: string;
  hint: string;
  options: {
    id: string;
    label: string;
  }[];
};

export type LevelAssessmentResult = {
  email: string | null;
  level: StudentLevel;
  levelLabel: string;
  score: number;
  totalQuestions: number;
  percentage: number;
  summary: string;
  recommendation: string;
  strongestSubjects: string[];
  improvementSubjects: string[];
  subjectBreakdown: {
    subject: string;
    correct: boolean;
    selectedOptionId: string | null;
    selectedLabel: string;
    correctLabel: string;
    explanation: string;
  }[];
  completedAt: string;
};

@Component({
  selector: 'app-student-level-onboarding',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  templateUrl: './student-level-onboarding.html',
  styleUrl: './student-level-onboarding.css',
})
export class StudentLevelOnboarding implements OnChanges {
  @Input() studentEmail = '';
  @Input() existingResult: LevelAssessmentResult | null = null;

  @Output() resultSaved = new EventEmitter<LevelAssessmentResult>();
  @Output() continueToDashboard = new EventEmitter<void>();
  @Output() logout = new EventEmitter<void>();

  mode: 'welcome' | 'quiz' | 'result' = 'welcome';
  questions: LevelAssessmentQuestion[] = [];
  currentQuestionIndex = 0;
  selectedAnswers: Record<string, string> = {};
  loadingQuestions = false;
  submitting = false;
  errorMessage = '';
  activeResult: LevelAssessmentResult | null = null;

  constructor(private http: HttpClient) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['existingResult'] && this.existingResult) {
      this.activeResult = this.existingResult;
    }
  }

  get currentQuestion() {
    return this.questions[this.currentQuestionIndex] || null;
  }

  get progressPercentage() {
    if (!this.questions.length) {
      return 0;
    }

    return Math.round(((this.currentQuestionIndex + 1) / this.questions.length) * 100);
  }

  get currentAnswer() {
    const question = this.currentQuestion;
    if (!question) {
      return null;
    }

    return this.selectedAnswers[question.id] || null;
  }

  get answeredCount() {
    return Object.keys(this.selectedAnswers).length;
  }

  get studentFirstName() {
    const localPart = this.studentEmail.split('@')[0] || 'etudiant';
    const cleaned = localPart
      .replace(/[._-]+/g, ' ')
      .trim();

    if (!cleaned) {
      return 'etudiant';
    }

    return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
  }

  startAssessment() {
    this.errorMessage = '';
    this.activeResult = null;
    this.mode = 'quiz';
    this.currentQuestionIndex = 0;
    this.selectedAnswers = {};

    if (this.questions.length > 0) {
      return;
    }

    this.loadingQuestions = true;
    this.http
      .get<{ totalQuestions: number; questions: LevelAssessmentQuestion[] }>(
        '/api/student/level-assessment/questions',
      )
      .subscribe({
        next: payload => {
          this.questions = payload.questions || [];
          this.loadingQuestions = false;
        },
        error: () => {
          this.loadingQuestions = false;
          this.errorMessage =
            "Impossible de charger le quiz de niveau pour le moment. Reessayez dans un instant.";
          this.mode = 'welcome';
        },
      });
  }

  selectOption(optionId: string) {
    const question = this.currentQuestion;
    if (!question) {
      return;
    }

    this.selectedAnswers = {
      ...this.selectedAnswers,
      [question.id]: optionId,
    };
    this.errorMessage = '';
  }

  goToPreviousQuestion() {
    if (this.currentQuestionIndex > 0) {
      this.currentQuestionIndex -= 1;
      this.errorMessage = '';
    }
  }

  goToNextQuestion() {
    if (!this.currentAnswer) {
      this.errorMessage = 'Choisis une reponse pour continuer.';
      return;
    }

    if (this.currentQuestionIndex < this.questions.length - 1) {
      this.currentQuestionIndex += 1;
      this.errorMessage = '';
    }
  }

  submitAssessment() {
    if (this.answeredCount !== this.questions.length) {
      this.errorMessage =
        'Le test de niveau doit etre complete avant la validation finale.';
      return;
    }

    this.submitting = true;
    this.errorMessage = '';

    const answers = this.questions.map(question => ({
      questionId: question.id,
      selectedOptionId: this.selectedAnswers[question.id],
    }));

    this.http
      .post<LevelAssessmentResult>('/api/student/level-assessment/submit', {
        email: this.studentEmail,
        answers,
      })
      .subscribe({
        next: result => {
          this.submitting = false;
          this.activeResult = result;
          this.mode = 'result';
          this.resultSaved.emit(result);
        },
        error: () => {
          this.submitting = false;
          this.errorMessage =
            "Impossible de calculer votre niveau pour le moment. Merci de reessayer.";
        },
      });
  }

  continueWithExistingLevel() {
    if (this.existingResult) {
      this.activeResult = this.existingResult;
      this.continueToDashboard.emit();
    }
  }

  continueAfterResult() {
    if (!this.activeResult) {
      return;
    }

    this.continueToDashboard.emit();
  }

  retakeAssessment() {
    this.activeResult = null;
    this.startAssessment();
  }

  backToWelcome() {
    this.mode = 'welcome';
    this.errorMessage = '';
    this.currentQuestionIndex = 0;
    this.selectedAnswers = {};
  }

  resultTone(level: StudentLevel | undefined) {
    switch (level) {
      case 'avance':
        return 'green';
      case 'intermediaire':
        return 'gold';
      default:
        return 'rose';
    }
  }

  formatDate(value?: string | null) {
    if (!value) {
      return '';
    }

    return new Date(value).toLocaleString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }
}
