import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { forkJoin, map, of, switchMap } from 'rxjs';

type WizardMode = 'existing' | 'new';
type ContentType = 'Cours' | 'Vidéo' | 'Quiz' | 'Exercice' | 'Document';
type QuizMode = 'existing' | 'generated';
type QuizDifficulty = 'facile' | 'moyen' | 'difficile';

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

type ContentItem = {
  _id?: string;
  type: ContentType;
  courseId: string;
  chapterId: string;
  partId: string;
  title: string;
  description?: string;
  dueDate?: string;
  fileName?: string;
  source?: string;
  fileUrl?: string;
  quizMode?: QuizMode;
  quizDifficulty?: QuizDifficulty;
  quizSourceChapter?: string;
  quizAttempts?: number;
  quizPassingScore?: number;
  quizQuestionCount?: number;
  quizQuestions?: QuizQuestion[];
  completed: boolean;
};

@Component({
  selector: 'app-content-management',
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule],
  templateUrl: './content-management.html',
  styleUrls: ['./content-management.css'],
})
export class ContentManagement implements OnInit {
  showModal = false;
  currentStep = 1;
  creationMode: 'full' | 'quiz_only' | 'linked' = 'full';
  formError = '';
  isSaving = false;
  courseExpanded: Record<string, boolean> = {};
  chapterExpanded: Record<string, boolean> = {};
  partExpanded: Record<string, boolean> = {};
  selectedPreviewItem: ContentItem | null = null;
  openedCourseMenu: string | null = null;
  openedPartMenu: string | null = null;
  openedItemMenu: string | null = null;
  groupedContentsMap: Record<string, Record<string, ContentItem[]>> = {};
  courseKeysList: string[] = [];
  chapterKeysByCourseMap: Record<string, string[]> = {};
  partKeysByChapterMap: Record<string, string[]> = {};
  readonly backendBaseUrl =
    `${window.location.protocol}//${window.location.hostname}:3000`;
  courses: string[] = [];
  chaptersByCourse: Record<string, string[]> = {};
  partsByChapter: Record<string, string[]> = {};

  contentTypes: ContentType[] = ['Document', 'Vidéo', 'Quiz'];

  contentForm = {
    courseMode: 'existing' as WizardMode,
    selectedCourse: '',
    newCourse: '',
    chapterMode: 'existing' as WizardMode,
    selectedChapter: '',
    newChapter: '',
    partMode: 'existing' as WizardMode,
    selectedPart: '',
    newPart: '',
    documentFileName: '',
    documentFile: null as File | null,
    videoFileName: '',
    videoFile: null as File | null,
    videoLink: '',
    quizMode: 'existing' as QuizMode,
    quizTitle: '',
    quizDescription: '',
    quizFileName: '',
    quizFile: null as File | null,
    quizKeywords: '',
    quizChapterFileNames: [] as string[],
    quizChapterFiles: [] as File[],
    quizSourceChapter: '',
    quizDifficulty: 'moyen' as QuizDifficulty,
    quizQuestions: 10,
    quizAttempts: 3,
    quizScore: 70,
    quizDueDate: '',
  };

  contents: ContentItem[] = [];
  editingContent: ContentItem | null = null;
  editingCourseName: string | null = null;
  editingCourseItems: ContentItem[] = [];

  constructor(
    private http: HttpClient,
    private sanitizer: DomSanitizer,
  ) {}

  ngOnInit() {
    this.loadContents();
  }

  loadContents() {
    this.http.get<any[]>('/api/contents').subscribe(
      data => {
        this.scheduleUiUpdate(() => {
          const mappedItems = data
            .map(item => this.mapApiItemToContentItem(item))
            .filter((item): item is ContentItem => item !== null);
          this.contents = this.deduplicateContents(mappedItems);
          this.syncStructureFromContents();
        });
      },
      () => {
        this.scheduleUiUpdate(() => {
          this.formError = "Impossible de charger les contenus depuis l'API.";
        });
      },
    );
  }

  openModal() {
    this.creationMode = 'full';
    this.showModal = true;
    this.currentStep = 1;
    this.formError = '';
    this.editingContent = null;
    this.editingCourseName = null;
    this.editingCourseItems = [];
    this.resetForm();
  }

  openAutoQuizModal() {
    this.creationMode = 'quiz_only';
    this.showModal = true;
    this.currentStep = 5;
    this.formError = '';
    this.editingContent = null;
    this.editingCourseName = null;
    this.editingCourseItems = [];
    this.resetForm();
    this.contentForm.quizMode = 'generated';
  }

  editContent(content: ContentItem) {
    this.editingContent = content;
    this.showModal = true;
    this.currentStep = 1;
    this.formError = '';
    this.contentForm = {
      courseMode: 'existing',
      selectedCourse: content.courseId,
      newCourse: '',
      chapterMode: 'existing',
      selectedChapter: content.chapterId,
      newChapter: '',
      partMode: 'existing',
      selectedPart: content.partId,
      newPart: '',
      documentFileName: content.type === 'Document' ? content.fileName || '' : '',
      documentFile: null,
      videoFileName: content.type === 'Vidéo' ? content.fileName || '' : '',
      videoFile: null,
      videoLink: content.type === 'Vidéo' ? content.source || '' : '',
      quizMode: content.type === 'Quiz' ? content.quizMode || 'existing' : 'existing',
      quizTitle: content.type === 'Quiz' ? content.title : '',
      quizDescription: content.type === 'Quiz' ? content.description || '' : '',
      quizFileName: content.type === 'Quiz' ? content.fileName || '' : '',
      quizFile: null,
      quizKeywords:
        content.type === 'Quiz' && content.quizMode === 'generated'
          ? content.quizSourceChapter || ''
          : '',
      quizChapterFileNames: [],
      quizChapterFiles: [],
      quizSourceChapter:
        content.type === 'Quiz' ? content.quizSourceChapter || content.chapterId : '',
      quizDifficulty:
        content.type === 'Quiz' ? content.quizDifficulty || 'moyen' : 'moyen',
      quizQuestions:
        content.type === 'Quiz'
          ? (content.quizQuestionCount ||
              (content.description?.match(/questions:\s*(\d+)/)?.[1]
              ? Number(content.description.match(/questions:\s*(\d+)/)?.[1])
              : 10))
          : 10,
      quizAttempts: content.type === 'Quiz' ? content.quizAttempts || 3 : 3,
      quizScore: content.type === 'Quiz' ? content.quizPassingScore || 70 : 70,
      quizDueDate: content.type === 'Quiz' ? content.dueDate || '' : '',
    };
  }

