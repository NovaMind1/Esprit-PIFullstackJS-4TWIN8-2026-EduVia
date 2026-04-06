import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { ContentService } from '../content/content.service';
import { SubmitLevelAssessmentDto } from './dto/submit-level-assessment.dto';

type StudentLevel = 'debutant' | 'intermediaire' | 'avance';
type LevelAssessmentOption = {
  id: string;
  label: string;
};

type LevelAssessmentQuestion = {
  id: string;
  subject: string;
  prompt: string;
  hint: string;
  options: LevelAssessmentOption[];
  correctOptionId: string;
  explanation: string;
};

type LevelAssessmentResult = {
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

type StudentContent = {
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
  dueDate?: Date;
  quizMode?: string;
  quizDifficulty?: string;
  quizAttempts?: number;
  quizPassingScore?: number;
  quizQuestionCount?: number;
  quizQuestions?: unknown[];
  isActive?: boolean;
};

const LEVEL_ASSESSMENT_QUESTIONS: LevelAssessmentQuestion[] = [
  {
    id: 'algo',
    subject: 'Algorithmique',
    prompt: "Quel principe permet de decomposer un probleme en sous-problemes plus petits de meme nature ?",
    hint: 'Cette idee est fondamentale pour beaucoup dalgorithmes efficaces.',
    options: [
      { id: 'algo-a', label: 'Diviser pour regner' },
      { id: 'algo-b', label: 'Boucle infinie' },
      { id: 'algo-c', label: 'Programmation lineaire' },
      { id: 'algo-d', label: 'Compilation separee' },
    ],
    correctOptionId: 'algo-a',
    explanation: "Diviser pour regner consiste a casser un probleme en sous-parties resolubles avant de combiner les resultats.",
  },
  {
    id: 'reseau',
    subject: 'Reseaux',
    prompt: "Quel protocole est principalement utilise pour transporter des pages web securisees ?",
    hint: "Il sagit de la version securisee du protocole web classique.",
    options: [
      { id: 'reseau-a', label: 'FTP' },
      { id: 'reseau-b', label: 'HTTPS' },
      { id: 'reseau-c', label: 'SMTP' },
      { id: 'reseau-d', label: 'ARP' },
    ],
    correctOptionId: 'reseau-b',
    explanation: 'HTTPS ajoute une couche TLS/SSL a HTTP afin de securiser les echanges web.',
  },
  {
    id: 'complexite',
    subject: 'Complexite',
    prompt: 'Quelle est la complexite temporelle dune recherche dichotomique dans un tableau trie ?',
    hint: 'La taille du probleme est divisee par deux a chaque etape.',
    options: [
      { id: 'complexite-a', label: 'O(n)' },
      { id: 'complexite-b', label: 'O(log n)' },
      { id: 'complexite-c', label: 'O(n log n)' },
      { id: 'complexite-d', label: 'O(1)' },
    ],
    correctOptionId: 'complexite-b',
    explanation: 'La recherche dichotomique elimine la moitie des elements a chaque iteration, ce qui donne O(log n).',
  },
  {
    id: 'angular',
    subject: 'Angular',
    prompt: 'Dans Angular, quel decorateur declare un composant ?',
    hint: 'Il est place au-dessus de la classe pour definir son template et ses metadonnees.',
    options: [
      { id: 'angular-a', label: '@Injectable' },
      { id: 'angular-b', label: '@NgModule' },
      { id: 'angular-c', label: '@Component' },
      { id: 'angular-d', label: '@DirectiveModule' },
    ],
    correctOptionId: 'angular-c',
    explanation: '@Component est le decorateur utilise pour declarer un composant Angular.',
  },
  {
    id: 'react',
    subject: 'React',
    prompt: 'Quel hook React permet de memoriser un etat local dans un composant fonctionnel ?',
    hint: 'Cest souvent le premier hook appris dans React.',
    options: [
      { id: 'react-a', label: 'useMemo' },
      { id: 'react-b', label: 'useRef' },
      { id: 'react-c', label: 'useState' },
      { id: 'react-d', label: 'useContext' },
    ],
    correctOptionId: 'react-c',
    explanation: 'useState permet de stocker et mettre a jour un etat local dans un composant fonctionnel.',
  },
  {
    id: 'gestion-projet',
    subject: 'Gestion de projet',
    prompt: 'Quel outil sert a decouper un projet en lots de travail organisables ?',
    hint: 'Il est souvent utilise au debut pour planifier le projet.',
    options: [
      { id: 'gp-a', label: 'WBS' },
      { id: 'gp-b', label: 'DNS' },
      { id: 'gp-c', label: 'CPU scheduler' },
      { id: 'gp-d', label: 'ORM' },
    ],
    correctOptionId: 'gp-a',
    explanation: 'Le WBS (Work Breakdown Structure) decomponse un projet en lots de travail gerables.',
  },
  {
    id: 'c',
    subject: 'Langage C',
    prompt: 'Quel mot-cle reserve permet de definir une constante en C ?',
    hint: 'Il empeche la modification de la variable apres son initialisation.',
    options: [
      { id: 'c-a', label: 'static' },
      { id: 'c-b', label: 'volatile' },
      { id: 'c-c', label: 'const' },
      { id: 'c-d', label: 'final' },
    ],
    correctOptionId: 'c-c',
    explanation: 'Le mot-cle const permet de declarer une valeur qui ne doit plus etre modifiee.',
  },
  {
    id: 'java',
    subject: 'Java',
    prompt: 'Quel concept permet a une classe de reutiliser les attributs et methodes dune autre classe en Java ?',
    hint: 'Il sagit dun pilier de la programmation orientee objet.',
    options: [
      { id: 'java-a', label: 'Surcharge' },
      { id: 'java-b', label: 'Heritage' },
      { id: 'java-c', label: 'Compilation' },
      { id: 'java-d', label: 'Encodage' },
    ],
    correctOptionId: 'java-b',
    explanation: "Lheritage permet a une classe d'etendre une autre classe et de reutiliser son comportement.",
  },
  {
    id: 'cpp',
    subject: 'C++',
    prompt: 'Quelle fonctionnalite du C++ permet de definir plusieurs fonctions avec le meme nom mais des parametres differents ?',
    hint: 'Cest une facon davoir plusieurs signatures pour une meme intention.',
    options: [
      { id: 'cpp-a', label: 'Template metaprogramming' },
      { id: 'cpp-b', label: 'Surcharge de fonctions' },
      { id: 'cpp-c', label: 'Pointeurs intelligents' },
      { id: 'cpp-d', label: 'Compilation separee' },
    ],
    correctOptionId: 'cpp-b',
    explanation: 'La surcharge de fonctions autorise plusieurs fonctions de meme nom avec des signatures differentes.',
  },
  {
    id: 'python',
    subject: 'Python',
    prompt: 'Quel type de donnees Python est mutable et ordonne ?',
    hint: 'On lutilise tres souvent pour stocker une suite delements.',
    options: [
      { id: 'python-a', label: 'tuple' },
      { id: 'python-b', label: 'set' },
      { id: 'python-c', label: 'list' },
      { id: 'python-d', label: 'str' },
    ],
    correctOptionId: 'python-c',
    explanation: 'Une list Python est ordonnee et mutable.',
  },
  {
    id: 'graph',
    subject: 'Graphes',
    prompt: 'Dans un graphe oriente, comment appelle-t-on un lien entre deux sommets ?',
    hint: 'Le terme change legerement par rapport au graphe non oriente.',
    options: [
      { id: 'graph-a', label: 'Une matrice' },
      { id: 'graph-b', label: 'Un arc' },
      { id: 'graph-c', label: 'Un arbre' },
      { id: 'graph-d', label: 'Un chemin critique' },
    ],
    correctOptionId: 'graph-b',
    explanation: 'Dans un graphe oriente, un lien dirige entre deux sommets est appele un arc.',
  },
  {
    id: 'pl',
    subject: 'Programmation lineaire',
    prompt: 'Quel element cherche-t-on en general a maximiser ou minimiser en programmation lineaire ?',
    hint: 'Il represente lobjectif mathematique du probleme.',
    options: [
      { id: 'pl-a', label: 'La fonction objectif' },
      { id: 'pl-b', label: 'Le compilateur' },
      { id: 'pl-c', label: 'La pile memoire' },
      { id: 'pl-d', label: 'Le graphe de dependances' },
    ],
    correctOptionId: 'pl-a',
    explanation: 'La fonction objectif est ce quon souhaite maximiser ou minimiser sous contraintes.',
  },
  {
    id: 'bdd',
    subject: 'Bases de donnees',
    prompt: 'Quelle commande SQL permet de recuperer des donnees dans une table ?',
    hint: 'Cest la commande la plus utilisee en consultation.',
    options: [
      { id: 'bdd-a', label: 'INSERT' },
      { id: 'bdd-b', label: 'DELETE' },
      { id: 'bdd-c', label: 'SELECT' },
      { id: 'bdd-d', label: 'MERGE' },
    ],
    correctOptionId: 'bdd-c',
    explanation: 'SELECT sert a lire et recuperer des donnees depuis une table ou une vue SQL.',
  },
  {
    id: 'electronique',
    subject: 'Electronique',
    prompt: 'Quelle grandeur s’exprime en volts ?',
    hint: 'On la mesure souvent entre deux bornes dun composant.',
    options: [
      { id: 'elec-a', label: 'Lintensite' },
      { id: 'elec-b', label: 'La tension' },
      { id: 'elec-c', label: 'La puissance reactive' },
      { id: 'elec-d', label: 'La frequence' },
    ],
    correctOptionId: 'elec-b',
    explanation: 'La tension electrique se mesure en volts.',
  },
  {
    id: 'proba',
    subject: 'Probabilite',
    prompt: 'Quelle est la probabilite dun evenement certain ?',
    hint: 'La reponse correspond a la valeur maximale en probabilite classique.',
    options: [
      { id: 'proba-a', label: '0' },
      { id: 'proba-b', label: '0,5' },
      { id: 'proba-c', label: '1' },
      { id: 'proba-d', label: '10' },
    ],
    correctOptionId: 'proba-c',
    explanation: 'Un evenement certain a toujours une probabilite egale a 1.',
  },
  {
    id: 'analyse-num',
    subject: 'Analyse numerique',
    prompt: 'A quoi sert principalement la methode de Newton ?',
    hint: 'Elle repose sur des tangentes successives.',
    options: [
      { id: 'an-a', label: 'Trier un tableau' },
      { id: 'an-b', label: 'Resoudre numeriquement f(x)=0' },
      { id: 'an-c', label: 'Calculer une integrale symbolique exacte' },
      { id: 'an-d', label: 'Trouver la matrice inverse sans erreur' },
    ],
    correctOptionId: 'an-b',
    explanation: 'La methode de Newton sert a approcher numeriquement les racines dune equation.',
  },
  {
    id: 'microservices',
    subject: 'Microservices',
    prompt: 'Quel avantage est typiquement associe a une architecture microservices ?',
    hint: 'On parle souvent dindependance entre plusieurs briques.',
    options: [
      { id: 'ms-a', label: 'Tout mettre dans une seule application monolithique' },
      { id: 'ms-b', label: 'Deployer chaque service independamment' },
      { id: 'ms-c', label: 'Supprimer toute communication reseau' },
      { id: 'ms-d', label: 'Eviter les API' },
    ],
    correctOptionId: 'ms-b',
    explanation: 'Les microservices permettent de deployer et faire evoluer les services plus independamment.',
  },
  {
    id: 'spring-boot',
    subject: 'Spring Boot',
    prompt: 'Quel est le principal interet de Spring Boot ?',
    hint: 'Il simplifie la mise en place des applications Spring.',
    options: [
      { id: 'sb-a', label: 'Ecrire uniquement du frontend' },
      { id: 'sb-b', label: 'Configurer rapidement une application Java backend prete a demarrer' },
      { id: 'sb-c', label: 'Compiler du C++' },
      { id: 'sb-d', label: 'Remplacer une base de donnees' },
    ],
    correctOptionId: 'sb-b',
    explanation: "Spring Boot simplifie la configuration et le demarrage d'une application backend Java basee sur Spring.",
  },
];

@Injectable()
export class StudentService {
  constructor(
    private readonly contentService: ContentService,
    private readonly configService: ConfigService,
  ) {}

  async getDashboard(level?: string) {
    const studentLevel = this.normalizeLevel(level);
    const contents = (await this.contentService.findAll()).map(item =>
      this.toPlainContent(item),
    );
    const visibleContents = contents.filter(item => this.isVisibleToStudent(item, studentLevel));
    const quizzes = visibleContents.filter(item => this.isQuiz(item));
    const documents = visibleContents.filter(item => this.isDocument(item));
    const videos = visibleContents.filter(item => this.isVideo(item));
    const courses = this.buildCourseTree(visibleContents);

    return {
      level: studentLevel,
      stats: {
        totalCourses: courses.length,
        totalDocuments: documents.length,
        totalVideos: videos.length,
        totalQuizzes: quizzes.length,
        totalItems: visibleContents.length,
      },
      courses,
      recommendations: visibleContents
        .filter(item => this.isDocument(item) || this.isVideo(item) || this.isQuiz(item))
        .slice(0, 8),
      quizzes,
      contents: visibleContents,
    };
  }

  async getQuizzes(level?: string) {
    const studentLevel = this.normalizeLevel(level);
    const contents = (await this.contentService.findAll()).map(item =>
      this.toPlainContent(item),
    );

    return contents.filter(
      item =>
        this.isQuiz(item) &&
        this.isVisibleToStudent(item, studentLevel) &&
        Array.isArray(item.quizQuestions) &&
        item.quizQuestions.length > 0,
    );
  }

  getLevelAssessmentQuestions() {
    return {
      totalQuestions: LEVEL_ASSESSMENT_QUESTIONS.length,
      subjects: LEVEL_ASSESSMENT_QUESTIONS.map(question => question.subject),
      questions: LEVEL_ASSESSMENT_QUESTIONS.map(question => ({
        id: question.id,
        subject: question.subject,
        prompt: question.prompt,
        hint: question.hint,
        options: question.options,
      })),
    };
  }

  submitLevelAssessment(body: SubmitLevelAssessmentDto): LevelAssessmentResult {
    const answers = Array.isArray(body?.answers) ? body.answers : [];

    if (answers.length !== LEVEL_ASSESSMENT_QUESTIONS.length) {
      throw new HttpException(
        'Toutes les questions du test de niveau doivent etre completees.',
        HttpStatus.BAD_REQUEST,
      );
    }

    const answersByQuestion = new Map(
      answers.map(answer => [answer.questionId, answer.selectedOptionId]),
    );

    const subjectBreakdown = LEVEL_ASSESSMENT_QUESTIONS.map(question => {
      const selectedOptionId = answersByQuestion.get(question.id) || null;
      const selectedOption = question.options.find(
        option => option.id === selectedOptionId,
      );
      const correctOption = question.options.find(
        option => option.id === question.correctOptionId,
      )!;
      const correct = selectedOptionId === question.correctOptionId;

      return {
        subject: question.subject,
        correct,
        selectedOptionId,
        selectedLabel: selectedOption?.label || 'Sans reponse',
        correctLabel: correctOption.label,
        explanation: question.explanation,
      };
    });

    const score = subjectBreakdown.filter(item => item.correct).length;
    const totalQuestions = LEVEL_ASSESSMENT_QUESTIONS.length;
    const percentage = Math.round((score / totalQuestions) * 100);

    const level = this.resolveAssessmentLevel(score, totalQuestions);
    const strongestSubjects = subjectBreakdown
      .filter(item => item.correct)
      .slice(0, 6)
      .map(item => item.subject);
    const improvementSubjects = subjectBreakdown
      .filter(item => !item.correct)
      .slice(0, 6)
      .map(item => item.subject);

    return {
      email: body?.email?.trim() || null,
      level,
      levelLabel: this.levelLabel(level),
      score,
      totalQuestions,
      percentage,
      summary: this.buildAssessmentSummary(level, strongestSubjects, improvementSubjects),
      recommendation: this.buildAssessmentRecommendation(
        level,
        strongestSubjects,
        improvementSubjects,
      ),
      strongestSubjects,
      improvementSubjects,
      subjectBreakdown,
      completedAt: new Date().toISOString(),
    };
  }

  async askAssistant(body: {
    question: string;
    level?: string;
    courseId?: string;
    chapterId?: string;
    history?: { role?: string; text?: string }[];
  }) {
    const question = (body.question || '').trim();
    if (!question) {
      throw new HttpException('La question est obligatoire.', HttpStatus.BAD_REQUEST);
    }

    const apiKey =
      this.configService.get<string>('OPENAI_API_KEY') ||
      this.configService.get<string>('OPENAI_KEY');

    const studentLevel = this.normalizeLevel(body.level);
    const contents = (await this.contentService.findAll()).map(item => this.toPlainContent(item));
    const visibleContents = contents.filter(item => this.isVisibleToStudent(item, studentLevel));
    const relevantContents = visibleContents
      .filter(item => !body.courseId || item.courseId === body.courseId)
      .filter(item => !body.chapterId || item.chapterId === body.chapterId)
      .slice(0, 20);
    const localAnswer = this.buildLocalAssistantAnswer(
      question,
      visibleContents,
      studentLevel,
      relevantContents,
    );

    const context = relevantContents
      .map(item => {
        const parts = [
          `type=${item.type}`,
          item.courseId ? `cours=${item.courseId}` : '',
          item.chapterId ? `chapitre=${item.chapterId}` : '',
          item.title ? `titre=${item.title}` : '',
          item.description ? `description=${item.description}` : '',
        ].filter(Boolean);

        return `- ${parts.join(' | ')}`;
      })
      .join('\n');

    const model = this.configService.get<string>('OPENAI_MODEL') || 'gpt-4.1-mini';
    const systemPrompt = [
      "Tu es un assistant pedagogique d'EduVia.",
      'Tu reponds toujours en francais simple, clair et utile.',
      "Tu peux aider sur toute matiere: informatique, mathematiques, reseaux, bases de donnees, algorithmique, exercices, definitions et methodologie.",
      "Quand l'etudiant pose une question, donne d'abord une reponse directe, puis une breve explication, puis un petit exemple si c'est pertinent.",
      "Si la question est un exercice, guide l'etudiant sans donner une reponse inutilement vague.",
      `Niveau de l'etudiant: ${studentLevel}.`,
      context ? `Contexte visible dans la plateforme:\n${context}` : '',
      Array.isArray(body.history) && body.history.length > 0
        ? `Historique recent:\n${body.history
            .slice(-6)
            .map(item => `- ${item.role || 'user'}: ${item.text || ''}`)
            .join('\n')}`
        : '',
    ]
      .filter(Boolean)
      .join('\n\n');

    if (!apiKey || this.shouldPreferFastLocalAnswer(question, visibleContents)) {
      return {
        answer: localAnswer,
      };
    }

    try {
      const response = await axios.post(
        'https://api.openai.com/v1/responses',
        {
          model,
          input: [
            {
              role: 'system',
              content: [{ type: 'input_text', text: systemPrompt }],
            },
            {
              role: 'user',
              content: [{ type: 'input_text', text: question }],
            },
          ],
        },
        {
          headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          timeout: 6500,
        },
      );

      const answer =
        response.data?.output_text ||
        response.data?.output?.[0]?.content?.find((item: any) => item?.type === 'output_text')
          ?.text ||
        "Je n'ai pas pu generer de reponse pour le moment.";

      return { answer };
    } catch (error: any) {
      return {
        answer: localAnswer,
      };
    }
  }

  private buildLocalAssistantAnswer(
    question: string,
    contents: StudentContent[],
    level: StudentLevel,
    scopedContents: StudentContent[] = contents,
  ) {
    const normalizedQuestion = this.normalizeText(question);
    const snapshot = this.buildAssistantSnapshot(contents, level);
    const scopedChapterNames = Array.from(
      new Set(scopedContents.map(item => item.chapterId).filter((item): item is string => !!item)),
    );
    const matchedCourses = this.findMentionedNames(normalizedQuestion, snapshot.courseNames);
    const matchedQuizzes = this.findMentionedNames(normalizedQuestion, snapshot.quizNames);
    const levelAssessmentSubjects = LEVEL_ASSESSMENT_QUESTIONS.map(item => item.subject);
    const contextualHeader =
      snapshot.courseNames.length > 0
        ? `Je me base sur ${snapshot.courseNames.length} cours visibles dans EduVia: ${snapshot.courseNames.join(', ')}.`
        : `Je vous reponds sur la plateforme EduVia au niveau ${snapshot.levelLabel.toLowerCase()}.`;

    if (
      normalizedQuestion.includes('bonjour') ||
      normalizedQuestion.includes('salut') ||
      normalizedQuestion.includes('bonsoir') ||
      normalizedQuestion.includes("j'ai besoin d'aide") ||
      normalizedQuestion.includes("jai besoin d'aide") ||
      normalizedQuestion === 'aide'
    ) {
      return [
        contextualHeader,
        "Je peux repondre sur toute l'application EduVia: cours, quiz, test de niveau, communaute, clubs, assistant IA, parametres, dashboard enseignant et administration.",
        'Posez-moi une question directe, par exemple: "Quels cours sont publies ?", "Comment fonctionne le test de niveau ?", "Que contient l onglet Communaute ?" ou "Le cours Angular est-il visible ?".',
      ].join(' ');
    }

    if (
      normalizedQuestion.includes('comment fonctionne eduvia') ||
      normalizedQuestion.includes('comment marche eduvia') ||
      normalizedQuestion.includes('comment fonctionne la plateforme') ||
      normalizedQuestion.includes('que peut faire la plateforme') ||
      normalizedQuestion.includes('cest quoi eduvia') ||
      normalizedQuestion.includes("c'est quoi eduvia")
    ) {
      return [
        "EduVia est une plateforme d'apprentissage qui relie l'espace etudiant, l'espace enseignant et la supervision administrateur.",
        `Dans l'espace etudiant, vous trouvez les onglets ${snapshot.tabs.map(tab => tab.label).join(', ')}.`,
        "L'enseignant publie les cours et les quiz. L'etudiant apprend, passe le test de niveau, suit ses cours, discute dans la communaute et utilise l'assistant IA. L'administrateur supervise les utilisateurs et les statistiques globales.",
      ].join(' ');
    }

    if (
      normalizedQuestion.includes('test de niveau') ||
      normalizedQuestion.includes('check your level') ||
      normalizedQuestion.includes('quiz de niveau') ||
      normalizedQuestion.includes('niveau initial')
    ) {
      if (
        normalizedQuestion.includes('matiere') ||
        normalizedQuestion.includes('sujet') ||
        normalizedQuestion.includes('question')
      ) {
        return [
          `Le test de niveau EduVia couvre ${levelAssessmentSubjects.length} matieres: ${levelAssessmentSubjects.join(', ')}.`,
          "Il s'affiche une seule fois pour un nouvel email, puis le niveau deja obtenu est reutilise aux connexions suivantes.",
        ].join(' ');
      }

      return [
        "Le test de niveau apparait a la premiere connexion d'un nouvel etudiant.",
        `Il couvre ${levelAssessmentSubjects.length} matieres et calcule un niveau debutant, intermediaire ou avance selon les reponses.`,
        "Une fois termine, l'etudiant accede a tout son dashboard et ne revoit plus ce test avec le meme email.",
      ].join(' ');
    }

    if (
      normalizedQuestion.includes('quels cours') ||
      normalizedQuestion.includes('liste des cours') ||
      normalizedQuestion.includes('cours publie') ||
      normalizedQuestion.includes('cours disponible') ||
      (normalizedQuestion.includes('combien') && normalizedQuestion.includes('cours'))
    ) {
      if (snapshot.courseNames.length === 0) {
        return "Pour le moment, aucun cours n'est visible dans l'espace etudiant. Des qu'un enseignant publie du contenu relie a un cours, il apparaitra dans l'onglet Parcours.";
      }

      if (normalizedQuestion.includes('combien')) {
        return `Vous avez actuellement ${snapshot.courseNames.length} cours visibles dans EduVia: ${snapshot.courseNames.join(', ')}.`;
      }

      return `Les cours visibles actuellement sont: ${snapshot.courseNames.join(', ')}.`;
    }

    if (
      normalizedQuestion.includes('est publie') ||
      normalizedQuestion.includes('est disponible') ||
      normalizedQuestion.includes('est visible')
    ) {
      if (matchedCourses.length > 0) {
        return `Oui, ${matchedCourses.join(', ')} ${matchedCourses.length > 1 ? 'sont visibles' : 'est visible'} dans l'espace etudiant EduVia.`;
      }

      if (normalizedQuestion.includes('cours')) {
        return snapshot.courseNames.length > 0
          ? `Je ne retrouve pas ce cours exact parmi les cours visibles. Pour le moment, je vois: ${snapshot.courseNames.join(', ')}.`
          : "Je ne vois encore aucun cours visible dans l'espace etudiant pour verifier cette demande.";
      }
    }

    if (
      normalizedQuestion.includes('quiz') &&
      (normalizedQuestion.includes('combien') ||
        normalizedQuestion.includes('quel') ||
        normalizedQuestion.includes('liste') ||
        normalizedQuestion.includes('disponible') ||
        normalizedQuestion.includes('pret'))
    ) {
      if (snapshot.quizNames.length === 0) {
        return "Pour le moment, aucun quiz actif n'est visible dans l'espace etudiant. Les quiz apparaitront des qu'un enseignant publiera un quiz avec des questions actives.";
      }

      if (matchedQuizzes.length > 0) {
        return `Oui, le quiz ${matchedQuizzes.join(', ')} est disponible dans EduVia.`;
      }

      if (normalizedQuestion.includes('combien')) {
        return `Vous avez actuellement ${snapshot.quizNames.length} quiz visibles: ${snapshot.quizNames.join(', ')}.`;
      }

      return `Les quiz visibles actuellement sont: ${snapshot.quizNames.join(', ')}.`;
    }

    if (
      normalizedQuestion.includes('parcours') ||
      normalizedQuestion.includes('mes cours') ||
      normalizedQuestion.includes('onglet parcours')
    ) {
      return [
        "L'onglet Parcours permet de voir les cours disponibles, rechercher un cours, filtrer par niveau et ouvrir le detail d'un cours.",
        "Depuis cette vue, l'etudiant peut lire les ressources, lancer les quiz et continuer son apprentissage.",
      ].join(' ');
    }

    if (normalizedQuestion.includes('evaluation')) {
      return "L'onglet Evaluation est reserve aux bilans intelligents de l'etudiant. Il accueille le test de niveau et les futures analyses pedagogiques.";
    }

    if (normalizedQuestion.includes('communaute') || normalizedQuestion.includes('forum')) {
      return "L'onglet Communaute permet de publier une demande d'aide, consulter les questions des autres et ouvrir un chat prive pour s'entraider entre etudiants.";
    }

    if (normalizedQuestion.includes('club') || normalizedQuestion.includes('clubs')) {
      return "L'onglet Clubs est prevu pour connecter l'etudiant a la vie campus, aux suggestions de clubs et, dans la plateforme complete, aux evenements et activites clubs.";
    }

    if (normalizedQuestion.includes('assistant') || normalizedQuestion.includes('chatbot')) {
      return "L'onglet Assistant IA est votre aide intelligente EduVia. Il peut repondre sur les cours, les quiz, le test de niveau, la navigation dans l'application et les autres espaces de la plateforme.";
    }

    if (normalizedQuestion.includes('parametre') || normalizedQuestion.includes('settings')) {
      return "L'onglet Parametres sert aux reglages personnels, au profil et au systeme de preferences de l'etudiant.";
    }

    if (
      normalizedQuestion.includes('progression') ||
      normalizedQuestion.includes('recommandation') ||
      normalizedQuestion.includes('recommande')
    ) {
      return snapshot.courseNames.length > 0
        ? `EduVia utilise les cours visibles comme ${snapshot.courseNames.slice(0, 3).join(', ')} pour guider la progression, proposer des recommandations et prioriser les prochains quiz.`
        : "EduVia calcule la progression et les recommandations a partir des cours visibles, des quiz et du niveau etudiant. Elles apparaitront des que des contenus seront disponibles.";
    }

    if (
      normalizedQuestion.includes('navigation') ||
      normalizedQuestion.includes('naviguer') ||
      normalizedQuestion.includes('ou aller') ||
      normalizedQuestion.includes('avancer')
    ) {
      return "Dans l'espace etudiant, vous pouvez naviguer dans Parcours, Evaluation, Quiz, Communaute, Clubs, Assistant IA et Parametres. Le plus simple est de commencer par Parcours puis Quiz.";
    }

    if (
      normalizedQuestion.includes('enseignant') &&
      (normalizedQuestion.includes('que peut') ||
        normalizedQuestion.includes('dashboard') ||
        normalizedQuestion.includes('role'))
    ) {
      return "Le dashboard enseignant sert a publier les cours, organiser les ressources, creer les quiz et suivre les performances des etudiants.";
    }

    if (
      normalizedQuestion.includes('admin') &&
      (normalizedQuestion.includes('que peut') ||
        normalizedQuestion.includes('dashboard') ||
        normalizedQuestion.includes('role') ||
        normalizedQuestion.includes('gerer'))
    ) {
      return "Le dashboard administrateur sert a superviser les utilisateurs, suivre les statistiques globales et coordonner les espaces etudiant, enseignant et administration.";
    }

    if (
      normalizedQuestion.includes('connexion') ||
      normalizedQuestion.includes('connecter') ||
      normalizedQuestion.includes('login')
    ) {
      return "Apres connexion, un nouvel etudiant voit d'abord le test de niveau. Une fois le test valide, il accede a tout son dashboard. Lors des connexions suivantes avec le meme email, EduVia ouvre directement le dashboard.";
    }

    if (normalizedQuestion.includes('machine learning') || normalizedQuestion.includes('apprentissage automatique')) {
      return [
        "Le machine learning est une branche de l'intelligence artificielle qui permet a un systeme d'apprendre a partir des donnees sans etre programme regle par regle.",
        "En pratique, on donne des exemples a un modele, puis il apprend des relations utiles pour predire, classer ou recommander.",
        "Exemple simple: detecter si un email est un spam a partir d'emails deja etiquetes.",
      ].join(' ');
    }

    if (normalizedQuestion.includes('jointure') || normalizedQuestion.includes('join')) {
      return [
        "Une jointure en SQL sert a combiner des lignes provenant de plusieurs tables a partir d'une condition de correspondance.",
        "INNER JOIN garde seulement les lignes communes. LEFT JOIN garde toutes les lignes de la table de gauche meme sans correspondance.",
        "Exemple: relier une table Etudiants et une table Inscriptions avec l'identifiant de l'etudiant.",
      ].join(' ');
    }

    if (normalizedQuestion.includes('if else') || normalizedQuestion.includes('if') || normalizedQuestion.includes('else')) {
      return [
        "La structure if ... else permet d'executer une action si une condition est vraie, et une autre si elle est fausse.",
        "Exemple: si note >= 10 alors Afficher(\"Admis\"), sinon Afficher(\"Ajourné\").",
        "Si vous voulez, je peux aussi vous proposer un petit exercice corrige sur if ... else.",
      ].join(' ');
    }

    if (normalizedQuestion.includes('algorithme')) {
      return [
        "Un algorithme est une suite finie et ordonnee d'etapes permettant de resoudre un probleme.",
        "On le decrit avant le code pour clarifier les entrees, les traitements et les sorties.",
        "Exemple: lire deux nombres, calculer leur somme, puis afficher le resultat.",
      ].join(' ');
    }

    if (normalizedQuestion.includes('sql')) {
      return [
        "SQL est le langage utilise pour interroger et manipuler une base de donnees relationnelle.",
        "Les commandes les plus connues sont SELECT, INSERT, UPDATE et DELETE.",
        "Exemple: SELECT nom FROM etudiants WHERE moyenne >= 10;",
      ].join(' ');
    }

    if (normalizedQuestion.includes('angular')) {
      return [
        "Angular est un framework frontend organise autour de composants, services, modules et injection de dependances.",
        "On l'utilise pour construire des interfaces riches cote client.",
        "Si vous voulez, je peux expliquer un composant, un service, un module ou les formulaires Angular pas a pas.",
      ].join(' ');
    }

    if (normalizedQuestion.includes('react')) {
      return [
        "React est une bibliotheque frontend basee sur des composants reutilisables et un rendu declaratif.",
        "Les hooks comme useState et useEffect servent a gerer l'etat et les effets.",
        "Je peux aussi comparer React et Angular ou vous expliquer un hook en detail.",
      ].join(' ');
    }

    if (normalizedQuestion.includes('reseau')) {
      return [
        "En reseaux, on etudie la communication entre machines, les protocoles comme TCP/IP, HTTP, DNS et HTTPS, ainsi que l'adressage et le routage.",
        "Si vous voulez, je peux expliquer un protocole precis ou vous aider sur un exercice reseau.",
      ].join(' ');
    }

    if (normalizedQuestion.includes('exercice')) {
      return [
        `${contextualHeader} Voici une methode simple pour reussir un exercice:`,
        "1. identifier les donnees d'entree et la sortie attendue.",
        "2. decomposer le probleme en petites etapes.",
        "3. ecrire d'abord l'algorithme ou la logique.",
        "4. seulement apres, passer au code ou a la reponse finale.",
        "Si vous me collez l'enonce exact, je peux vous guider pas a pas.",
      ].join(' ');
    }

    if (normalizedQuestion.includes('resume') || normalizedQuestion.includes('resumer') || normalizedQuestion.includes('chapitre')) {
      const chaptersText =
        scopedChapterNames.length > 0 ? `Chapitres visibles: ${scopedChapterNames.join(', ')}.` : '';
      return `${contextualHeader} ${chaptersText} Donnez-moi le nom du chapitre ou copiez un passage, et je vous ferai un resume clair, court et adapte a votre niveau.`;
    }

    return [
      contextualHeader,
      "Je peux repondre sur toute la plateforme EduVia: cours, quiz, test de niveau, communaute, clubs, assistant, parametres, dashboard enseignant et administration.",
      "Je peux aussi expliquer une notion de cours ou vous guider sur un exercice.",
      `Exemple: "Quels cours sont publies ?", "Comment fonctionne le test de niveau ?" ou "donne-moi un exercice sur ${snapshot.courseNames[0] || 'algorithmique'}".`,
    ].join(' ');
  }

  private shouldPreferFastLocalAnswer(question: string, contents: StudentContent[]) {
    const normalizedQuestion = this.normalizeText(question);

    if (
      normalizedQuestion.includes('eduvia') ||
      normalizedQuestion.includes('plateforme') ||
      normalizedQuestion.includes('dashboard') ||
      normalizedQuestion.includes('cours') ||
      normalizedQuestion.includes('quiz') ||
      normalizedQuestion.includes('communaute') ||
      normalizedQuestion.includes('forum') ||
      normalizedQuestion.includes('club') ||
      normalizedQuestion.includes('assistant') ||
      normalizedQuestion.includes('chatbot') ||
      normalizedQuestion.includes('parametre') ||
      normalizedQuestion.includes('admin') ||
      normalizedQuestion.includes('enseignant') ||
      normalizedQuestion.includes('progression') ||
      normalizedQuestion.includes('recommandation') ||
      normalizedQuestion.includes('navigation') ||
      normalizedQuestion.includes('avancer') ||
      normalizedQuestion.includes('niveau') ||
      normalizedQuestion.includes('check your level') ||
      normalizedQuestion.includes('bonjour') ||
      normalizedQuestion.includes('salut')
    ) {
      return true;
    }

    return contents.length === 0;
  }

  private buildAssistantSnapshot(contents: StudentContent[], level: StudentLevel) {
    const courseNames = Array.from(
      new Set(
        contents
          .map(item => item.courseId || (this.isCourse(item) ? item.title : ''))
          .filter((item): item is string => !!item),
      ),
    ).sort((a, b) => a.localeCompare(b));
    const quizNames = Array.from(
      new Set(
        contents
          .filter(item => this.isQuiz(item))
          .map(item => item.title)
          .filter((item): item is string => !!item),
      ),
    ).sort((a, b) => a.localeCompare(b));

    return {
      level,
      levelLabel: this.levelLabel(level),
      courseNames,
      quizNames,
      tabs: [
        { id: 'parcours', label: 'Parcours' },
        { id: 'evaluation', label: 'Evaluation' },
        { id: 'quiz', label: 'Quiz' },
        { id: 'communaute', label: 'Communaute' },
        { id: 'clubs', label: 'Clubs' },
        { id: 'assistant', label: 'Assistant IA' },
        { id: 'parametres', label: 'Parametres' },
      ],
    };
  }

  private findMentionedNames(question: string, names: string[]) {
    return names.filter(name => {
      const normalizedName = this.normalizeText(name);
      return normalizedName.length > 2 && question.includes(normalizedName);
    });
  }

  private normalizeText(value: string) {
    return (value || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');
  }

  private buildCourseTree(contents: StudentContent[]) {
    const courseItems = contents.filter(item => this.isCourse(item));
    const chapterItems = contents.filter(item => this.isChapter(item));
    const partItems = contents.filter(item => this.isPart(item));
    const materialItems = contents.filter(
      item => this.isDocument(item) || this.isVideo(item) || this.isQuiz(item),
    );

    const fallbackCourseIds = new Set(
      contents
        .map(item => item.courseId)
        .filter((item): item is string => !!item),
    );

    const visibleCourseItems =
      courseItems.length > 0
        ? courseItems
        : Array.from(fallbackCourseIds).map(courseId => ({
            _id: courseId,
            type: 'course',
            title: courseId,
            courseId,
          })) as StudentContent[];

    return visibleCourseItems.map(course => {
      const courseKey = String(course._id || course.courseId || course.title);
      const chapters = chapterItems
        .filter(chapter => String(chapter.courseId) === courseKey || chapter.courseId === course.title)
        .map(chapter => {
          const chapterKey = String(chapter._id || chapter.chapterId || chapter.title);
          const parts = partItems
            .filter(part => String(part.chapterId) === chapterKey || part.chapterId === chapter.title)
            .map(part => {
              const partKey = String(part._id || part.partId || part.title);
              const materials = materialItems.filter(
                material =>
                  String(material.partId) === partKey || material.partId === part.title,
              );

              return {
                ...part,
                materials,
              };
            });

          const directMaterials = materialItems.filter(
            material =>
              material.chapterId === chapter.title &&
              (!material.partId || !parts.some(part => part.title === material.partId)),
          );

          return {
            ...chapter,
            parts,
            directMaterials,
          };
        });

      const inferredChapters =
        chapters.length > 0
          ? chapters
          : this.inferChaptersForCourse(course, materialItems, partItems);

      return {
        ...course,
        chapters: inferredChapters,
      };
    });
  }

  private inferChaptersForCourse(
    course: StudentContent,
    materialItems: StudentContent[],
    partItems: StudentContent[],
  ) {
    const chapterNames = Array.from(
      new Set(
        materialItems
          .filter(item => item.courseId === course.title || item.courseId === String(course._id))
          .map(item => item.chapterId)
          .filter((item): item is string => !!item),
      ),
    );

    return chapterNames.map(chapterName => {
      const chapterParts = partItems
        .filter(part => part.chapterId === chapterName)
        .map(part => ({
          ...part,
          materials: materialItems.filter(
            material => material.partId === part.title || material.partId === String(part._id),
          ),
        }));

      return {
        _id: chapterName,
        type: 'chapter',
        title: chapterName,
        courseId: course.title,
        parts: chapterParts,
        directMaterials: materialItems.filter(
          material => material.chapterId === chapterName && !material.partId,
        ),
      };
    });
  }

  private isVisibleToStudent(item: StudentContent, level: StudentLevel) {
    if (item.isActive === false) {
      return false;
    }

    if (!this.isQuiz(item)) {
      return true;
    }

    const quizQuestions = Array.isArray(item.quizQuestions) ? item.quizQuestions : [];
    if (quizQuestions.length === 0) {
      return false;
    }

    const difficulty = this.normalizeLevel(item.quizDifficulty);
    if (!difficulty) {
      return true;
    }

    return difficulty === level;
  }

  private normalizeLevel(level?: string): StudentLevel {
    const normalized = (level || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');

    if (normalized.startsWith('int') || normalized.includes('moyen')) {
      return 'intermediaire';
    }

    if (normalized.startsWith('ava') || normalized.includes('difficile')) {
      return 'avance';
    }

    return 'debutant';
  }

  private resolveAssessmentLevel(score: number, totalQuestions: number): StudentLevel {
    const ratio = totalQuestions > 0 ? score / totalQuestions : 0;

    if (ratio >= 0.72) {
      return 'avance';
    }

    if (ratio >= 0.4) {
      return 'intermediaire';
    }

    return 'debutant';
  }

  private buildAssessmentSummary(
    level: StudentLevel,
    strongestSubjects: string[],
    improvementSubjects: string[],
  ) {
    if (level === 'avance') {
      return `Excellent niveau de depart. Vous maitrisez deja tres bien ${strongestSubjects.slice(0, 3).join(', ')}.`;
    }

    if (level === 'intermediaire') {
      return `Votre base est solide. Vous etes deja a l'aise sur ${strongestSubjects.slice(0, 3).join(', ')} et pouvez progresser vite.`;
    }

    return `Vous demarrez avec un profil debutant. Nous allons renforcer en priorite ${improvementSubjects.slice(0, 3).join(', ')}.`;
  }

  private buildAssessmentRecommendation(
    level: StudentLevel,
    strongestSubjects: string[],
    improvementSubjects: string[],
  ) {
    if (level === 'avance') {
      return `Passez rapidement aux parcours avances et aux projets sur ${strongestSubjects.slice(0, 2).join(' et ')}.`;
    }

    if (level === 'intermediaire') {
      return `Travaillez d'abord ${improvementSubjects.slice(0, 3).join(', ')}, puis enchainez avec des quiz progressifs et des mini-projets.`;
    }

    return `Commencez par les bases, reprenez ${improvementSubjects.slice(0, 3).join(', ')}, puis refaites un test de niveau apres quelques cours.`;
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

  private toPlainContent(item: any): StudentContent {
    return {
      _id: String(item._id),
      type: item.type,
      title: item.title,
      description: item.description,
      courseId: item.courseId,
      chapterId: item.chapterId,
      partId: item.partId,
      fileUrl: item.fileUrl,
      fileName: item.fileName,
      source: item.source,
      dueDate: item.dueDate,
      quizMode: item.quizMode,
      quizDifficulty: item.quizDifficulty,
      quizAttempts: item.quizAttempts,
      quizPassingScore: item.quizPassingScore,
      quizQuestionCount: item.quizQuestionCount,
      quizQuestions: item.quizQuestions,
      isActive: item.isActive,
    };
  }

  private isCourse(item: StudentContent) {
    return (item.type || '').toLowerCase() === 'course';
  }

  private isChapter(item: StudentContent) {
    return (item.type || '').toLowerCase() === 'chapter';
  }

  private isPart(item: StudentContent) {
    return (item.type || '').toLowerCase() === 'part';
  }

  private isDocument(item: StudentContent) {
    return (item.type || '').toLowerCase() === 'document';
  }

  private isVideo(item: StudentContent) {
    return (item.type || '').toLowerCase() === 'video';
  }

  private isQuiz(item: StudentContent) {
    return (item.type || '').toLowerCase() === 'quiz';
  }
}
