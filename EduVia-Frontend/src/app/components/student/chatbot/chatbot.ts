import { CommonModule } from '@angular/common';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { Component, Input } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { catchError, of, timeout } from 'rxjs';

type ChatMessage = {
  sender: 'assistant' | 'student';
  text: string;
  time: string;
};

type DashboardSnapshot = {
  courseNames: string[];
  quizNames: string[];
  recommendationTitles: string[];
  totalContents: number;
  totalCourses: number;
  totalQuizzes: number;
  levelLabel: string;
  tabs: string[];
};

@Component({
  selector: 'app-chatbot',
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule],
  templateUrl: './chatbot.html',
  styleUrl: './chatbot.css',
})
export class Chatbot {
  @Input() studentLevel: 'debutant' | 'intermediaire' | 'avance' = 'debutant';

  draftMessage = '';
  pendingResponses = 0;
  messages: ChatMessage[] = [
    {
      sender: 'assistant',
      text: "Bonjour. Je suis votre assistant EduVia. Je peux repondre directement sur toute la plateforme: cours, quiz, test de niveau, communaute, clubs, navigation, dashboard enseignant, administration et fonctionnement general d'EduVia.",
      time: this.currentTime(),
    },
  ];

  quickReplies = [
    'Quels cours sont publies ?',
    'Combien de quiz sont disponibles ?',
    'Comment fonctionne le test de niveau ?',
    "Que contient l'onglet Communaute ?",
    'Comment avancer dans le dashboard etudiant ?',
    'A quoi sert la section Clubs ?',
    'Que peut faire un enseignant ?',
    'Que peut faire un administrateur ?',
    'Comment fonctionne EduVia ?',
  ];

  constructor(private http: HttpClient) {}

  sendMessage() {
    const text = this.draftMessage.trim();
    if (!text) {
      return;
    }

    const studentMessage: ChatMessage = {
      sender: 'student',
      text,
      time: this.currentTime(),
    };

    this.messages = [...this.messages, studentMessage];
    this.draftMessage = '';

    const optimisticAnswer = this.buildInstantPlatformAnswer(text);
    const conversationHistory = this.messages.slice(-8).map(message => ({
      role: message.sender === 'assistant' ? 'assistant' : 'user',
      text: message.text,
    }));
    const assistantMessage: ChatMessage = {
      sender: 'assistant',
      text: optimisticAnswer,
      time: this.currentTime(),
    };

    this.messages = [...this.messages, assistantMessage];
    const assistantIndex = this.messages.length - 1;
    this.pendingResponses += 1;

    this.http
      .post<{ answer: string }>('/api/student/assistant/ask', {
        question: text,
        level: this.studentLevel,
        history: conversationHistory,
      })
      .pipe(
        timeout(5000),
        catchError(() =>
          of({
            answer: optimisticAnswer,
          }),
        ),
      )
      .subscribe({
        next: response => {
          const resolvedAnswer = this.resolveAssistantAnswer(
            response?.answer,
            optimisticAnswer,
          );

          this.messages[assistantIndex] = {
            sender: 'assistant',
            text: resolvedAnswer,
            time: this.currentTime(),
          };
          this.messages = [...this.messages];
        },
        complete: () => {
          this.pendingResponses = Math.max(0, this.pendingResponses - 1);
        },
      });
  }

  useQuickReply(message: string) {
    this.draftMessage = message;
    this.sendMessage();
  }

