import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { ScoringCriteriasService } from './scoring-criterias.service';
import { CreateScoringCriteriaDto } from './dto/create-scoring-criteria.dto';
import { UpdateScoringCriteriaDto } from './dto/update-scoring-criteria.dto';
import { ResMessage } from 'src/common/decorators/response.decorator';

@Controller('scoring-criterias')
export class ScoringCriteriasController {
  constructor(
    private readonly scoringCriteriasService: ScoringCriteriasService,
  ) {}

  @ResMessage('Thêm mới tiêu chí chấm điểm thành công!')
  @Post()
  create(@Body() createScoringCriteriaDto: CreateScoringCriteriaDto) {
    return this.scoringCriteriasService.create(createScoringCriteriaDto);
  }

  @Get()
  findAll() {
    return this.scoringCriteriasService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.scoringCriteriasService.findOne(+id);
  }

  @ResMessage('Cập nhật tiêu chí chấm điểm thành công!')
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateScoringCriteriaDto: UpdateScoringCriteriaDto,
  ) {
    return this.scoringCriteriasService.update(+id, updateScoringCriteriaDto);
  }

  @ResMessage('Xóa tiêu chí chấm điểm thành công!')
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.scoringCriteriasService.remove(+id);
  }
}
