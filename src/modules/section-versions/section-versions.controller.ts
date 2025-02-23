import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { SectionVersionsService } from './section-versions.service';
import { CreateSectionVersionDto } from './dto/create-section-version.dto';
import { UpdateSectionVersionDto } from './dto/update-section-version.dto';
import { ResMessage } from 'src/common/decorators/response.decorator';

@Controller('section-versions')
export class SectionVersionsController {
  constructor(
    private readonly sectionVersionsService: SectionVersionsService,
  ) {}

  @Post()
  create(@Body() createSectionVersionDto: CreateSectionVersionDto) {
    return this.sectionVersionsService.create(createSectionVersionDto);
  }

  @Get()
  findAll() {
    return this.sectionVersionsService.findAll();
  }

  @Get(':id/forms')
  findOne(@Param('id') id: string) {
    return this.sectionVersionsService.findOne(+id);
  }

  @ResMessage('Cập nhập phiên bản của section thành công!')
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateSectionVersionDto: UpdateSectionVersionDto,
  ) {
    return this.sectionVersionsService.update(+id, updateSectionVersionDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.sectionVersionsService.remove(+id);
  }
}
