import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { catchError, of, timeout } from 'rxjs';
import { LEVEL_ASSESSMENT_FALLBACK_QUESTIONS } from './student-level-questions';

const LEVEL_ASSESSMENT_CORRECT_ANSWERS: Record<string, string> = {
  algo: 'algo-a',
  reseau: 'reseau-b',
  complexite: 'complexite-b',
  angular: 'angular-c',
  react: 'react-c',
  'gestion-projet': 'gp-a',
  c: 'c-c',
  java: 'java-b',
  cpp: 'cpp-b',
  python: 'python-c',
  graph: 'graph-b',
  pl: 'pl-a',
  bdd: 'bdd-c',
  electronique: 'elec-b',
  proba: 'proba-c',
  'analyse-num': 'an-b',
  microservices: 'ms-b',
  'spring-boot': 'sb-b',
};

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
  syncMessage = '';

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
    this.syncMessage = '';
    this.activeResult = null;
    this.mode = 'quiz';
    this.currentQuestionIndex = 0;
    this.selectedAnswers = {};
    this.questions = [...LEVEL_ASSESSMENT_FALLBACK_QUESTIONS] as unknown as LevelAssessmentQuestion[];
    this.loadingQuestions = false;
    this.http
      .get<{ totalQuestions: number; questions: LevelAssessmentQuestion[] }>(
        '/api/student/level-assessment/questions',
      )
      .pipe(
        timeout(4000),
        catchError(() => of(null)),
      )
      .subscribe({
        next: payload => {
          if (payload?.questions?.length) {
            this.questions = payload.questions;
          }
          this.loadingQuestions = false;
        },
        error: () => {
          this.loadingQuestions = false;
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
    this.syncMessage = 'Resultat en cours de synchronisation avec EduVia...';

    const answers = this.questions.map(question => ({
      questionId: question.id,
      selectedOptionId: this.selectedAnswers[question.id],
    }));

    const localResult = this.buildLocalAssessmentResult(answers);
    this.activeResult = localResult;
    this.mode = 'result';
    this.resultSaved.emit(localResult);
    this.submitting = false;

    this.http
      .post<LevelAssessmentResult>('/api/student/level-assessment/submit', {
        email: this.studentEmail,
        answers,
      })
      .pipe(
        timeout(5000),
        catchError(() => of(null)),
      )
      .subscribe({
        next: result => {
          if (result) {
            this.activeResult = result;
            this.resultSaved.emit(result);
          }
          this.syncMessage =
            'Resultat pret. Tu peux maintenant naviguer dans tout le dashboard etudiant.';
        },
        error: () => {
          this.syncMessage =
            'Resultat pret localement. Tu peux maintenant naviguer dans tout le dashboard etudiant.';
        },
      });
  }

  continueWithExistingLevel() {
    if (this.existingResult) {
      this.activeResult = this.existingResult;
      this.syncMessage = 'Ton niveau est deja connu. Tu peux ouvrir tout le dashboard.';
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

  private buildLocalAssessmentResult(
    answers: { questionId: string; selectedOptionId: string }[],
  ): LevelAssessmentResult {
    const subjectBreakdown = this.questions.map(question => {
      const selectedOptionId =
        answers.find(answer => answer.questionId === question.id)?.selectedOptionId || null;
      const selectedOption = question.options.find(option => option.id === selectedOptionId);
      const correctOptionId =
        LEVEL_ASSESSMENT_CORRECT_ANSWERS[question.id] || question.options[0]?.id || '';
      const correctOption = question.options.find(option => option.id === correctOptionId);
      const correct = selectedOptionId === correctOptionId;

      return {
        subject: question.subject,
        correct,
        selectedOptionId,
        selectedLabel: selectedOption?.label || 'Sans reponse',
        correctLabel: correctOption?.label || '',
        explanation: question.hint,
      };
    });

    const score = subjectBreakdown.filter(item => item.correct).length;
    const totalQuestions = this.questions.length;
    const percentage = totalQuestions ? Math.round((score / totalQuestions) * 100) : 0;
    const ratio = totalQuestions ? score / totalQuestions : 0;
    const level: StudentLevel =
      ratio >= 0.72 ? 'avance' : ratio >= 0.4 ? 'intermediaire' : 'debutant';
    const strongestSubjects = subjectBreakdown
      .filter(item => item.correct)
      .slice(0, 6)
      .map(item => item.subject);
    const improvementSubjects = subjectBreakdown
      .filter(item => !item.correct)
      .slice(0, 6)
      .map(item => item.subject);

    return {
      email: this.studentEmail || null,
      level,
      levelLabel:
        level === 'avance' ? 'Avance' : level === 'intermediaire' ? 'Intermediaire' : 'Debutant',
      score,
      totalQuestions,
      percentage,
      summary:
        level === 'avance'
          ? `Excellent niveau de depart. Vous avez montre une tres bonne maitrise de ${strongestSubjects.slice(0, 3).join(', ')}.`
          : level === 'intermediaire'
            ? `Votre base est solide. EduVia vous proposera maintenant un parcours intermediaire personnalise.`
            : `Vous commencez avec un profil debutant. EduVia va renforcer vos bases progressivement.`,
      recommendation:
        level === 'avance'
          ? 'Passez directement aux parcours avances et aux projets plus ambitieux.'
          : level === 'intermediaire'
            ? 'Travaillez quelques matieres a renforcer puis avancez vers des quiz progressifs.'
            : 'Commencez par les cours fondamentaux, puis revenez sur les quiz de niveau.',
      strongestSubjects,
      improvementSubjects,
      subjectBreakdown,
      completedAt: new Date().toISOString(),
    };
  }
}
