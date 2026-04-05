import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { StudentService } from './student.service';

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

  @Post('assistant/ask')
  askAssistant(
    @Body()
    body: {
      question: string;
      level?: string;
      courseId?: string;
      chapterId?: string;
    },
  ) {
    return this.studentService.askAssistant(body);
  }
}
