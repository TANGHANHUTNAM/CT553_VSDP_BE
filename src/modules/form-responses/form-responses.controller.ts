import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { Public } from 'src/common/decorators/public.decorator';
import { ResMessage } from 'src/common/decorators/response.decorator';
import { CreateFormResponseDto } from './dto/create-form-response.dto';
import { QueryPaginationFormResponseDto } from './dto/query-pagination-form-response.dto';
import { UpdateFormResponseDto } from './dto/update-form-response.dto';
import { FormResponsesService } from './form-responses.service';

@UsePipes(new ValidationPipe({ skipMissingProperties: true }))
@Controller('form-responses')
export class FormResponsesController {
  constructor(private readonly formResponsesService: FormResponsesService) {}

  @Post()
  create(@Body() createFormResponseDto: CreateFormResponseDto) {
    return this.formResponsesService.create(createFormResponseDto);
  }

  @ResMessage('Lấy tất cả hồ sơ đang chờ xử lý!')
  @Get('by_form/:id/filter')
  findAllResponseToFilterByForm(@Param('id') form_id: string) {
    return this.formResponsesService.findAllResponseToFilterByForm(form_id);
  }

  @ResMessage('Duyệt hồ sơ thành công!')
  @Patch('approve/:id')
  approveResponse(@Param('id') id: string) {
    return this.formResponsesService.approveResponse(+id);
  }

  @ResMessage('Từ chối hồ sơ thành công!')
  @Patch('reject/:id')
  rejectResponse(
    @Param('id') id: string,
    @Body() data: { rejected_reason: string },
  ) {
    return this.formResponsesService.rejectResponse(+id, data.rejected_reason);
  }

  @ResMessage('Cập nhật phản hồi biểu mẫu thành công!')
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateFormResponseDto: UpdateFormResponseDto,
  ) {
    return this.formResponsesService.update(+id, updateFormResponseDto);
  }

  @ResMessage('Xóa phản hồi biểu mẫu thành công!')
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.formResponsesService.remove(+id);
  }

  @Public()
  @ResMessage('Nộp biểu mẫu thành công!')
  @Post('submit/form')
  submitForm(@Body() data: CreateFormResponseDto) {
    return this.formResponsesService.submitForm(data);
  }

  @Post('search')
  getFormResponseByFormId(@Body() data: QueryPaginationFormResponseDto) {
    return this.formResponsesService.getFormResponseByFormId(data);
  }

  @ResMessage('Xem chi tiết phản hồi')
  @Get(':id')
  getFormResponseDetail(@Param('id') id: string) {
    return this.formResponsesService.getFormResponseDetail(+id);
  }

  @Get(':id/update')
  getFormResponseUpdate(@Param('id') id: string) {
    return this.formResponsesService.getFormResponseUpdate(+id);
  }
}