  private currentTime() {
    return new Date().toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  private resolveAssistantAnswer(
    backendAnswer: string | undefined,
    optimisticAnswer: string,
  ) {
    const normalizedBackend = (backendAnswer || '').trim();
    if (!normalizedBackend) {
      return optimisticAnswer;
    }

    if (
      normalizedBackend.toLowerCase() === optimisticAnswer.toLowerCase() ||
      normalizedBackend.includes('Je traite votre question') ||
      normalizedBackend.includes('Je vous reponds tout de suite')
    ) {
      return optimisticAnswer;
    }

    return normalizedBackend;
  }

  private buildInstantPlatformAnswer(question: string) {
    const normalized = this.normalizeText(question);
    const snapshot = this.readDashboardSnapshot();
    const matchedCourses = this.findMatches(normalized, snapshot.courseNames);
    const matchedQuizzes = this.findMatches(normalized, snapshot.quizNames);

    if (
      normalized.includes('bonjour') ||
      normalized.includes('salut') ||
      normalized.includes('bonsoir') ||
      normalized.includes('aide')
    ) {
      return "Bonjour. Je peux vous aider tout de suite sur les cours, quiz, communaute, clubs, test de niveau, navigation et role des autres dashboards EduVia.";
    }

    if (
      normalized.includes('comment fonctionne') ||
      normalized.includes('c est quoi eduvia') ||
      normalized.includes('c quoi eduvia') ||
      normalized.includes('plateforme')
    ) {
      return "EduVia relie le dashboard etudiant, le dashboard enseignant et la supervision administrateur. L'etudiant apprend, passe des quiz, discute dans la communaute, rejoint des clubs et utilise l'assistant IA.";
    }

    if (
      normalized.includes('quels cours') ||
      normalized.includes('cours publie') ||
      normalized.includes('cours disponible') ||
      (normalized.includes('combien') && normalized.includes('cours'))
    ) {
      if (snapshot.totalCourses === 0) {
        return "Pour le moment, aucun cours n'est visible dans votre espace etudiant. Des qu'un enseignant publiera un contenu, il apparaitra dans Parcours.";
      }

      if (matchedCourses.length > 0) {
        return `Oui, ${matchedCourses.join(', ')} ${matchedCourses.length > 1 ? 'sont visibles' : 'est visible'} dans votre dashboard etudiant.`;
      }

      if (normalized.includes('combien')) {
        return `Vous avez actuellement ${snapshot.totalCourses} cours visibles: ${snapshot.courseNames.join(', ')}.`;
      }

      return `Les cours visibles actuellement sont: ${snapshot.courseNames.join(', ')}.`;
    }

    if (
      normalized.includes('quiz') &&
      (normalized.includes('combien') ||
        normalized.includes('disponible') ||
        normalized.includes('pret') ||
        normalized.includes('publie') ||
        normalized.includes('visible'))
    ) {
      if (snapshot.totalQuizzes === 0) {
        return "Pour le moment, aucun quiz actif n'est visible dans votre dashboard. Les quiz apparaitront des qu'un enseignant publiera un quiz avec des questions actives.";
      }

      if (matchedQuizzes.length > 0) {
        return `Oui, le quiz ${matchedQuizzes.join(', ')} est disponible dans EduVia.`;
      }

      if (normalized.includes('combien')) {
        return `Vous avez actuellement ${snapshot.totalQuizzes} quiz visibles: ${snapshot.quizNames.join(', ')}.`;
      }

      return `Les quiz visibles actuellement sont: ${snapshot.quizNames.join(', ')}.`;
    }

    if (
      normalized.includes('test de niveau') ||
      normalized.includes('check your level') ||
      (normalized.includes('niveau') && !normalized.includes('enseignant'))
    ) {
      return `Le test de niveau s'affiche une seule fois pour chaque nouvel email. Il positionne l'etudiant sur ${snapshot.levelLabel} et ouvre ensuite tout le dashboard.`;
    }

    if (
      normalized.includes('progression') ||
      normalized.includes('parcours') ||
      normalized.includes('mes cours')
    ) {
      return snapshot.totalCourses > 0
        ? `Dans Parcours, vous pouvez rechercher vos cours, filtrer par niveau et ouvrir ${snapshot.courseNames[0]} ou un autre cours pour continuer votre apprentissage.`
        : "L'onglet Parcours sert a voir les cours disponibles, les rechercher et ouvrir leurs contenus des qu'ils sont publies.";
    }

    if (normalized.includes('evaluation')) {
      return "L'onglet Evaluation accueille le test de niveau et les bilans intelligents pour adapter votre apprentissage.";
    }

    if (normalized.includes('communaute') || normalized.includes('forum')) {
      return "L'onglet Communaute sert a publier une demande d'aide, consulter les questions des autres et ouvrir un chat prive entre etudiants.";
    }

    if (normalized.includes('club') || normalized.includes('clubs')) {
      return "L'onglet Clubs sert a connecter l'etudiant aux clubs du campus, aux suggestions d'activites et aux espaces communautaires de la plateforme.";
    }

    if (normalized.includes('assistant') || normalized.includes('chatbot')) {
      return "L'Assistant IA peut repondre sur toute la plateforme EduVia, expliquer une notion, guider dans les onglets et clarifier les cours ou quiz visibles.";
    }

    if (normalized.includes('parametre') || normalized.includes('settings')) {
      return "L'onglet Parametres sert aux preferences personnelles, au profil et aux reglages de votre experience etudiante.";
    }

    if (normalized.includes('enseignant')) {
      return "Le dashboard enseignant sert a publier les cours, organiser les chapitres, ajouter les quiz et suivre la progression des etudiants.";
    }

    if (normalized.includes('admin') || normalized.includes('administrateur')) {
      return "Le dashboard administrateur sert a superviser les utilisateurs, les statistiques et la coordination globale de la plateforme EduVia.";
    }

    if (normalized.includes('recommandation') || normalized.includes('recommande')) {
      if (snapshot.recommendationTitles.length === 0) {
        return "Les recommandations apparaitront ici a partir des contenus visibles et de votre niveau actuel.";
      }

      return `Les recommandations visibles actuellement sont orientees autour de: ${snapshot.recommendationTitles.join(', ')}.`;
    }

    if (
      normalized.includes('navigation') ||
      normalized.includes('naviguer') ||
      normalized.includes('ou aller') ||
      normalized.includes('avancer')
    ) {
      return `Vous pouvez naviguer dans ${snapshot.tabs.join(', ')}. Le plus simple est de commencer par Parcours, puis Quiz, Communaute, Clubs et Assistant IA.`;
    }

    if (
      normalized.includes('angular') ||
      normalized.includes('react') ||
      normalized.includes('sql') ||
      normalized.includes('algorithme') ||
      normalized.includes('reseau') ||
      normalized.includes('machine learning') ||
      normalized.includes('if') ||
      normalized.includes('else')
    ) {
      return "Je peux vous repondre tout de suite sur cette notion. Donnez-moi la notion exacte, un chapitre ou un exercice, et je vous expliquerai pas a pas.";
    }

    return "Je peux repondre sur toute la plateforme EduVia: cours, quiz, test de niveau, communaute, clubs, navigation, enseignant, administration et notions techniques. Posez votre question librement.";
  }

  private readDashboardSnapshot(): DashboardSnapshot {
    const baseSnapshot: DashboardSnapshot = {
      courseNames: [],
      quizNames: [],
      recommendationTitles: [],
      totalContents: 0,
      totalCourses: 0,
      totalQuizzes: 0,
      levelLabel: this.levelLabel(this.studentLevel),
      tabs: [
        'Parcours',
        'Evaluation',
        'Quiz',
        'Communaute',
        'Clubs',
        'Assistant IA',
        'Parametres',
      ],
    };

    try {
      const raw = localStorage.getItem(`eduvia-student-dashboard-${this.studentLevel}`);
      if (!raw) {
        return baseSnapshot;
      }

      const payload = JSON.parse(raw) as {
        contents?: Array<{
          type?: string;
          title?: string;
          courseId?: string;
        }>;
        recommendations?: Array<{
          title?: string;
        }>;
      };
      const contents = Array.isArray(payload.contents) ? payload.contents : [];
      const courseNames = Array.from(
        new Set(
          contents
            .map(item =>
              item?.courseId ||
              (this.normalizeText(item?.type || '') === 'course' ? item?.title : ''),
            )
            .filter(
              (item): item is string =>
                typeof item === 'string' && item.trim().length > 0,
            ),
        ),
      );
      const quizNames = Array.from(
        new Set(
          contents
            .filter(item => this.normalizeText(item?.type || '') === 'quiz')
            .map(item => item?.title)
            .filter(
              (item): item is string =>
                typeof item === 'string' && item.trim().length > 0,
            ),
        ),
      );
      const recommendationTitles = Array.from(
        new Set(
          (Array.isArray(payload.recommendations) ? payload.recommendations : [])
            .map(item => item?.title)
            .filter(
              (item): item is string =>
                typeof item === 'string' && item.trim().length > 0,
            ),
        ),
      ).slice(0, 4);

      return {
        ...baseSnapshot,
        courseNames,
        quizNames,
        recommendationTitles,
        totalContents: contents.length,
        totalCourses: courseNames.length,
        totalQuizzes: quizNames.length,
      };
    } catch {
      return baseSnapshot;
    }
  }

  private normalizeText(value: string) {
    return (value || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');
  }

  private findMatches(question: string, names: string[]) {
    return names.filter(name => {
      const normalizedName = this.normalizeText(name);
      return normalizedName.length > 2 && question.includes(normalizedName);
    });
  }

  private levelLabel(level: 'debutant' | 'intermediaire' | 'avance') {
    switch (level) {
      case 'intermediaire':
        return 'Intermediaire';
      case 'avance':
        return 'Avance';
      default:
        return 'Debutant';
    }
  }
}
