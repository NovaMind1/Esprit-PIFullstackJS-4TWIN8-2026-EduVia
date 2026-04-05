import { Module } from '@nestjs/common';
import { ContentModule } from '../content/content.module';
import { StudentController } from './student.controller';
import { StudentService } from './student.service';

@Module({
  imports: [ContentModule],
  controllers: [StudentController],
  providers: [StudentService],
})
export class StudentModule {}
