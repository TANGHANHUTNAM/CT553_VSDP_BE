import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { CreateScoringSectionDto } from './dto/create-scoring-section.dto';
import { UpdateScoringSectionDto } from './dto/update-scoring-section.dto';
import { ScoringSectionsService } from './scoring-sections.service';
import { ResMessage } from 'src/common/decorators/response.decorator';
import { QueryByFormDto } from './dto/query-by-form.dto';

@Controller('scoring-sections')
export class ScoringSectionsController {
  constructor(
    private readonly scoringSectionsService: ScoringSectionsService,
  ) {}

  @ResMessage('Tạo mới phần điểm thành công!')
  @Post()
  create(@Body() createScoringSectionDto: CreateScoringSectionDto) {
    return this.scoringSectionsService.create(createScoringSectionDto);
  }

  @Get()
  findAll(@Query() query: QueryByFormDto) {
    return this.scoringSectionsService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.scoringSectionsService.findOne(+id);
  }

  @ResMessage('Cập nhập phần điểm thành công!')
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateScoringSectionDto: UpdateScoringSectionDto,
  ) {
    return this.scoringSectionsService.update(+id, updateScoringSectionDto);
  }

  @ResMessage('Xóa phần điểm thành công!')
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.scoringSectionsService.remove(+id);
  }
}
