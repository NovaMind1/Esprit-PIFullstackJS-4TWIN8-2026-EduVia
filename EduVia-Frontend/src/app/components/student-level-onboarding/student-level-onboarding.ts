import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import {
  Component,
  EventEmitter,
  HostListener,
  Input,
  OnChanges,
  OnDestroy,
  Output,
  SimpleChanges,
} from '@angular/core';
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
export class StudentLevelOnboarding implements OnChanges, OnDestroy {
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
  accessibilityMode = false;
  accessibilityMessage = '';
  keyPressCount = 0;
  autoAdvanceCountdown = 0;

  private keyboardSelectionTimer: ReturnType<typeof setTimeout> | null = null;
  private answerAdvanceTimer: ReturnType<typeof setTimeout> | null = null;
  private answerAdvanceInterval: ReturnType<typeof setInterval> | null = null;
  private readonly keyboardValidationDelay = 8000;

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

  get speechSupported() {
    return typeof window !== 'undefined' && 'speechSynthesis' in window;
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

  ngOnDestroy(): void {
    this.clearAccessibilitySelection();
    this.stopSpeech();
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
    this.clearAccessibilitySelection();
    this.readCurrentQuestionIfNeeded();
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
            this.readCurrentQuestionIfNeeded();
          }
          this.loadingQuestions = false;
        },
        error: () => {
          this.loadingQuestions = false;
        },
      });
  }

  selectOption(optionId: string, scheduleAutoAdvance = true) {
    const question = this.currentQuestion;
    if (!question) {
      return;
    }

    this.selectedAnswers = {
      ...this.selectedAnswers,
      [question.id]: optionId,
    };
    this.errorMessage = '';
    this.keyPressCount = 0;
    this.accessibilityMessage = '';

    if (this.accessibilityMode && scheduleAutoAdvance) {
      const selectedOption = question.options.find(option => option.id === optionId);
      this.scheduleAnswerAdvance(
        `Reponse selectionnee: ${selectedOption?.label || 'option choisie'}. Passage automatique a la question suivante dans 8 secondes.`,
      );
    }
  }

  goToPreviousQuestion() {
    if (this.accessibilityMode) {
      return;
    }

    if (this.currentQuestionIndex > 0) {
      this.currentQuestionIndex -= 1;
      this.errorMessage = '';
      this.clearAccessibilitySelection();
      this.readCurrentQuestionIfNeeded();
    }
  }

  goToNextQuestion() {
    if (this.accessibilityMode) {
      return;
    }

    if (!this.currentAnswer) {
      this.errorMessage = 'Choisis une reponse pour continuer.';
      return;
    }

    if (this.currentQuestionIndex < this.questions.length - 1) {
      this.currentQuestionIndex += 1;
      this.errorMessage = '';
      this.clearAccessibilitySelection();
      this.readCurrentQuestionIfNeeded();
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
      this.clearAccessibilitySelection();
      this.stopSpeech();
      this.continueToDashboard.emit();
    }
  }

  continueAfterResult() {
    if (!this.activeResult) {
      return;
    }

    this.clearAccessibilitySelection();
    this.stopSpeech();
    this.continueToDashboard.emit();
  }

  retakeAssessment() {
    this.activeResult = null;
    this.clearAccessibilitySelection();
    this.stopSpeech();
    this.startAssessment();
  }

  backToWelcome() {
    this.mode = 'welcome';
    this.errorMessage = '';
    this.currentQuestionIndex = 0;
    this.selectedAnswers = {};
    this.clearAccessibilitySelection();
    this.stopSpeech();
  }

  toggleAccessibilityMode() {
    this.accessibilityMode = !this.accessibilityMode;
    this.clearAccessibilitySelection();

    if (!this.accessibilityMode) {
      this.accessibilityMessage = '';
      this.stopSpeech();
      return;
    }

    if (!this.speechSupported) {
      this.accessibilityMessage =
        "Le lecteur vocal n'est pas disponible sur ce navigateur. Le mode clavier reste actif.";
      return;
    }

    this.accessibilityMessage =
      'Mode accessibilite actif. Le lecteur vocal lit la question et les reponses.';
    this.readCurrentQuestionIfNeeded();
  }

  replayCurrentQuestion() {
    this.readCurrentQuestionIfNeeded(true);
  }

  stopReader() {
    this.stopSpeech();
    this.accessibilityMessage = 'Lecture vocale arretee. Vous pouvez relancer la lecture quand vous voulez.';
  }

  @HostListener('window:keydown', ['$event'])
  handleKeyboardAnswer(event: KeyboardEvent) {
    if (!this.accessibilityMode || this.mode !== 'quiz' || this.loadingQuestions || !this.currentQuestion) {
      return;
    }

    if (event.repeat || this.isIgnoredKey(event)) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();

    this.keyPressCount += 1;

    if (this.keyPressCount > this.currentQuestion.options.length) {
      this.accessibilityMessage =
        `Le nombre de pressions depasse ${this.currentQuestion.options.length}. Recommencez la selection pour cette question.`;
      this.keyPressCount = 0;
      this.resetKeyboardSelectionTimer();
      this.readCurrentQuestionIfNeeded();
      return;
    }

    this.accessibilityMessage =
      `${this.keyPressCount} pression(s) detectee(s). EduVia selectionnera la reponse ${this.keyPressCount} dans 8 secondes si vous n'appuyez plus.`;
    this.announceKeySelection();
    this.resetKeyboardSelectionTimer();
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

  private completeKeyboardSelection() {
    const question = this.currentQuestion;
    if (!question || this.keyPressCount < 1) {
      return;
    }

    const option = question.options[this.keyPressCount - 1];
    if (!option) {
      this.accessibilityMessage =
        'Selection invalide. Relancez la lecture puis recommencez la selection au clavier.';
      this.keyPressCount = 0;
      return;
    }

    this.selectOption(option.id, false);
    this.accessibilityMessage =
      `Reponse ${this.keyPressCount} selectionnee. Passage automatique ${
        this.currentQuestionIndex === this.questions.length - 1
          ? 'vers le resultat'
          : 'a la question suivante'
      }.`;

    const selectionCount = this.keyPressCount;
    this.keyPressCount = 0;
    this.stopSpeech();

    const transitionSpeech = `Reponse ${selectionCount} enregistree. ${
      this.currentQuestionIndex === this.questions.length - 1
        ? 'Analyse du niveau en cours.'
        : 'Question suivante.'
    }`;
    this.speakText(transitionSpeech);

    if (this.currentQuestionIndex === this.questions.length - 1) {
      this.submitAssessment();
      return;
    }

    this.currentQuestionIndex += 1;
    this.readCurrentQuestionIfNeeded();
  }

  private readCurrentQuestionIfNeeded(force = false) {
    if (this.mode !== 'quiz' || !this.currentQuestion || !this.accessibilityMode) {
      return;
    }

    if (!force && !this.speechSupported) {
      return;
    }

    const narration = this.buildQuestionNarration(this.currentQuestion);
    this.speakText(narration);
  }

  private buildQuestionNarration(question: LevelAssessmentQuestion) {
    const options = question.options
      .map((option, index) => `Reponse ${index + 1}. ${option.label}.`)
      .join(' ');

    return [
      `Question ${this.currentQuestionIndex + 1} sur ${this.questions.length}.`,
      `Matiere ${question.subject}.`,
      question.prompt,
      question.hint,
      options,
      "Pour choisir une reponse, appuyez sur n'importe quelle touche du clavier autant de fois que le numero correspondant a votre choix.",
      'Apres 8 secondes sans nouvelle pression, EduVia validera ce choix et passera automatiquement a la suite.',
    ].join(' ');
  }

  private announceKeySelection() {
    if (!this.accessibilityMode) {
      return;
    }

    this.speakText(
      `${this.keyPressCount} pression${this.keyPressCount > 1 ? 's' : ''} detectee${
        this.keyPressCount > 1 ? 's' : ''
      }. EduVia attend 8 secondes pour valider la reponse ${this.keyPressCount}.`,
    );
  }

  private resetKeyboardSelectionTimer() {
    if (this.keyboardSelectionTimer) {
      clearTimeout(this.keyboardSelectionTimer);
    }

    this.keyboardSelectionTimer = setTimeout(() => {
      this.completeKeyboardSelection();
    }, this.keyboardValidationDelay);
  }

  private clearAccessibilitySelection() {
    if (this.keyboardSelectionTimer) {
      clearTimeout(this.keyboardSelectionTimer);
      this.keyboardSelectionTimer = null;
    }

    if (this.answerAdvanceTimer) {
      clearTimeout(this.answerAdvanceTimer);
      this.answerAdvanceTimer = null;
    }

    if (this.answerAdvanceInterval) {
      clearInterval(this.answerAdvanceInterval);
      this.answerAdvanceInterval = null;
    }

    this.keyPressCount = 0;
    this.autoAdvanceCountdown = 0;
  }

  private scheduleAnswerAdvance(message: string) {
    if (!this.accessibilityMode || !this.currentQuestion) {
      return;
    }

    this.clearAnswerAdvanceOnly();
    if (this.answerAdvanceTimer) {
      clearTimeout(this.answerAdvanceTimer);
    }

    this.accessibilityMessage = message;
    this.autoAdvanceCountdown = 8;
    this.answerAdvanceInterval = setInterval(() => {
      if (this.autoAdvanceCountdown > 0) {
        this.autoAdvanceCountdown -= 1;
      }
    }, 1000);
    this.answerAdvanceTimer = setTimeout(() => {
      this.moveToNextQuestionAfterAccessibilitySelection();
    }, this.keyboardValidationDelay);
  }

  private moveToNextQuestionAfterAccessibilitySelection() {
    if (!this.accessibilityMode || !this.currentQuestion || !this.currentAnswer) {
      return;
    }

    this.clearAnswerAdvanceOnly();
    this.answerAdvanceTimer = null;
    this.stopSpeech();

    if (this.currentQuestionIndex === this.questions.length - 1) {
      this.accessibilityMessage = 'Derniere reponse enregistree. Analyse du niveau en cours.';
      this.submitAssessment();
      return;
    }

    this.accessibilityMessage = 'Reponse validee. Question suivante.';
    this.currentQuestionIndex += 1;
    this.readCurrentQuestionIfNeeded();
  }

  private clearAnswerAdvanceOnly() {
    if (this.answerAdvanceTimer) {
      clearTimeout(this.answerAdvanceTimer);
      this.answerAdvanceTimer = null;
    }

    if (this.answerAdvanceInterval) {
      clearInterval(this.answerAdvanceInterval);
      this.answerAdvanceInterval = null;
    }

    this.autoAdvanceCountdown = 0;
  }

  private speakText(text: string) {
    if (!this.speechSupported) {
      return;
    }

    this.stopSpeech();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'fr-FR';
    utterance.rate = 0.95;
    utterance.pitch = 1;
    window.speechSynthesis.speak(utterance);
  }

  private stopSpeech() {
    if (this.speechSupported) {
      window.speechSynthesis.cancel();
    }
  }

  private isIgnoredKey(event: KeyboardEvent) {
    return ['Shift', 'Control', 'Alt', 'Meta', 'CapsLock', 'Tab'].includes(event.key);
  }
}
