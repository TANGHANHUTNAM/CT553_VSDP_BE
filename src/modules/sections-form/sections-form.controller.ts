import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { ResMessage } from 'src/common/decorators/response.decorator';
import { CreateSectionsFormDto } from './dto/create-sections-form.dto';
import { UpdateSectionsFormDto } from './dto/update-sections-form.dto';
import { SectionsFormService } from './sections-form.service';

@Controller('sections-form')
export class SectionsFormController {
  constructor(private readonly sectionsFormService: SectionsFormService) {}

  @ResMessage('Tạo mới phần cho biểu mẫu thành công!')
  @Post()
  create(@Body() createSectionsFormDto: CreateSectionsFormDto) {
    return this.sectionsFormService.create(createSectionsFormDto);
  }

  @Get()
  findAll() {
    return this.sectionsFormService.findAll();
  }

  @Get('/form/:id')
  getSectionsByFormId(@Param('id') id: string) {
    return this.sectionsFormService.getSectionsByFormId(id);
  }

  @ResMessage('Cập nhật phần thành công!')
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateSectionsFormDto: UpdateSectionsFormDto,
  ) {
    return this.sectionsFormService.update(+id, updateSectionsFormDto);
  }

  @ResMessage('Xóa phần thành công!')
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.sectionsFormService.remove(+id);
  }

  // @Public()
  // @ResMessage('Nộp biểu mẫu thành công!')
  // @Post('submit/form')
  // submitForm(@Body() data: SubmitFormDto) {
  //   return this.sectionsFormService.submitForm(data);
  // }
}
