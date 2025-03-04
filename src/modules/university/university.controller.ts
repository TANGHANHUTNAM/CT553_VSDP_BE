import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
} from '@nestjs/common';
import { UniversityService } from './university.service';
import { CreateUniversityDto } from './dto/create-university.dto';
import { UpdateUniversityDto } from './dto/update-university.dto';
import { ResMessage } from 'src/common/decorators/response.decorator';
import { UniversityQuery } from './dto/query-pagination-university.dto';

@Controller('universities')
export class UniversityController {
  constructor(private readonly universityService: UniversityService) {}

  @ResMessage('Tạo mới trường học thành công')
  @Post()
  create(@Body() createUniversityDto: CreateUniversityDto) {
    return this.universityService.create(createUniversityDto);
  }

  @ResMessage('Lấy danh sách trường học có phân trang thành công')
  @Get()
  findAllWithPagination(@Query() query: UniversityQuery) {
    return this.universityService.findAllWithPagination(query);
  }

  @Get('all')
  findAll() {
    return this.universityService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.universityService.findOne(+id);
  }

  @ResMessage('Cập nhật trường học thành công')
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateUniversityDto: UpdateUniversityDto,
  ) {
    return this.universityService.update(+id, updateUniversityDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.universityService.remove(+id);
  }
}