  closeModal() {
    this.showModal = false;
    this.currentStep = 1;
    this.creationMode = 'full';
    this.formError = '';
    this.editingCourseName = null;
    this.editingCourseItems = [];
  }

  goNext() {
    this.formError = '';

    if (this.currentStep === 1) {
      const course =
        this.contentForm.courseMode === 'existing'
          ? this.contentForm.selectedCourse
          : this.contentForm.newCourse;
      const chapter =
        this.contentForm.chapterMode === 'existing'
          ? this.contentForm.selectedChapter
          : this.contentForm.newChapter;

      if (!course || !chapter) {
        this.formError = 'SÃ©lectionnez ou crÃ©ez un cours et un chapitre.';
        return;
      }
    }

    if (this.currentStep === 2) {
      const part =
        this.contentForm.partMode === 'existing'
          ? this.contentForm.selectedPart
          : this.contentForm.newPart;

      if (!part) {
        this.formError = 'SÃ©lectionnez ou crÃ©ez une partie.';
        return;
      }
    }

    if (
      this.creationMode === 'full' &&
      this.currentStep === 3 &&
      !this.contentForm.documentFileName
    ) {
      this.formError = 'Ajoutez un document de cours (PDF/DOCX).';
      return;
    }

    if (
      this.creationMode === 'full' &&
      this.currentStep === 4 &&
      !this.hasVideoSource()
    ) {
      this.formError = 'Ajoutez une vidÃ©o ou un lien vidÃ©o (YouTube/Vimeo).';
      return;
    }

    if (this.currentStep === 5) {
      const hasDocument = this.hasDocumentSource();
      const hasVideo = this.hasVideoSource();
      const hasQuizTitle = !!this.contentForm.quizTitle.trim();
      const hasQuizSource =
        this.contentForm.quizMode === 'generated'
          ? this.generatedQuizTopics().length > 0
          : !!this.contentForm.quizFileName;
      const hasQuiz = hasQuizTitle && hasQuizSource;

      if (this.creationMode === 'linked' && !hasDocument && !hasVideo && !hasQuiz) {
        this.formError =
          'Ajoutez au moins un document, une vidéo ou un quiz lié avant de continuer.';
        return;
      }

      if (this.creationMode !== 'linked' && !this.contentForm.quizTitle) {
        this.formError = 'ComplÃ©tez les informations du quiz.';
        return;
      }

      if (
        hasQuizTitle &&
        this.contentForm.quizMode === 'generated' &&
        this.generatedQuizTopics().length === 0
      ) {
        this.formError = 'Ajoutez des mots-clÃ©s ou importez un ou plusieurs chapitres pour gÃ©nÃ©rer le quiz.';
        return;
      }
      if (
        hasQuizTitle &&
        this.contentForm.quizMode === 'existing' &&
        !this.contentForm.quizFileName
      ) {
        this.formError = 'TÃ©lÃ©chargez un quiz PDF ou Word.';
        return;
      }
      this.saveWizard();
      return;
    }

    this.currentStep++;
  }

  goBack() {
    if (this.currentStep > 1) {
      this.formError = '';
      this.currentStep--;
    }
  }

  resetForm() {
    this.contentForm = {
      courseMode: 'existing',
      selectedCourse: this.courses[0] || '',
      newCourse: '',
      chapterMode: 'existing',
      selectedChapter: this.chaptersByCourse[this.courses[0]]?.[0] || '',
      newChapter: '',
      partMode: 'existing',
      selectedPart:
        this.partsByChapter[
          `${this.courses[0]}|${this.chaptersByCourse[this.courses[0]]?.[0] || ''}`
        ]?.[0] || '',
      newPart: '',
      documentFileName: '',
      documentFile: null,
      videoFileName: '',
      videoFile: null,
      videoLink: '',
      quizMode: 'existing',
      quizTitle: '',
      quizDescription: '',
      quizFileName: '',
      quizFile: null,
      quizKeywords: '',
      quizChapterFileNames: [],
      quizChapterFiles: [],
      quizSourceChapter: '',
      quizDifficulty: 'moyen',
      quizQuestions: 10,
      quizAttempts: 3,
      quizScore: 70,
      quizDueDate: '',
    };
  }

  setCourse(course: string) {
    this.contentForm.selectedCourse = course;
    this.contentForm.selectedChapter = this.chaptersByCourse[course]?.[0] || '';
    const partKey = `${course}|${this.contentForm.selectedChapter}`;
    this.contentForm.selectedPart = this.partsByChapter[partKey]?.[0] || '';
  }

  setChapter(chapter: string) {
    this.contentForm.selectedChapter = chapter;
    const course = this.contentForm.selectedCourse;
    const partKey = `${course}|${chapter}`;
    this.contentForm.selectedPart = this.partsByChapter[partKey]?.[0] || '';
  }

  handleDocumentInput(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (file) {
      const validDocument = /\.(pdf|docx)$/i.test(file.name);
      if (!validDocument) {
        this.contentForm.documentFile = null;
        this.contentForm.documentFileName = '';
        this.formError = 'Le document doit Ãªtre au format PDF ou DOCX.';
        input.value = '';
        return;
      }

      this.formError = '';
      this.contentForm.documentFile = file;
      this.contentForm.documentFileName = file.name;
    }
  }

  handleVideoInput(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (file) {
      const validVideo = /\.(mp4|mov|avi|webm|mkv)$/i.test(file.name);
      if (!validVideo) {
        this.contentForm.videoFile = null;
        this.contentForm.videoFileName = '';
        this.formError = 'La video doit etre au format MP4, MOV, AVI, WebM ou MKV.';
        input.value = '';
        return;
      }

      this.formError = '';
      this.contentForm.videoFile = file;
      this.contentForm.videoFileName = file.name;
      this.contentForm.videoLink = '';
    }
  }

  handleQuizInput(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (file) {
      const validQuizFile = /\.(pdf|doc|docx)$/i.test(file.name);
      if (!validQuizFile) {
        this.contentForm.quizFile = null;
        this.contentForm.quizFileName = '';
        this.formError = 'Le quiz doit etre au format PDF, DOC ou DOCX.';
        input.value = '';
        return;
      }

      this.formError = '';
      this.contentForm.quizFile = file;
      this.contentForm.quizFileName = file.name;
    }
  }

  handleQuizChapterInputs(event: Event) {
    const input = event.target as HTMLInputElement;
    const files = Array.from(input.files || []);

    if (files.length === 0) {
      this.contentForm.quizChapterFiles = [];
      this.contentForm.quizChapterFileNames = [];
      return;
    }

    const invalidFile = files.find(file => !/\.(pdf|doc|docx)$/i.test(file.name));
    if (invalidFile) {
      this.contentForm.quizChapterFiles = [];
      this.contentForm.quizChapterFileNames = [];
      this.formError =
        'Les chapitres sources doivent Ãªtre au format PDF, DOC ou DOCX.';
      input.value = '';
      return;
    }

    this.formError = '';
    this.contentForm.quizChapterFiles = files;
    this.contentForm.quizChapterFileNames = files.map(file => file.name);
  }

