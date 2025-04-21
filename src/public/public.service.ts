import { Injectable } from '@nestjs/common';
import { CreatePublicDto } from './dto/create-public.dto';
import { UpdatePublicDto } from './dto/update-public.dto';
import { LogService } from 'src/log/log.service';
import { PrismaService } from 'src/core/prisma.service';
import { maskEmail, maskPhoneNumber } from 'src/shared/func';

@Injectable()
export class PublicService {
  constructor(
    private prismaService: PrismaService,
    private logService: LogService,
  ) {
    this.logService.setContext(PublicService.name);
  }

  async getAllFormResponseScholarship() {
    try {
      const form = await this.prismaService.form.findFirst({
        where: {
          scope: 'SCHOLARSHIP',
          is_default: true,
        },
      });
      const formResponse = await this.prismaService.formResponses.findMany({
        where: {
          form_id: form.id,
        },
        select: {
          id: true,
          name: true,
          email: true,
          phone_number: true,
          university: true,
          created_at: true,
        },
      });
      const formResponseScholarship = formResponse.map((item) => {
        return {
          ...item,
          university: item.university.name,
          email: maskEmail(item.email),
          phone_number: maskPhoneNumber(item.phone_number),
        };
      });
      const data = {
        form_id: form.id,
        form_name: form.name,
        form_response: formResponseScholarship,
      };
      return data;
    } catch (error) {
      this.logService.error(error);
      throw error;
    }
  }

  create(createPublicDto: CreatePublicDto) {
    return 'This action adds a new public';
  }

  findAll() {
    return `This action returns all public`;
  }

  findOne(id: number) {
    return `This action returns a #${id} public`;
  }

  update(id: number, updatePublicDto: UpdatePublicDto) {
    return `This action updates a #${id} public`;
  }

  remove(id: number) {
    return `This action removes a #${id} public`;
  }
}
