import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { StudentService } from './student.service';
import type { SubmitLevelAssessmentDto } from './dto/submit-level-assessment.dto';

@Controller('api/student')
export class StudentController {
  constructor(private readonly studentService: StudentService) {}

  @Get('dashboard')
  getDashboard(@Query('level') level?: string) {
    return this.studentService.getDashboard(level);
  }

  @Get('quizzes')
  getQuizzes(@Query('level') level?: string) {
    return this.studentService.getQuizzes(level);
  }

  @Get('level-assessment/questions')
  getLevelAssessmentQuestions() {
    return this.studentService.getLevelAssessmentQuestions();
  }

  @Post('level-assessment/submit')
  submitLevelAssessment(@Body() body: SubmitLevelAssessmentDto) {
    return this.studentService.submitLevelAssessment(body);
  }

  @Post('assistant/ask')
  askAssistant(
    @Body()
    body: {
      question: string;
      level?: string;
      courseId?: string;
      chapterId?: string;
      history?: { role?: string; text?: string }[];
    },
  ) {
    return this.studentService.askAssistant(body);
  }
}
