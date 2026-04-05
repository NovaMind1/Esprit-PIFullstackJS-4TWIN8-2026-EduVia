import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { readFile } from 'fs/promises';
import { extname, join } from 'path';
import * as mammoth from 'mammoth';
import { PDFParse } from 'pdf-parse';
import { Content, ContentDocument } from './content.schema';
import { CreateContentDto } from './dto/create-content.dto';
import { UpdateContentDto } from './dto/update-content.dto';

@Injectable()
export class ContentService {
  constructor(
    @InjectModel(Content.name) private contentModel: Model<ContentDocument>,
  ) {}

  async create(createContentDto: CreateContentDto): Promise<Content> {
    const normalizedDto = this.normalizeQuizPayload(createContentDto);
    const content = new this.contentModel(normalizedDto);
    return content.save();
  }

  async findAll(): Promise<Content[]> {
    return this.contentModel.find().exec();
  }

  async findTree(): Promise<any[]> {
    const contents = await this.contentModel.find().lean().exec();
    const courses = contents.filter(item => item.type === 'course');
    const chapters = contents.filter(item => item.type === 'chapter');
    const parts = contents.filter(item => item.type === 'part');
    const materials = contents.filter(item =>
      ['document', 'video', 'quiz'].includes(item.type),
    );

    return courses.map(course => {
      const courseChapters = chapters
        .filter(chapter => String(chapter.courseId) === String(course._id))
        .map(chapter => {
          const chapterParts = parts
            .filter(part => String(part.chapterId) === String(chapter._id))
            .map(part => ({
              ...part,
              materials: materials.filter(
                mat => String(mat.partId) === String(part._id),
              ),
            }));

          return {
            ...chapter,
            parts: chapterParts,
          };
        });

      return {
        ...course,
        chapters: courseChapters,
      };
    });
  }

  async findOverview(): Promise<any[]> {
    const tree = await this.findTree();
    return tree.map(course => {
      const chapterCount = course.chapters.length;
      const partCount = course.chapters.reduce(
        (sum, ch) => sum + (ch.parts?.length ?? 0),
        0,
      );
      const docCount = course.chapters.reduce(
        (sum, ch) =>
          sum +
          ch.parts.reduce(
            (ps, pt) =>
              ps + (pt.materials?.filter(m => m.type === 'document').length ?? 0),
            0,
          ),
        0,
      );
      const videoCount = course.chapters.reduce(
        (sum, ch) =>
          sum +
          ch.parts.reduce(
            (ps, pt) =>
              ps + (pt.materials?.filter(m => m.type === 'video').length ?? 0),
            0,
          ),
        0,
      );
      const quizCount = course.chapters.reduce(
        (sum, ch) =>
          sum +
          ch.parts.reduce(
            (ps, pt) =>
              ps + (pt.materials?.filter(m => m.type === 'quiz').length ?? 0),
            0,
          ),
        0,
      );

      return {
        id: course._id,
        title: course.title,
        description: course.description,
        chapterCount,
        partCount,
        docCount,
        videoCount,
        quizCount,
        isActive: course.isActive,
      };
    });
  }

  async findOne(id: string): Promise<Content> {
    const content = await this.contentModel.findById(id).exec();
    if (!content) {
      throw new NotFoundException(`Content #${id} not found`);
    }
    return content;
  }

  async update(id: string, updateContentDto: UpdateContentDto): Promise<Content> {
    const normalizedDto = this.normalizeQuizPayload(updateContentDto);
    const existing = await this.contentModel
      .findByIdAndUpdate(id, normalizedDto, { new: true })
      .exec();
    if (!existing) {
      throw new NotFoundException(`Content #${id} not found`);
    }
    return existing;
  }

  async remove(id: string): Promise<void> {
    const result = await this.contentModel.findByIdAndDelete(id).exec();
    if (!result) {
      throw new NotFoundException(`Content #${id} not found`);
    }
  }

  async removeCourse(courseId: string): Promise<void> {
    const result = await this.contentModel.deleteMany({ courseId }).exec();
    if (!result.deletedCount) {
      throw new NotFoundException(`Course "${courseId}" not found`);
    }
  }

