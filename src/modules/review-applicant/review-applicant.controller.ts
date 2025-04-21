import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  BadRequestException,
} from '@nestjs/common';
import { ReviewApplicantService } from './review-applicant.service';
import { CreateReviewApplicantDto } from './dto/create-review-applicant.dto';
import { UpdateReviewApplicantDto } from './dto/update-review-applicant.dto';
import { ResMessage } from 'src/common/decorators/response.decorator';
import { ReqUser } from 'src/common/decorators/user.decorator';
import { SaveScoresDto } from './dto/save-scores.dto';
import { IUser } from '../users/interface/users.interface';

@Controller('review-applicant')
export class ReviewApplicantController {
  constructor(
    private readonly reviewApplicantService: ReviewApplicantService,
  ) {}

  @Post()
  create(@Body() createReviewApplicantDto: CreateReviewApplicantDto) {
    return this.reviewApplicantService.create(createReviewApplicantDto);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateReviewApplicantDto: UpdateReviewApplicantDto,
  ) {
    return this.reviewApplicantService.update(+id, updateReviewApplicantDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.reviewApplicantService.remove(+id);
  }

  @Get('form-response/assigned/for-reviewers/:reviewerId')
  @ResMessage('Lấy danh sách phản hồi được phân công cho người đánh giá!')
  async getFormResponseAssignedForReviewer(
    @Param('reviewerId') reviewerId: string,
  ) {
    if (!reviewerId || isNaN(+reviewerId)) {
      throw new BadRequestException('reviewerId phải là một số hợp lệ');
    }
    return this.reviewApplicantService.getFormResponseAssignedForReviewer(
      +reviewerId,
    );
  }

  @ResMessage('Lấy thông tin chi tiết phân công thành công!')
  @Get()
  getDetailAssignment(
    @Query() query: { user_id: string; assignment_id: string },
  ) {
    if (!query.user_id || !query.assignment_id) {
      throw new BadRequestException('Thiếu tham số user_id hoặc assignment_id');
    }
    return this.reviewApplicantService.getDetailAssignment(
      +query.user_id,
      +query.assignment_id,
    );
  }

  @Post('scores')
  @ResMessage('Chấm điểm hồ sơ thành công!')
  async saveScores(
    @ReqUser() user: IUser,
    @Body() saveScoresDto: SaveScoresDto,
  ) {
    return this.reviewApplicantService.saveScores(user.id, saveScoresDto);
  }

  @Get('/completed')
  @ResMessage('Lấy danh sách hồ sơ hoàn thành thành công!')
  async getCompletedAssignments(@ReqUser() user: IUser) {
    return this.reviewApplicantService.getCompletedAssignments(user.id);
  }
}
