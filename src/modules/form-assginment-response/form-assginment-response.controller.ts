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
} from '@nestjs/common';
import { ResMessage } from 'src/common/decorators/response.decorator';
import { CreateFormAssginmentResponseDto } from './dto/create-form-assginment-response.dto';
import { UpdateFormAssginmentResponseDto } from './dto/update-form-assginment-response.dto';
import { FormAssginmentResponseService } from './form-assginment-response.service';

@Controller('form-assginment-response')
export class FormAssginmentResponseController {
  constructor(
    private readonly formAssginmentResponseService: FormAssginmentResponseService,
  ) {}

  @Post()
  create(
    @Body() createFormAssginmentResponseDto: CreateFormAssginmentResponseDto,
  ) {
    return this.formAssginmentResponseService.create(
      createFormAssginmentResponseDto,
    );
  }

  @Get()
  findAll() {
    return this.formAssginmentResponseService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.formAssginmentResponseService.findOne(+id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateFormAssginmentResponseDto: UpdateFormAssginmentResponseDto,
  ) {
    return this.formAssginmentResponseService.update(
      +id,
      updateFormAssginmentResponseDto,
    );
  }

  @Get('with-reviewers/by_form/:formId/scoring_section/:scoringSectionId')
  @ResMessage('Lấy danh sách phản hồi biểu mẫu với người đánh giá thành công!')
  async getFormResponsesWithReviewers(
    @Param('formId') formId: string,
    @Param('scoringSectionId') scoringSectionId: string,
    @Query('take') take?: string,
    @Query('skip') skip?: string,
    @Query('search') search?: string,
    @Query('universityId') universityId?: string,
    @Query('assigned') assigned?: string,
  ) {
    if (!formId || !scoringSectionId) {
      throw new BadRequestException('formId và scoringSectionId là bắt buộc');
    }

    const sectionId = parseInt(scoringSectionId, 10);
    if (isNaN(sectionId)) {
      throw new BadRequestException('scoringSectionId phải là một số hợp lệ');
    }

    const takeNum = take ? parseInt(take, 10) : 10;
    const skipNum = skip ? parseInt(skip, 10) : 0;

    if (isNaN(takeNum) || isNaN(skipNum)) {
      throw new BadRequestException('take và skip phải là số hợp lệ');
    }

    let assignedBool: boolean | undefined;
    if (assigned !== undefined) {
      if (assigned !== 'true' && assigned !== 'false') {
        throw new BadRequestException('assigned phải là "true" hoặc "false"');
      }
      assignedBool = assigned === 'true';
    }

    return this.formAssginmentResponseService.getFormResponsesWithReviewers(
      formId,
      sectionId,
      takeNum,
      skipNum,
      search,
      universityId ? +universityId : undefined,
      assignedBool,
    );
  }

  @Get('with-reviewers/all-reviewers')
  @ResMessage('Lấy danh sách người đánh giá!')
  getAllReviewers() {
    return this.formAssginmentResponseService.getAllReviewers();
  }

  @Post('assign-reviewer/:sectionId')
  @ResMessage('Phân bổ người đánh giá cho hồ sơ thành công!')
  async assignReviewer(
    @Param('sectionId') sectionId: string,
    @Body()
    data: {
      formResponseId: number[];
      reviewerId: number[];
    },
  ) {
    if (!sectionId || isNaN(+sectionId)) {
      throw new BadRequestException('sectionId phải là một số hợp lệ');
    }
    return this.formAssginmentResponseService.assignReviewer(+sectionId, data);
  }

  @Get('reviewer/:id')
  @ResMessage('Lấy thông tin người đánh giá!')
  async getReviewer(@Param('id') id: string) {
    if (!id || isNaN(+id)) {
      throw new BadRequestException('id phải là một số hợp lệ');
    }
    return this.formAssginmentResponseService.getReviewer(+id);
  }

  @Delete('reviewer')
  @ResMessage('Xóa người đánh giá khỏi hồ sơ được giao thành công!')
  async deleteReviewer(
    @Query('formResponseId') formResponseId: string,
    @Query('sectionScoreId') sectionId: string,
    @Query('reviewerId') userId: string,
  ) {
    if (
      !formResponseId ||
      !sectionId ||
      !userId ||
      isNaN(+formResponseId) ||
      isNaN(+sectionId) ||
      isNaN(+userId)
    ) {
      throw new BadRequestException(
        'formResponseId, sectionId, và userId phải là các số hợp lệ',
      );
    }
    return this.formAssginmentResponseService.deleteReviewerAssignedForResponseAndScoringSection(
      +formResponseId,
      +sectionId,
      +userId,
    );
  }
}
