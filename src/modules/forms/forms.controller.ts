import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  Res,
} from '@nestjs/common';
import { FormsService } from './forms.service';
import { CreateFormDto } from './dto/create-form.dto';
import { UpdateFormDto } from './dto/update-form.dto';
import { ResMessage } from 'src/common/decorators/response.decorator';
import { QueryForm } from './dto/query-pagination-form.dto';
import { UpdateStatusFormDto } from './dto/update-status-form.dto';

@Controller('forms')
export class FormsController {
  constructor(private readonly formsService: FormsService) {}

  @ResMessage('Thêm biểu mẫu mới thành công!')
  @Post()
  create(@Body() createFormDto: CreateFormDto) {
    return this.formsService.create(createFormDto);
  }

  @ResMessage('Lấy danh sách biểu mẫu có phân trang thành công!')
  @Get()
  findAllWithPagination(@Query() query: QueryForm) {
    return this.formsService.findAllWithPagination(query);
  }

  @ResMessage('Lấy thông tin biểu mẫu!')
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.formsService.findOne(id);
  }

  @ResMessage('Cập nhật biểu mẫu thành công!')
  @Patch(':id')
  update(@Param('id') id: string, @Body() updateFormDto: UpdateFormDto) {
    return this.formsService.update(id, updateFormDto);
  }

  @ResMessage('Cập nhật trạng thái biểu mẫu thành công!')
  @Patch('/:id/status')
  updateStatus(
    @Param('id') id: string,
    @Body() updateStatusFormDto: UpdateStatusFormDto,
  ) {
    return this.formsService.updateStatus(id, updateStatusFormDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.formsService.remove(+id);
  }
}
