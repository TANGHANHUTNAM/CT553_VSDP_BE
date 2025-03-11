import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UsePipes,
  ValidationPipe,
  Res,
} from '@nestjs/common';
import { Response } from 'express';
import { FormResponsesService } from './form-responses.service';
import { CreateFormResponseDto } from './dto/create-form-response.dto';
import { UpdateFormResponseDto } from './dto/update-form-response.dto';
import { QueryPaginationFormResponseDto } from './dto/query-pagination-form-response.dto';
import { Public } from 'src/common/decorators/public.decorator';
import { ResMessage } from 'src/common/decorators/response.decorator';
import { SubmitFormDto } from '../sections-form/dto/submit-form.dto';
@UsePipes(new ValidationPipe({ skipMissingProperties: true }))
@Controller('form-responses')
export class FormResponsesController {
  constructor(private readonly formResponsesService: FormResponsesService) {}

  @Post()
  create(@Body() createFormResponseDto: CreateFormResponseDto) {
    return this.formResponsesService.create(createFormResponseDto);
  }

  @Get()
  findAll() {
    return this.formResponsesService.findAll();
  }

  // @Get(':id')
  // findOne(@Param('id') id: string) {
  //   return this.formResponsesService.findOne(+id);
  // }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateFormResponseDto: UpdateFormResponseDto,
  ) {
    return this.formResponsesService.update(+id, updateFormResponseDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.formResponsesService.remove(+id);
  }

  @Public()
  @ResMessage('Nộp biểu mẫu thành công!')
  @Post('submit/form')
  submitForm(@Body() data: SubmitFormDto) {
    return this.formResponsesService.submitForm(data);
  }

  @Post('search')
  getFormResponseByFormId(@Body() data: QueryPaginationFormResponseDto) {
    return this.formResponsesService.getFormResponseByFormId(data);
  }

  @Get(':id')
  getFormResponseDetail(@Param('id') id: string) {
    return this.formResponsesService.getFormResponseDetail(+id);
  }

  
}