  get progress() {
    return Math.round(((this.currentStep - 1) / 4) * 100);
  }

  saveWizard() {
    this.scheduleUiUpdate(() => {
      this.isSaving = true;
      this.formError = '';
    });

    if (this.creationMode === 'full' && !this.hasVideoSource()) {
      this.scheduleUiUpdate(() => {
        this.isSaving = false;
        this.formError = 'Ajoutez une video locale ou un lien video valide avant de continuer.';
      });
      return;
    }

    const trimmedVideoLink = this.contentForm.videoLink.trim();

    const courseId =
      this.contentForm.courseMode === 'existing'
        ? this.contentForm.selectedCourse
        : this.contentForm.newCourse;
    const chapterId =
      this.contentForm.chapterMode === 'existing'
        ? this.contentForm.selectedChapter
        : this.contentForm.newChapter;
    const partId =
      this.contentForm.partMode === 'existing'
        ? this.contentForm.selectedPart
        : this.contentForm.newPart;
    const shouldCreateDocument =
      this.creationMode === 'full' || (this.creationMode === 'linked' && this.hasDocumentSource());
    const shouldCreateVideo =
      this.creationMode === 'full' || (this.creationMode === 'linked' && this.hasVideoSource());
    const shouldCreateQuiz =
      this.creationMode === 'quiz_only' ||
      this.creationMode === 'full' ||
      (this.creationMode === 'linked' &&
        !!this.contentForm.quizTitle.trim() &&
        (this.contentForm.quizMode === 'generated'
          ? this.generatedQuizTopics().length > 0
          : !!this.contentForm.quizFileName));

    const quizPayload = this.buildQuizPayload(courseId, chapterId, partId);

    if (this.editingCourseName && this.editingCourseItems.length > 0) {
      this.updateExistingCourse(courseId, chapterId, partId, quizPayload);
      return;
    }

    if (this.creationMode === 'quiz_only') {
      this.http.post<any>('/api/contents', quizPayload).subscribe({
        next: createdQuiz => {
          this.scheduleUiUpdate(() => {
            this.appendCreatedContents([createdQuiz]);
            this.isSaving = false;
            this.closeModal();
          });
        },
        error: error => {
          this.scheduleUiUpdate(() => {
            this.isSaving = false;
            this.formError =
              error?.error?.message ||
              error?.message ||
              "L'enregistrement du quiz automatique a échoué.";
          });
        },
      });
      return;
    }

    const requests = [];

    if (shouldCreateDocument) {
      requests.push(
        this.http
          .post<any>('/api/contents', {
            type: 'document',
            courseId,
            chapterId,
            partId,
            title: `${partId} - Document`,
            description: 'Document de cours ajoutÃ©',
          })
          .pipe(
            switchMap(createdDocument => {
              if (!this.contentForm.documentFile || !createdDocument?._id) {
                return of(createdDocument);
              }

              const formData = new FormData();
              formData.append('file', this.contentForm.documentFile);

              return this.http
                .post<any>(`/api/contents/${createdDocument._id}/file`, formData)
                .pipe(map(response => response?.content || createdDocument));
            }),
          ),
      );
    }

    if (shouldCreateVideo) {
      requests.push(
        this.http
          .post<any>('/api/contents', {
            type: 'video',
            courseId,
            chapterId,
            partId,
            title: `${partId} - VidÃƒÆ’Ã‚Â©o`,
            description: trimmedVideoLink || 'VidÃƒÆ’Ã‚Â©o ajoutÃƒÆ’Ã‚Â©e',
            source: trimmedVideoLink || undefined,
          })
          .pipe(
            switchMap(createdVideo => {
              if (!this.contentForm.videoFile || !createdVideo?._id) {
                return of(createdVideo);
              }

              const formData = new FormData();
              formData.append('file', this.contentForm.videoFile);

              return this.http
                .post<any>(`/api/contents/${createdVideo._id}/file`, formData)
                .pipe(
                  map(response => {
                    if (response?.content) {
                      return response.content;
                    }

                    if (response?.fileUrl) {
                      return {
                        ...createdVideo,
                        fileUrl: response.fileUrl,
                        source: response.fileUrl,
                      };
                    }

                    return createdVideo;
                  }),
                );
            }),
          ),
      );
    }

    if (shouldCreateQuiz) {
      requests.push(
        this.http.post<any>('/api/contents', quizPayload).pipe(
          switchMap(createdQuiz => {
            if (!this.contentForm.quizFile || !createdQuiz?._id) {
              return of(createdQuiz);
            }

            const formData = new FormData();
            formData.append('file', this.contentForm.quizFile);

            return this.http
              .post<any>(`/api/contents/${createdQuiz._id}/file`, formData)
              .pipe(
                map(response => {
                  const parsedQuiz = response?.content || createdQuiz;
                  return {
                    parsedQuiz,
                    parseFailed:
                      this.contentForm.quizMode === 'existing' &&
                      (!parsedQuiz?.quizQuestions || parsedQuiz.quizQuestions.length === 0),
                  };
                }),
              );
          }),
        ),
      );
    }

    forkJoin(requests).subscribe({
      next: results => {
        this.scheduleUiUpdate(() => {
          const quizResult = results.find(
            (result: any) => result?.parsedQuiz || result?.parseFailed,
          ) as
            | { parsedQuiz: any; parseFailed: boolean }
            | undefined;

          if (quizResult?.parseFailed) {
            this.isSaving = false;
            this.formError =
              "Le fichier quiz a ete telecharge, mais aucune question n'a pu etre extraite. Verifiez le format 'Question / A. / B. / C. / D. / Bonne reponse: X'.";
            return;
          }

          this.appendCreatedContents(results);
          this.isSaving = false;
          this.closeModal();
        });
      },
      error: error => {
        this.scheduleUiUpdate(() => {
          this.isSaving = false;
          this.formError =
            error?.error?.message ||
            error?.message ||
            "L'enregistrement a Ã©chouÃ©. VÃ©rifiez que le backend est dÃ©marrÃ© et que l'API rÃ©pond.";
        });
      },
    });
  }

  getChapters(course: string) {
    return this.chapterKeysByCourseMap[course] || [];
  }

  getParts(course: string, chapter: string): string[] {
    return this.partKeysByChapterMap[this.chapterKey(course, chapter)] || [];
  }

