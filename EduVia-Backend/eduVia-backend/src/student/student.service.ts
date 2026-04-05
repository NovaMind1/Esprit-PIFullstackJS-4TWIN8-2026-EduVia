import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { ContentService } from '../content/content.service';

type StudentLevel = 'debutant' | 'intermediaire' | 'avance';

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

  async askAssistant(body: {
    question: string;
    level?: string;
    courseId?: string;
    chapterId?: string;
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
    ]
      .filter(Boolean)
      .join('\n\n');

    if (!apiKey) {
      return {
        answer: this.buildLocalAssistantAnswer(question, relevantContents, studentLevel),
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
          timeout: 20000,
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
        answer: this.buildLocalAssistantAnswer(question, relevantContents, studentLevel),
      };
    }
  }

  private buildLocalAssistantAnswer(
    question: string,
    contents: StudentContent[],
    level: StudentLevel,
  ) {
    const normalizedQuestion = this.normalizeText(question);
    const courseNames = Array.from(
      new Set(contents.map(item => item.courseId).filter((item): item is string => !!item)),
    );
    const chapterNames = Array.from(
      new Set(contents.map(item => item.chapterId).filter((item): item is string => !!item)),
    );

    const contextualHeader =
      courseNames.length > 0
        ? `Je me base sur vos cours visibles dans EduVia: ${courseNames.join(', ')}.`
        : `Je vous reponds au niveau ${level}.`;

    if (
      normalizedQuestion.includes('bonjour') ||
      normalizedQuestion.includes('salut') ||
      normalizedQuestion.includes("j'ai besoin d'aide") ||
      normalizedQuestion.includes("jai besoin d'aide") ||
      normalizedQuestion === 'aide'
    ) {
      return `${contextualHeader} Dites-moi simplement la notion ou l'exercice qui vous bloque, par exemple: "c'est quoi une jointure ?", "explique if else", "donne-moi un exercice sur les boucles", ou "resume le chapitre 1".`;
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
        chapterNames.length > 0 ? `Chapitres visibles: ${chapterNames.join(', ')}.` : '';
      return `${contextualHeader} ${chaptersText} Donnez-moi le nom du chapitre ou copiez un passage, et je vous ferai un resume clair, court et adapte a votre niveau.`;
    }

    return [
      contextualHeader,
      "Je peux vous aider sur les definitions, les exercices, les quiz, SQL, algorithmique, machine learning, mathematiques et autres matieres.",
      "Ecrivez votre question de facon un peu plus precise et je vous repondrai clairement.",
      `Exemple: "explique la difference entre INNER JOIN et LEFT JOIN" ou "donne-moi un exercice sur ${courseNames[0] || 'ce cours'}".`,
    ].join(' ');
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
