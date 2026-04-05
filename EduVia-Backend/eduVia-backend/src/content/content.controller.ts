import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseFilePipeBuilder,
  Patch,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { ContentService } from './content.service';
import { CreateContentDto } from './dto/create-content.dto';
import { UpdateContentDto } from './dto/update-content.dto';
import { extname } from 'path';

@Controller('api/contents')
export class ContentController {
  constructor(private readonly contentService: ContentService) {}

  @Get()
  findAll() {
    return this.contentService.findAll();
  }

  @Get('tree')
  findTree() {
    return this.contentService.findTree();
  }

  @Get('overview')
  findOverview() {
    return this.contentService.findOverview();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.contentService.findOne(id);
  }

  @Post()
  create(@Body() createDto: CreateContentDto) {
    return this.contentService.create(createDto);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateDto: UpdateContentDto) {
    return this.contentService.update(id, updateDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.contentService.remove(id);
  }

  @Delete('course/:courseId')
  removeCourse(@Param('courseId') courseId: string) {
    return this.contentService.removeCourse(courseId);
  }

  @Post(':id/file')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads',
        filename: (_req, file, callback) => {
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
          const fileExtName = extname(file.originalname);
          const sanitizedName = file.originalname.replace(/\s+/g, '-').replace(/[^a-zA-Z0-9-_.]/g, '');
          callback(null, `${sanitizedName}-${uniqueSuffix}${fileExtName}`);
        },
      }),
      fileFilter: (_req, file, callback) => {
        const allowed = /\.(pdf|doc|docx|mp4|mov|avi|webm|mkv)$/i;
        if (!allowed.test(file.originalname)) {
          return callback(
            new Error('Only PDF, DOC, DOCX, MP4, MOV, AVI, WEBM and MKV are allowed.'),
            false,
          );
        }
        callback(null, true);
      },
      limits: { fileSize: 200 * 1024 * 1024 },
    }),
  )
  async uploadFile(
    @Param('id') id: string,
    @UploadedFile(
      new ParseFilePipeBuilder()
        .addMaxSizeValidator({ maxSize: 200 * 1024 * 1024 })
        .build({ fileIsRequired: true }),
    ) file: any,
  ) {
    const fileUrl = `/uploads/${file.filename}`;
    const content = await this.contentService.attachFileUrl(
      id,
      fileUrl,
      file.originalname,
    );
    return {
      message: 'File uploaded and linked to content',
      content,
      fileUrl,
    };
  }
}