  getItemsForPart(course: string, chapter: string, part: string): ContentItem[] {
    const items = this.groupedContentsMap[course]?.[chapter] || [];
    return items.filter(item => (item.partId || 'Partie 1') === part);
  }

  getChapterItems(course: string, chapter: string): ContentItem[] {
    return this.groupedContentsMap[course]?.[chapter] || [];
  }

  chapterTotal(course: string, chapter: string): number {
    return this.getChapterItems(course, chapter).length;
  }

  chapterCompleted(course: string, chapter: string): number {
    return this.getChapterItems(course, chapter).filter(item => item.completed).length;
  }

  chapterProgress(course: string, chapter: string): number {
    const total = this.chapterTotal(course, chapter);
    if (!total) {
      return 0;
    }
    return Math.round((this.chapterCompleted(course, chapter) / total) * 100);
  }

  chapterDescription(course: string, chapter: string): string {
    const itemWithDescription = this.getChapterItems(course, chapter).find(item => !!item.description);
    return (
      itemWithDescription?.description ||
      'Introduction au chapitre et aux ressources disponibles (documents, vidÃ©os et quiz).'
    );
  }

  countByType(type: ContentType): number {
    return this.contents.filter(item => item.type === type).length;
  }

  toggleCourse(course: string) {
    this.openedCourseMenu = null;
    this.openedPartMenu = null;
    this.openedItemMenu = null;
    this.courseExpanded[course] = !this.courseExpanded[course];
  }

  toggleCourseMenu(course: string, event: Event) {
    event.stopPropagation();
    this.openedCourseMenu = this.openedCourseMenu === course ? null : course;
  }

  addLinkedContent(course: string, event?: Event) {
    event?.stopPropagation();
    this.openedCourseMenu = null;
    this.openModal();
    this.creationMode = 'linked';
    this.contentForm.courseMode = 'existing';
    this.setCourse(course);
    this.currentStep = 2;
  }

  editCourse(course: string, event?: Event) {
    event?.stopPropagation();
    this.openedCourseMenu = null;

    const courseItems = this.contents.filter(item => item.courseId === course);
    if (courseItems.length === 0) {
      this.formError = `Aucun contenu trouvÃƒÂ© pour le cours "${course}".`;
      return;
    }

    const documentItem = courseItems.find(item => item.type === 'Document');
    const videoItem = courseItems.find(item => item.type.toLowerCase().includes('vid'));
    const quizItem = courseItems.find(item => item.type === 'Quiz');
    const anchorItem = documentItem || videoItem || quizItem || courseItems[0];

    this.showModal = true;
    this.currentStep = 1;
    this.formError = '';
    this.editingContent = null;
    this.editingCourseName = course;
    this.editingCourseItems = courseItems;

    this.contentForm = {
      courseMode: 'existing',
      selectedCourse: anchorItem.courseId,
      newCourse: '',
      chapterMode: 'existing',
      selectedChapter: anchorItem.chapterId,
      newChapter: '',
      partMode: 'existing',
      selectedPart: anchorItem.partId,
      newPart: '',
      documentFileName: documentItem?.fileName || '',
      documentFile: null,
      videoFileName: videoItem?.fileName || '',
      videoFile: null,
      videoLink: videoItem?.source || '',
      quizMode: quizItem?.quizMode || 'existing',
      quizTitle: quizItem?.title || '',
      quizDescription: quizItem?.description?.replace(/\s*\(questions:\s*\d+\)\s*$/, '') || '',
      quizFileName: quizItem?.fileName || '',
      quizFile: null,
      quizKeywords:
        quizItem?.quizMode === 'generated' ? quizItem.quizSourceChapter || '' : '',
      quizChapterFileNames: [],
      quizChapterFiles: [],
      quizSourceChapter: quizItem?.quizSourceChapter || anchorItem.chapterId,
      quizDifficulty: quizItem?.quizDifficulty || 'moyen',
      quizQuestions: quizItem?.quizQuestionCount ||
        (quizItem?.description?.match(/questions:\s*(\d+)/)?.[1]
          ? Number(quizItem.description.match(/questions:\s*(\d+)/)?.[1])
          : 10),
      quizAttempts: quizItem?.quizAttempts || 3,
      quizScore: quizItem?.quizPassingScore || 70,
      quizDueDate: quizItem?.dueDate || '',
    };
  }

  deleteCourse(course: string, event?: Event) {
    event?.stopPropagation();
    this.openedCourseMenu = null;

    const confirmed = window.confirm(
      `Voulez-vous vraiment supprimer le cours "${course}" et tous ses contenus ?`,
    );
    if (!confirmed) {
      return;
    }

    this.http.delete(`/api/contents/course/${encodeURIComponent(course)}`).subscribe({
      next: () => {
        this.scheduleUiUpdate(() => {
          this.contents = this.contents.filter(item => item.courseId !== course);
          this.syncStructureFromContents();
        });
      },
      error: () => {
        const courseItems = this.contents.filter(item => item.courseId === course);
        const ids = courseItems
          .map(item => item._id)
          .filter((id): id is string => !!id);

        if (ids.length === 0) {
          this.scheduleUiUpdate(() => {
            this.contents = this.contents.filter(item => item.courseId !== course);
            this.syncStructureFromContents();
          });
          return;
        }

        forkJoin(ids.map(id => this.http.delete(`/api/contents/${id}`))).subscribe({
          next: () => {
            this.scheduleUiUpdate(() => {
              this.contents = this.contents.filter(item => item.courseId !== course);
              this.syncStructureFromContents();
            });
          },
          error: deleteError => {
            this.scheduleUiUpdate(() => {
              this.formError =
                deleteError?.error?.message ||
                deleteError?.message ||
                'La suppression du cours a echoue.';
            });
          },
        });
      },
    });
  }

  toggleChapter(course: string, chapter: string) {
    const key = this.chapterKey(course, chapter);
    this.chapterExpanded[key] = !this.chapterExpanded[key];
  }

  togglePart(course: string, chapter: string, part: string) {
    this.openedPartMenu = null;
    this.openedItemMenu = null;
    const key = this.partKey(course, chapter, part);
    this.partExpanded[key] = !this.partExpanded[key];
  }

  togglePartMenu(course: string, chapter: string, part: string, event: Event) {
    event.stopPropagation();
    const key = this.partKey(course, chapter, part);
    this.openedPartMenu = this.openedPartMenu === key ? null : key;
  }

