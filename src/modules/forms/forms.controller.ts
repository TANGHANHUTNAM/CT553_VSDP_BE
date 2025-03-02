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
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FormsService } from './forms.service';
import { CreateFormDto } from './dto/create-form.dto';
import { UpdateFormDto } from './dto/update-form.dto';
import { ResMessage } from 'src/common/decorators/response.decorator';
import { QueryForm } from './dto/query-pagination-form.dto';
import { UpdateStatusFormDto } from './dto/update-status-form.dto';
import { Public } from 'src/common/decorators/public.decorator';
import { FileInterceptor } from '@nestjs/platform-express';
import { multerOptions } from 'src/config/multer.config';
import { UpdateFormUploadImage } from './dto/update-form-uploadImage';
import { UpdateFormBuilderDto } from './dto/update-form-builder.dto';
import { UpdateStatusPublicFormDto } from './dto/update-status-public-form.dto';

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

  @ResMessage('Lấy thông tin xem trước biểu mẫu!')
  @Get('preview/:id')
  previewForm(@Param('id') id: string) {
    return this.formsService.previewForm(id);
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

  @ResMessage('Lưu biểu mẫu thành công!')
  @Patch(':id/builder/update')
  updateFormBuilder(
    @Param('id') id: string,
    @Body() updateFormBuilderDto: UpdateFormBuilderDto,
  ) {
    return this.formsService.updateFormBuilder(id, updateFormBuilderDto);
  }
  @ResMessage('Cập nhật trạng thái biểu mẫu thành công!')
  @Patch('/:id/status')
  updateStatus(
    @Param('id') id: string,
    @Body() updateStatusFormDto: UpdateStatusFormDto,
  ) {
    return this.formsService.updateStatus(id, updateStatusFormDto);
  }

  @ResMessage('Cập nhật trạng thái public biểu mẫu thành công!')
  @Patch('/:id/status/public')
  updateStatusPublic(
    @Param('id') id: string,
    @Body() updateStatusPublic: UpdateStatusPublicFormDto,
  ) {
    return this.formsService.updateStatusPublic(id, updateStatusPublic);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.formsService.remove(+id);
  }

  @ResMessage('Cập nhật style biểu mẫu thành công!')
  @Public()
  @UseInterceptors(FileInterceptor('image', multerOptions))
  @Patch(':id/style/update')
  updateStyleForm(
    @Param('id') id: string,
    @Body() data: UpdateFormUploadImage,
    @UploadedFile() image: Express.Multer.File,
  ) {
    return this.formsService.updateStyleForm(id, data, image);
  }
}