  async attachFileUrl(id: string, fileUrl: string, fileName?: string): Promise<Content> {
    const currentContent = await this.contentModel.findById(id).exec();
    if (!currentContent) {
      throw new NotFoundException(`Content #${id} not found`);
    }

    const updatePayload: Partial<Content> = { fileUrl };
    if (fileName) {
      updatePayload.fileName = fileName;
    }
    if (currentContent.type === 'video') {
      updatePayload.source = fileUrl;
    }

    const content = await this.contentModel
      .findByIdAndUpdate(id, updatePayload, { new: true })
      .exec();
    if (!content) {
      throw new NotFoundException(`Content #${id} not found`);
    }

    if (content.type === 'quiz') {
      const parsedQuestions = await this.parseQuizQuestionsFromFile(fileUrl);
      if (parsedQuestions.length > 0) {
        const parsedContent = await this.contentModel
          .findByIdAndUpdate(
            id,
            {
              quizQuestions: parsedQuestions,
              quizQuestionCount: parsedQuestions.length,
            },
            { new: true },
          )
          .exec();

        if (parsedContent) {
          return parsedContent;
        }
      }
    }

    return content;
  }

  private async parseQuizQuestionsFromFile(fileUrl: string) {
    const relativePath = fileUrl.replace(/^\/+/, '').replace(/\//g, '\\');
    const filePath = join(process.cwd(), relativePath);
    const extension = extname(filePath).toLowerCase();

    let rawText = '';
    if (extension === '.pdf') {
      const buffer = await readFile(filePath);
      const parser = new PDFParse({ data: buffer });
      const parsedPdf = await parser.getText();
      rawText = parsedPdf.text || '';
      await parser.destroy();
    } else if (extension === '.docx') {
      rawText = await this.extractDocxText(filePath);
    } else {
      return [];
    }

    return this.parseQuizText(rawText);
  }

  private async extractDocxText(filePath: string): Promise<string> {
    const parsedDoc = await mammoth.extractRawText({ path: filePath });
    return parsedDoc.value || '';
  }

  private parseQuizText(rawText: string) {
    const text = rawText
      .replace(/\r/g, '')
      .replace(/[•●✅]/g, '')
      .replace(/[ \t]+\n/g, '\n')
      .replace(/\n{3,}/g, '\n\n')
      .trim();

    if (!text) {
      return [];
    }

    const questionBlocks = text
      .split(/\n(?=(?:Quiz\s*\d+\s*:|Question(?:\s*n)?\s*\d+\s*:?|Question\s*:|Q\s*\d+\s*:))/i)
      .map(block => block.trim())
      .filter(Boolean);

    const parsedQuestions = questionBlocks
      .map((block, index) => this.parseQuizBlock(block, index))
      .filter(question => question !== null);

    return parsedQuestions.length > 0
      ? parsedQuestions
      : this.parseNumberedQuestions(text) || this.parseQuizByGlobalPattern(text);
  }

  private parseQuizBlock(block: string, index: number) {
    const lines = block
      .split('\n')
      .map(line => line.trim())
      .filter(Boolean);

    const questionLineIndex = lines.findIndex(
      line =>
        this.normalizedText(line).startsWith('question :') ||
        /^Q\s*\d+\s*:/i.test(line) ||
        /^Question(?:\s*n)?\s*\d+\s*:?/i.test(line),
    );
    const questionLine =
      questionLineIndex >= 0 ? lines[questionLineIndex] : undefined;

    if (!questionLine) {
      return this.parseQuestionWithoutAnswer(block, index);
    }

    const optionLines = lines.filter(line => /^[A-Z][\.\)]\s+/i.test(line) || /^[a-z][\.\)]\s*/i.test(line));
    const firstOptionIndex = lines.findIndex(
      line => /^[A-Z][\.\)]\s+/i.test(line) || /^[a-z][\.\)]\s*/i.test(line),
    );
    const promptFromHeader = questionLine
      .replace(/^(?:Question(?:\s*n)?\s*\d+|Question|Q\s*\d+)\s*:?\s*/i, '')
      .trim();
    const promptFromBody =
      firstOptionIndex > questionLineIndex
        ? lines
            .slice(questionLineIndex + 1, firstOptionIndex)
            .join(' ')
            .trim()
        : '';
    const prompt = promptFromHeader || promptFromBody;

    const answerLine = lines.find(line => {
      const normalized = this.normalizedText(line);
      return (
        normalized.startsWith('bonne reponse :') ||
        normalized.startsWith('reponse correcte :') ||
        normalized.startsWith('reponse :')
      );
    });

    if (!prompt || !answerLine) {
      return this.parseQuestionWithoutAnswer(block, index) || this.parseInlineQuizBlock(block, index);
    }

    const options = optionLines.map(line => {
      const match = line.match(/^([A-Z])[\.\)]\s*(.*)$/i);
      return {
        label: match?.[1]?.toUpperCase() || '',
        text: match?.[2]?.trim() || '',
      };
    });

    const answerMatch = answerLine.match(/:\s*([A-Z](?:\s*,\s*[A-Z])*)/i) ||
      answerLine.match(/:\s*([a-z](?:\s*,\s*[a-z])*)/i);
    if (!answerMatch?.[1] || options.length === 0) {
      return this.parseQuestionWithoutAnswer(block, index) || this.parseInlineQuizBlock(block, index);
    }

    const correctAnswers = answerMatch[1]
      .split(',')
      .map(answer => answer.trim().charAt(0).toUpperCase())
      .filter(Boolean);

    return {
      id: `parsed-question-${index + 1}`,
      prompt,
      type: correctAnswers.length > 1 ? 'multiple' : 'single',
      options,
      correctAnswers,
      explanation: answerLine.replace(/^.*?:\s*/i, '').trim(),
    };
  }

  private parseInlineQuizBlock(block: string, index: number) {
    const compactBlock = block.replace(/\s+/g, ' ').trim();
    const answerMatch = compactBlock.match(
      /(?:Bonne\s+réponse|Bonne\s+reponse|Réponse\s+correcte|Reponse\s+correcte|Réponse|Reponse)\s*:\s*([A-Z](?:\s*,\s*[A-Z])*)(?:[\.\)]\s*(.*))?/i,
    );

    if (!answerMatch?.[1]) {
      return null;
    }

    const questionOptionsPart = compactBlock.replace(answerMatch[0], '').trim();
    const promptMatch = questionOptionsPart.match(
      /(?:Question(?:\s*n)?\s*\d+|Question|Q\s*\d+)\s*:?\s*(.*?)\s+[A-Da-d][\.\)]\s+/i,
    );

    if (!promptMatch?.[1]) {
      return null;
    }

    const prompt = promptMatch[1].trim();
    const optionsText = questionOptionsPart.slice(promptMatch[0].length - 3).trim();
    const options = this.extractInlineOptions(optionsText);
    if (options.length === 0) {
      return null;
    }

    const correctAnswers = answerMatch[1]
      .split(',')
      .map(answer => answer.trim().toUpperCase())
      .filter(Boolean);

    return {
      id: `parsed-question-${index + 1}`,
      prompt,
      type: correctAnswers.length > 1 ? 'multiple' : 'single',
      options,
      correctAnswers,
      explanation: (answerMatch[2] || answerMatch[1]).trim(),
    };
  }

  private extractInlineOptions(optionsText: string) {
    const optionRegex = /([A-Da-d])[\.\)]\s*(.*?)(?=\s+[A-Da-d][\.\)]\s|$)/g;
    const options: Array<{ label: string; text: string }> = [];
    let match: RegExpExecArray | null;

    while ((match = optionRegex.exec(optionsText)) !== null) {
      options.push({
        label: match[1].toUpperCase(),
        text: match[2].trim(),
      });
    }

    return options;
  }

  private parseQuestionWithoutAnswer(block: string, index: number) {
    const compactBlock = block.replace(/\r/g, '').replace(/\n+/g, ' ').replace(/\s+/g, ' ').trim();
    const headingMatch = compactBlock.match(
      /^(?:Quiz\s*\d+\s*:.*?\s+)?(?:Question(?:\s*n)?\s*\d+|Question|Q\s*\d+)\s*:?\s*(.*)$/i,
    );

    if (!headingMatch?.[1]) {
      return null;
    }

    const body = headingMatch[1].trim();
    const optionRegex = /([A-Da-d])\)\s*(.*?)(?=(?:[A-Da-d]\)\s)|$)/g;
    const options: Array<{ label: string; text: string }> = [];
    let match: RegExpExecArray | null;

    while ((match = optionRegex.exec(body)) !== null) {
      options.push({
        label: match[1].toUpperCase(),
        text: match[2].trim(),
      });
    }

    if (options.length < 2) {
      return null;
    }

    const firstOptionIndex = body.search(/[A-Da-d]\)\s*/);
    if (firstOptionIndex < 0) {
      return null;
    }

    const prompt = body.slice(0, firstOptionIndex).trim();
    if (!prompt) {
      return null;
    }

    return {
      id: `parsed-question-${index + 1}`,
      prompt,
      type: 'single',
      options,
      correctAnswers: [],
      explanation: 'Aucune correction n’a été trouvée dans le fichier importé.',
    };
  }

  private parseNumberedQuestions(text: string) {
    const blocks = text
      .split(/\n\s*(?=\d+\.\s)/)
      .map(block => block.trim())
      .filter(Boolean);

    const parsed = blocks
      .map((block, index) => this.parseNumberedQuestionBlock(block, index))
      .filter(question => question !== null);

    return parsed.length > 0 ? parsed : null;
  }

  private parseNumberedQuestionBlock(block: string, index: number) {
    const compactBlock = block.replace(/\r/g, '').replace(/\n+/g, ' ').replace(/\s+/g, ' ').trim();
    const promptMatch = compactBlock.match(/^\d+\.\s*(.*?)(?=\s+[A-D]\.\s)/);
    if (!promptMatch?.[1]) {
      return null;
    }

    const answerMatch = compactBlock.match(/Réponse\s*:\s*([A-D])/i);
    if (!answerMatch?.[1]) {
      return null;
    }

    const optionsText = compactBlock
      .replace(/^\d+\.\s*/, '')
      .replace(/Réponse\s*:\s*[A-D].*$/i, '')
      .trim();

    const optionRegex = /([A-D])\.\s*(.*?)(?=\s+[A-D]\.\s|$)/g;
    const options: Array<{ label: string; text: string }> = [];
    let match: RegExpExecArray | null;

    while ((match = optionRegex.exec(optionsText)) !== null) {
      options.push({
        label: match[1].toUpperCase(),
        text: match[2].trim(),
      });
    }

    if (options.length < 2) {
      return null;
    }

    return {
      id: `parsed-question-${index + 1}`,
      prompt: promptMatch[1].trim(),
      type: 'single',
      options,
      correctAnswers: [answerMatch[1].toUpperCase()],
      explanation: `${answerMatch[1].toUpperCase()}`,
    };
  }

  private parseQuizByGlobalPattern(text: string) {
    const normalized = text.replace(/\n+/g, '\n');
    const regex =
      /(?:Quiz\s*\d+\s*:.*?\n)?(?:Question|Q\s*\d+)\s*:\s*([\s\S]*?)\s+A[\.\)]\s+([\s\S]*?)\s+B[\.\)]\s+([\s\S]*?)\s+C[\.\)]\s+([\s\S]*?)(?:\s+D[\.\)]\s+([\s\S]*?))?\s+(?:Bonne\s+réponse|Bonne\s+reponse|Réponse\s+correcte|Reponse\s+correcte|Réponse|Reponse)\s*:\s*([A-Z](?:\s*,\s*[A-Z])*)(?:[\.\)]\s*([\s\S]*?))?(?=\n\s*Quiz\s*\d+\s*:|$)/gi;

    const parsedQuestions: any[] = [];
    let match: RegExpExecArray | null;
    let index = 0;

    while ((match = regex.exec(normalized)) !== null) {
      index += 1;
      const options = [
        { label: 'A', text: match[2].trim() },
        { label: 'B', text: match[3].trim() },
        { label: 'C', text: match[4].trim() },
      ];

      if (match[5]?.trim()) {
        options.push({ label: 'D', text: match[5].trim() });
      }

      parsedQuestions.push({
        id: `parsed-question-${index}`,
        prompt: match[1].trim(),
        type: match[6].includes(',') ? 'multiple' : 'single',
        options,
        correctAnswers: match[6]
          .split(',')
          .map(answer => answer.trim().toUpperCase())
          .filter(Boolean),
        explanation: (match[7] || match[6]).trim(),
      });
    }

    return parsedQuestions;
  }

  private normalizedText(value: string): string {
    return value
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/\s+/g, ' ')
      .trim()
      .toLowerCase();
  }

  private normalizeQuizPayload<T extends Partial<CreateContentDto>>(payload: T): T {
    if (payload.type !== 'quiz') {
      return payload;
    }

    return {
      ...payload,
      quizQuestions: payload.quizQuestions ?? [],
      quizAttempts: payload.quizAttempts ?? 1,
      quizPassingScore: payload.quizPassingScore ?? 70,
      quizQuestionCount:
        payload.quizQuestionCount ??
        (payload.quizQuestions?.length ? payload.quizQuestions.length : undefined),
    };
  }
}