  deletePart(course: string, chapter: string, part: string, event?: Event) {
    event?.stopPropagation();
    const key = this.partKey(course, chapter, part);
    this.openedPartMenu = null;

    const partItems = this.getItemsForPart(course, chapter, part);
    if (partItems.length === 0) {
      return;
    }

    const confirmed = window.confirm(
      `Voulez-vous vraiment supprimer la partie "${part}" et tous ses contenus ?`,
    );
    if (!confirmed) {
      return;
    }

    const ids = partItems
      .map(item => item._id)
      .filter((id): id is string => !!id);

    if (ids.length === 0) {
      this.scheduleUiUpdate(() => {
        this.contents = this.contents.filter(
          item =>
            !(
              item.courseId === course &&
              item.chapterId === chapter &&
              item.partId === part
            ),
        );
        this.syncStructureFromContents();
      });
      return;
    }

    forkJoin(ids.map(id => this.http.delete(`/api/contents/${id}`))).subscribe({
      next: () => {
        this.scheduleUiUpdate(() => {
          this.contents = this.contents.filter(
            item =>
              !(
                item.courseId === course &&
                item.chapterId === chapter &&
                item.partId === part
              ),
          );
          delete this.partExpanded[key];
          this.syncStructureFromContents();
        });
      },
      error: deleteError => {
        this.scheduleUiUpdate(() => {
          this.formError =
            deleteError?.error?.message ||
            deleteError?.message ||
            'La suppression de la partie a echoue.';
        });
      },
    });
  }

  openPreview(item: ContentItem) {
    this.openedItemMenu = null;
    this.selectedPreviewItem = item;
  }

  toggleItemMenu(item: ContentItem, event: Event) {
    event.stopPropagation();
    const key = item._id || [item.courseId, item.chapterId, item.partId, item.title].join('|');
    this.openedItemMenu = this.openedItemMenu === key ? null : key;
  }

  closePreview() {
    this.selectedPreviewItem = null;
  }

  previewSource(item: ContentItem): SafeResourceUrl | null {
    if (this.isVideoItem(item) && item.source?.startsWith('http')) {
      const embeddedVideoUrl = this.toEmbeddedVideoUrl(item.source);
      if (embeddedVideoUrl) {
        return this.sanitizer.bypassSecurityTrustResourceUrl(embeddedVideoUrl);
      }
    }

    const rawSource = item.fileUrl || item.source;
    if (!rawSource) {
      return null;
    }

    const resolvedSource = rawSource.startsWith('http')
      ? rawSource
      : `${this.backendBaseUrl}${rawSource}`;

    return this.sanitizer.bypassSecurityTrustResourceUrl(resolvedSource);
  }

  previewVideoUrl(item: ContentItem): string | null {
    if (!this.isVideoItem(item)) {
      return null;
    }

    const rawSource = item.fileUrl || item.source;
    if (!rawSource || rawSource.startsWith('http')) {
      return null;
    }

    return `${this.backendBaseUrl}${rawSource}`;
  }

  isQuizItem(item: ContentItem): boolean {
    return item.type === 'Quiz';
  }

  isVideoItem(item: ContentItem): boolean {
    return item.type.toLowerCase().includes('vid');
  }

  previewQuizQuestions(item: ContentItem): QuizQuestion[] {
    if (!this.isQuizItem(item) || !Array.isArray(item.quizQuestions)) {
      return [];
    }

    return item.quizQuestions;
  }

  quizQuestionTypeLabel(question: QuizQuestion): string {
    return question.type === 'multiple' ? 'Choix multiples' : 'Choix unique';
  }

  isCorrectQuizOption(question: QuizQuestion, optionLabel: string): boolean {
    return question.correctAnswers.includes(optionLabel);
  }

  courseTotal(course: string): number {
    const courseGroup = this.groupedContentsMap[course] || {};
    const chapters = Object.values(courseGroup) as ContentItem[][];
    return chapters.reduce((sum, items) => sum + items.length, 0);
  }

  deleteContent(item: ContentItem) {
    this.openedItemMenu = null;

    if (!item._id) {
      this.contents = this.contents.filter(c => c !== item);
      this.syncStructureFromContents();
      return;
    }

    const previousContents = [...this.contents];
    this.contents = this.contents.filter(c => c._id !== item._id);
    this.syncStructureFromContents();

    this.http.delete(`/api/contents/${item._id}`).subscribe({
      next: () => {},
      error: () => {
        this.scheduleUiUpdate(() => {
          this.contents = previousContents;
          this.syncStructureFromContents();
          this.formError = 'La suppression a Ã©chouÃ©.';
        });
      },
    });
  }

  private mapApiItemToContentItem(item: any): ContentItem | null {
    const type = this.fromApiType(item.type);
    if (!type) {
      return null;
    }

    return {
      _id: item._id,
      type,
      courseId: item.courseId || item.course || '',
      chapterId: item.chapterId || item.chapter || '',
      partId: item.partId || item.part || 'Partie 1',
      title: item.title || 'Sans titre',
      description: item.description || '',
      dueDate: item.dueDate || undefined,
      fileName: item.fileName || item.originalName || undefined,
      source: item.source || item.fileUrl || undefined,
      fileUrl: item.fileUrl || undefined,
      quizMode: item.quizMode || undefined,
      quizDifficulty: item.quizDifficulty || undefined,
      quizSourceChapter: item.quizSourceChapter || undefined,
      quizAttempts: item.quizAttempts || undefined,
      quizPassingScore: item.quizPassingScore || undefined,
      quizQuestionCount: item.quizQuestionCount || undefined,
      quizQuestions: Array.isArray(item.quizQuestions) ? item.quizQuestions : [],
      completed: item.completed ?? false,
    };
  }

  private fromApiType(type: string): ContentType | null {
    switch ((type || '').toLowerCase()) {
      case 'document':
        return 'Document';
      case 'video':
        return 'Vidéo';
      case 'quiz':
        return 'Quiz';
      default:
        return null;
    }
  }

  private deduplicateContents(items: ContentItem[]): ContentItem[] {
    const bestByKey = new Map<string, ContentItem>();

    items.forEach(item => {
      const key =
        item._id ||
        [
          item.type,
          item.courseId,
          item.chapterId,
          item.partId,
          item.title,
        ].join('|');
      const current = bestByKey.get(key);
      const candidateScore = this.contentPriority(item);
      const currentScore = current ? this.contentPriority(current) : -1;

      if (!current || candidateScore >= currentScore) {
        bestByKey.set(key, item);
      }
    });

    return Array.from(bestByKey.values());
  }

  private appendCreatedContents(results: any[]) {
    const createdItems = results
      .map(result => result?.parsedQuiz || result?.content || result)
      .map(result => this.mapApiItemToContentItem(result))
      .filter((item): item is ContentItem => item !== null);

    if (!createdItems.length) {
      return;
    }

    this.contents = this.deduplicateContents([...this.contents, ...createdItems]);
    this.syncStructureFromContents();
  }

