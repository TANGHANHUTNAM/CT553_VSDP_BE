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
import { Response } from 'express';
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
import { GetStatsDto } from './dto/stats-form.dto';

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

  @ResMessage('Xóa biểu mẫu thành công!')
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.formsService.remove(id);
  }

  @ResMessage('Cập nhật style biểu mẫu thành công!')
  @UseInterceptors(FileInterceptor('image', multerOptions))
  @Patch(':id/style/update')
  updateStyleForm(
    @Param('id') id: string,
    @Body() data: UpdateFormUploadImage,
    @UploadedFile() image: Express.Multer.File,
  ) {
    return this.formsService.updateStyleForm(id, data, image);
  }

  @ResMessage('Sao chép biểu mẫu thành công!')
  @Post(':id/copy')
  copyForm(@Param('id') id: string) {
    return this.formsService.copyForm(id);
  }

  @Public()
  @ResMessage('Lấy biểu mẫu học bổng')
  @Get('public/scholarship')
  getPublicFormScholarship() {
    return this.formsService.getPublicFormScholarship();
  }

  @ResMessage('Xuất file excel thành công!')
  @Get(':id/export-excel')
  async exportToExcel(@Param('id') formId: string, @Res() res: Response) {
    const buffer = await this.formsService.exportFormResponsesToExcel(formId);

    res.set({
      'Content-Type':
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="form_responses_${formId}.xlsx"`,
    });

    res.send(buffer);
  }

  @ResMessage('Lấy link chia sẻ biểu mẫu thành công!')
  @Post(':id/share-link')
  createShareLinkForm(
    @Param('id') id: string,
    @Body() data: { expiry_dates: number },
  ) {
    return this.formsService.createShareLinkForm(id, +data.expiry_dates);
  }

  @ResMessage('Lấy ngày hết hạn link chia sẻ biểu mẫu thành công!')
  @Get(':id/share-link/expiry-date')
  getShareLinkExpiryDate(@Param('id') id: string) {
    return this.formsService.getShareLinkExpiryDate(id);
  }

  @ResMessage('Lấy biểu mẫu chia sẻ từ link thành công!')
  @Public()
  @Get('share-link/:id')
  getFormFromShareLink(@Param('id') id: string, @Query('token') token: string) {
    return this.formsService.getFormFromShareLink(id, token);
  }

  @ResMessage('Lấy thống kê biểu mẫu thành công!')
  @Post('stats')
  getFormStats(@Body() data: GetStatsDto) {
    return this.formsService.getFormStats(data);
  }

  @Get(':id/block-type')
  getFieldBlockTypes(@Param('id') id: string) {
    return this.formsService.getFieldBlockTypes(id);
  }

  @ResMessage('Lấy thống kê theo loại trường dữ liệu thành công!')
  @Get(':id/field-type')
  getFieldOptionStats(
    @Param('id') id: string,
    @Query('field_id') field_id: string,
  ) {
    return this.formsService.getFieldOptionStats(id, field_id);
  }
}
