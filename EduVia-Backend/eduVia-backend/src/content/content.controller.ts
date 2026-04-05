import { Controller, Get, Param } from '@nestjs/common';
import { ContentService } from './content.service';

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
}