  private contentPriority(item: ContentItem): number {
    if (item.fileUrl) {
      return 3;
    }

    if (item.source) {
      return 2;
    }

    return 1;
  }

  private syncStructureFromContents() {
    const courseSet = new Set<string>();
    const chaptersByCourse: Record<string, Set<string>> = {};
    const partsByChapter: Record<string, Set<string>> = {};
    const grouped: Record<string, Record<string, ContentItem[]>> = {};

    this.contents.forEach(item => {
      if (!item.courseId || !item.chapterId || !item.partId) {
        return;
      }

      if (!grouped[item.courseId]) {
        grouped[item.courseId] = {};
      }
      if (!grouped[item.courseId][item.chapterId]) {
        grouped[item.courseId][item.chapterId] = [];
      }
      grouped[item.courseId][item.chapterId].push(item);

      courseSet.add(item.courseId);

      if (!chaptersByCourse[item.courseId]) {
        chaptersByCourse[item.courseId] = new Set<string>();
      }
      chaptersByCourse[item.courseId].add(item.chapterId);

      const partKey = `${item.courseId}|${item.chapterId}`;
      if (!partsByChapter[partKey]) {
        partsByChapter[partKey] = new Set<string>();
      }
      partsByChapter[partKey].add(item.partId);
    });

    this.groupedContentsMap = grouped;
    this.courseKeysList = Array.from(courseSet);
    this.chapterKeysByCourseMap = Object.fromEntries(
      Object.entries(chaptersByCourse).map(([course, chapters]) => [
        course,
        Array.from(chapters),
      ]),
    ) as Record<string, string[]>;
    this.partKeysByChapterMap = Object.fromEntries(
      Object.entries(partsByChapter).map(([key, parts]) => [
        key,
        Array.from(parts),
      ]),
    ) as Record<string, string[]>;

    if (courseSet.size === 0) {
      this.courses = [];
      this.chaptersByCourse = {};
      this.partsByChapter = {};
      return;
    }

    this.courses = [...this.courseKeysList];
    this.chaptersByCourse = Object.fromEntries(
      Object.entries(chaptersByCourse).map(([course, chapters]) => [
        course,
        Array.from(chapters),
      ]),
    );
    this.partsByChapter = Object.fromEntries(
      Object.entries(partsByChapter).map(([key, parts]) => [
        key,
        Array.from(parts),
      ]),
    );
  }

  private chapterKey(course: string, chapter: string): string {
    return `${course}|${chapter}`;
  }

  private partKey(course: string, chapter: string, part: string): string {
    return `${course}|${chapter}|${part}`;
  }

  private scheduleUiUpdate(update: () => void) {
    setTimeout(update, 0);
  }

  private hasVideoSource(): boolean {
    return !!this.contentForm.videoFile || !!this.contentForm.videoLink.trim();
  }

  private hasDocumentSource(): boolean {
    return !!this.contentForm.documentFile || !!this.contentForm.documentFileName.trim();
  }

  quizSourceChapters(): string[] {
    const selectedCourse =
      this.contentForm.courseMode === 'existing'
        ? this.contentForm.selectedCourse
        : this.contentForm.newCourse;
    return this.chaptersByCourse[selectedCourse] || [];
  }

  quizKeywordsList(): string[] {
    return Array.from(
      new Set(
        this.contentForm.quizKeywords
          .split(/[\n,;|]+/)
          .map(keyword => keyword.trim())
          .filter(Boolean),
      ),
    );
  }

  generatedQuizTopics(): string[] {
    const keywords = this.quizKeywordsList();
    const chapterTopics = this.contentForm.quizChapterFileNames.flatMap(fileName =>
      this.extractTopicsFromFileName(fileName),
    );

    return Array.from(new Set([...keywords, ...chapterTopics])).filter(Boolean);
  }

  private extractTopicsFromFileName(fileName: string): string[] {
    const baseName = fileName.replace(/\.[^.]+$/, '').trim();
    const chunks = baseName
      .split(/[_\-]+/)
      .map(chunk => chunk.trim())
      .filter(chunk => chunk.length > 1 && !/^\d+(\.\d+)*$/.test(chunk));

    return Array.from(new Set([baseName, ...chunks])).filter(Boolean);
  }

  private buildQuizPayload(courseId: string, chapterId: string, partId: string) {
    const keywords = this.generatedQuizTopics();
    const sourceChapter = this.contentForm.quizSourceChapter || chapterId;
    const quizQuestions =
      this.contentForm.quizMode === 'generated'
        ? this.generateQuizQuestions(
            courseId,
            chapterId,
            keywords,
            this.contentForm.quizQuestions,
            this.contentForm.quizDifficulty,
          )
        : [];

    return {
      type: 'quiz',
      courseId,
      chapterId,
      partId,
      title: this.contentForm.quizTitle,
      description:
        this.contentForm.quizDescription ||
        `Quiz ${this.contentForm.quizMode === 'generated' ? 'auto-généré' : 'lié'} pour ${keywords.join(', ') || sourceChapter}`,
      dueDate: this.contentForm.quizDueDate || undefined,
      quizMode: this.contentForm.quizMode,
      quizDifficulty: this.contentForm.quizDifficulty,
      quizSourceChapter:
        this.contentForm.quizMode === 'generated'
          ? keywords.join(', ')
          : sourceChapter,
      quizAttempts: this.contentForm.quizAttempts,
      quizPassingScore: this.contentForm.quizScore,
      quizQuestionCount:
        this.contentForm.quizMode === 'generated'
          ? this.contentForm.quizQuestions
          : undefined,
      quizQuestions,
    };
  }

  private generateQuizQuestions(
    courseId: string,
    chapterId: string,
    keywords: string[],
    questionCount: number,
    difficulty: QuizDifficulty,
  ): QuizQuestion[] {
    const normalizedKeywords = keywords.length ? keywords : [chapterId];
    const targetCount = Math.max(1, questionCount || 1);
    const topicSignature = this.buildTopicSignature(
      this.contentForm.quizTitle,
      normalizedKeywords,
      chapterId,
    );

    const topicTemplates = this.generateTopicSpecificQuestions(
      topicSignature,
      normalizedKeywords,
      difficulty,
    );
    if (topicTemplates.length > 0) {
      return topicTemplates.slice(0, targetCount);
    }

    return this.generateGenericKeywordQuestions(
      normalizedKeywords,
      targetCount,
      difficulty,
      this.contentForm.quizTitle.trim() || chapterId,
    );
  }

  private buildTopicSignature(title: string, keywords: string[], chapterId: string): string {
    return [title, chapterId, ...keywords]
      .join(' ')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase();
  }

  private generateTopicSpecificQuestions(
    topicSignature: string,
    keywords: string[],
    difficulty: QuizDifficulty,
  ): QuizQuestion[] {
    if (topicSignature.includes('machine learning')) {
      return [
        this.createSingleChoiceQuestion(
          'ml-1',
          'Le Machine Learning permet :',
          [
            'D’écrire uniquement du code statique',
            'D’apprendre automatiquement à partir des données',
            'De remplacer les bases de données',
            'De créer uniquement des interfaces',
          ],
          'B',
          'Le machine learning permet à un système d’apprendre à partir des données.',
        ),
        this.createSingleChoiceQuestion(
          'ml-2',
          'Quel type d’apprentissage utilise des données étiquetées ?',
          ['Non supervisé', 'Renforcement', 'Supervisé', 'Automatique'],
          'C',
          'Les données étiquetées sont utilisées en apprentissage supervisé.',
        ),
        this.createSingleChoiceQuestion(
          'ml-3',
          'Le phénomène d’overfitting correspond à :',
          [
            'Un modèle trop simple',
            'Un modèle qui généralise bien',
            'Un modèle qui mémorise les données d’entraînement',
            'Une erreur de programmation',
          ],
          'C',
          'Un modèle en overfitting mémorise trop les données d’entraînement et généralise mal.',
        ),
        this.createSingleChoiceQuestion(
          'ml-4',
          'Quel algorithme est utilisé pour le clustering ?',
          ['Régression linéaire', 'K-Means', 'SVM', 'Decision Tree'],
          'B',
          'K-Means est un algorithme classique de clustering.',
        ),
        this.createSingleChoiceQuestion(
          'ml-5',
          'Quelle métrique est utilisée pour évaluer un modèle de classification ?',
          ['Accuracy', 'Moyenne', 'Variance', 'Médiane'],
          'A',
          'Accuracy est une métrique classique pour les tâches de classification.',
        ),
        this.createSingleChoiceQuestion(
          'ml-6',
          'Parmi les éléments suivants, lequel correspond à une variable cible dans un problème supervisé ?',
          ['Le label à prédire', 'Le taux de compression', 'Le mot de passe', 'Le port du serveur'],
          'A',
          'La variable cible, ou label, est la valeur que le modèle doit prédire.',
        ),
        this.createSingleChoiceQuestion(
          'ml-7',
          'Quel ensemble de données sert principalement à mesurer la performance finale d’un modèle ?',
          ['Le jeu de test', 'Le jeu d’entraînement uniquement', 'Le cache du navigateur', 'Le journal système'],
          'A',
          'Le jeu de test permet d’évaluer le modèle sur des données jamais vues.',
        ),
        this.createSingleChoiceQuestion(
          'ml-8',
          'Quel concept désigne les variables d’entrée utilisées par un modèle ?',
          ['Les features', 'Les clusters', 'Les requêtes SQL', 'Les index HTTP'],
          'A',
          'Les features sont les variables d’entrée utilisées pour l’apprentissage.',
        ),
      ];
    }

    const joinKeywords = keywords.map(keyword => keyword.toLowerCase());
    if (
      topicSignature.includes('join') ||
      joinKeywords.some(keyword => keyword.includes('join'))
    ) {
      return [
        this.createSingleChoiceQuestion(
          'sql-join-1',
          'INNER JOIN permet de :',
          [
            'Retourner uniquement les lignes correspondantes dans les deux tables',
            'Retourner toutes les lignes de la table de gauche uniquement',
            'Supprimer les doublons automatiquement',
            'Créer une nouvelle base de données',
          ],
          'A',
          'INNER JOIN conserve seulement les correspondances présentes dans les deux tables.',
        ),
        this.createSingleChoiceQuestion(
          'sql-join-2',
          'LEFT JOIN retourne :',
          [
            'Toutes les lignes de la table de gauche, même sans correspondance',
            'Seulement les lignes communes aux deux tables',
            'Toutes les lignes de la table de droite uniquement',
            'Uniquement les lignes nulles',
          ],
          'A',
          'LEFT JOIN garde toutes les lignes de la table de gauche.',
        ),
        this.createSingleChoiceQuestion(
          'sql-join-3',
          'RIGHT JOIN retourne :',
          [
            'Toutes les lignes de la table de gauche',
            'Toutes les lignes de la table de droite, même sans correspondance',
            'Uniquement les lignes sans doublons',
            'Les lignes triées par ordre alphabétique',
          ],
          'B',
          'RIGHT JOIN garde toutes les lignes de la table de droite.',
        ),
        this.createSingleChoiceQuestion(
          'sql-join-4',
          'FULL JOIN permet de :',
          [
            'Ne garder que les lignes communes',
            'Combiner toutes les lignes des deux tables, avec ou sans correspondance',
            'Fusionner uniquement les colonnes numériques',
            'Supprimer les valeurs nulles',
          ],
          'B',
          'FULL JOIN réunit toutes les lignes des deux tables.',
        ),
        this.createSingleChoiceQuestion(
          'sql-join-5',
          'La clause utilisée pour relier deux tables est généralement :',
          ['GROUP BY', 'ORDER BY', 'ON', 'HAVING'],
          'C',
          'La condition de jointure est exprimée avec la clause ON.',
        ),
        this.createSingleChoiceQuestion(
          'sql-join-6',
          'Quelle jointure choisir pour conserver tous les enregistrements clients, même sans commande ?',
          ['INNER JOIN', 'LEFT JOIN', 'CROSS JOIN', 'SELF JOIN'],
          'B',
          'LEFT JOIN conserve tous les clients de la table de gauche.',
        ),
      ];
    }

    return [];
  }

  private generateGenericKeywordQuestions(
    keywords: string[],
    targetCount: number,
    difficulty: QuizDifficulty,
    quizLabel: string,
  ): QuizQuestion[] {
    const templates: QuizQuestion[] = [];
    const fallbackConcepts = [
      'sélection',
      'projection',
      'agrégation',
      'filtrage',
      'indexation',
      'normalisation',
      'clé primaire',
      'clé étrangère',
      'requête',
      'table',
      'condition',
      'optimisation',
    ];
    const distractorPool = Array.from(
      new Set(
        [...keywords, ...fallbackConcepts]
          .map(keyword => keyword.trim())
          .filter(Boolean),
      ),
    );

    const buildChoiceOptions = (correctKeyword: string, seed: number) => {
      const distractors = distractorPool
        .filter(candidate => candidate.toLowerCase() !== correctKeyword.toLowerCase())
        .slice(seed, seed + 3);

      while (distractors.length < 3) {
        distractors.push(
          fallbackConcepts[(seed + distractors.length) % fallbackConcepts.length],
        );
      }

      const insertAt = seed % 4;
      const optionTexts = [...distractors];
      optionTexts.splice(insertAt, 0, correctKeyword);

      return {
        options: optionTexts.slice(0, 4).map((text, index) => ({
          label: String.fromCharCode(65 + index),
          text,
        })),
        correctLabel: String.fromCharCode(65 + insertAt),
      };
    };

    keywords.forEach((keyword, index) => {
      const directChoice = buildChoiceOptions(keyword, index);
      templates.push({
        id: `keyword-definition-${index + 1}`,
        prompt: `Parmi les propositions suivantes, quelle notion appartient au quiz "${quizLabel}" ?`,
        type: 'single',
        options: directChoice.options,
        correctAnswers: [directChoice.correctLabel],
        explanation: `La notion attendue est "${keyword}".`,
      });
    });

    if (difficulty === 'difficile' && keywords.length >= 2) {
      const optionSet = distractorPool.slice(0, Math.min(6, distractorPool.length));
      templates.push({
        id: 'keywords-multiple',
        prompt: 'Quelles notions font partie du sujet défini par l’enseignant ?',
        type: 'multiple',
        options: optionSet.map((keyword, index) => ({
          label: String.fromCharCode(65 + index),
          text: keyword,
        })),
        correctAnswers: optionSet
          .map((keyword, index) =>
            keywords.some(item => item.toLowerCase() === keyword.toLowerCase())
              ? String.fromCharCode(65 + index)
              : null,
          )
          .filter((value): value is string => value !== null),
        explanation: 'Les bonnes réponses correspondent aux notions renseignées dans le formulaire.',
      });
    }

    while (templates.length < targetCount) {
      const keyword = keywords[templates.length % keywords.length];
      const fallbackChoice = buildChoiceOptions(keyword, templates.length);
      templates.push({
        id: `keyword-goal-${templates.length + 1}`,
        prompt: `Quel mot-clé a été explicitement fourni par l’enseignant pour le quiz "${quizLabel}" ?`,
        type: 'single',
        options: fallbackChoice.options,
        correctAnswers: [fallbackChoice.correctLabel],
        explanation: `"${keyword}" est l’un des concepts retenus pour la génération automatique.`,
      });
    }

    return templates.slice(0, targetCount);
  }

  private createSingleChoiceQuestion(
    id: string,
    prompt: string,
    options: string[],
    correctLabel: string,
    explanation: string,
  ): QuizQuestion {
    return {
      id,
      prompt,
      type: 'single',
      options: options.map((text, index) => ({
        label: String.fromCharCode(65 + index),
        text,
      })),
      correctAnswers: [correctLabel],
      explanation,
    };
  }

  private updateExistingCourse(
    courseId: string,
    chapterId: string,
    partId: string,
    quizPayload: any,
  ) {
    const documentItem = this.editingCourseItems.find(item => item.type === 'Document');
    const videoItem = this.editingCourseItems.find(item => item.type.toLowerCase().includes('vid'));
    const quizItem = this.editingCourseItems.find(item => item.type === 'Quiz');

    const requests = [
      documentItem?._id
        ? this.http.patch(`/api/contents/${documentItem._id}`, {
            courseId,
            chapterId,
            partId,
            title: `${partId} - Document`,
            description: 'Document de cours ajouté',
          })
        : of(null),
      videoItem?._id
        ? this.http.patch(`/api/contents/${videoItem._id}`, {
            courseId,
            chapterId,
            partId,
            title: `${partId} - Vidéo`,
            description: this.contentForm.videoLink || 'Vidéo ajoutée',
            source: this.contentForm.videoLink || undefined,
          })
        : of(null),
      quizItem?._id
        ? this.http.patch(`/api/contents/${quizItem._id}`, quizPayload)
        : of(null),
    ];

    forkJoin(requests)
      .pipe(
        switchMap(() => {
          const uploads = [];

          if (documentItem?._id && this.contentForm.documentFile) {
            const documentFormData = new FormData();
            documentFormData.append('file', this.contentForm.documentFile);
            uploads.push(
              this.http.post(`/api/contents/${documentItem._id}/file`, documentFormData),
            );
          }

          if (videoItem?._id && this.contentForm.videoFile) {
            const videoFormData = new FormData();
            videoFormData.append('file', this.contentForm.videoFile);
            uploads.push(
              this.http.post(`/api/contents/${videoItem._id}/file`, videoFormData),
            );
          }

          if (quizItem?._id && this.contentForm.quizFile) {
            const quizFormData = new FormData();
            quizFormData.append('file', this.contentForm.quizFile);
            uploads.push(
              this.http.post<any>(`/api/contents/${quizItem._id}/file`, quizFormData).pipe(
                map(response => {
                  const parsedQuiz = response?.content || quizItem;
                  return {
                    parsedQuiz,
                    parseFailed:
                      this.contentForm.quizMode === 'existing' &&
                      (!parsedQuiz?.quizQuestions || parsedQuiz.quizQuestions.length === 0),
                  };
                }),
              ),
            );
          }

          return uploads.length ? forkJoin(uploads) : of(null);
        }),
      )
      .subscribe({
        next: uploadResults => {
          this.scheduleUiUpdate(() => {
            const normalizedResults = Array.isArray(uploadResults)
              ? uploadResults
              : uploadResults
                ? [uploadResults]
                : [];
            const quizUpload = normalizedResults.find((result: any) => result?.parseFailed) as
              | { parseFailed?: boolean }
              | undefined;

            if (quizUpload?.parseFailed) {
              this.isSaving = false;
              this.formError =
                "Le fichier quiz a ete telecharge, mais aucune question n'a pu etre extraite. Verifiez le format 'Question / A. / B. / C. / D. / Bonne reponse: X'.";
              return;
            }

            this.isSaving = false;
            this.closeModal();
            this.loadContents();
          });
        },
        error: error => {
          this.scheduleUiUpdate(() => {
            this.isSaving = false;
            this.formError =
              error?.error?.message ||
              error?.message ||
              'La modification du cours a échoué.';
          });
        },
      });
  }

  private toEmbeddedVideoUrl(url: string): string | null {
    const youtubeMatch =
      url.match(/[?&]v=([^&]+)/i) || url.match(/youtu\.be\/([^?&]+)/i);
    if (youtubeMatch?.[1]) {
      return `https://www.youtube.com/embed/${youtubeMatch[1]}`;
    }

    const vimeoMatch = url.match(/vimeo\.com\/(\d+)/i);
    if (vimeoMatch?.[1]) {
      return `https://player.vimeo.com/video/${vimeoMatch[1]}`;
    }

    return null;
  }

}

