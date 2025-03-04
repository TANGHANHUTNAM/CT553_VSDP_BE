import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateFormResponseDto } from './dto/create-form-response.dto';
import { UpdateFormResponseDto } from './dto/update-form-response.dto';
import { QueryPaginationFormResponseDto } from './dto/query-pagination-form-response.dto';
import { PrismaService } from 'src/core/prisma.service';
import { LogService } from 'src/log/log.service';
import { SectionsFormService } from '../sections-form/sections-form.service';
import {
  FormBlockInstance,
  FormBlockType,
} from 'src/auth/interface/block.interfacet';
import { SubmitFormDto } from '../sections-form/dto/submit-form.dto';

@Injectable()
export class FormResponsesService {
  constructor(
    private prismaService: PrismaService,
    private logService: LogService,
    private sectionsFormService: SectionsFormService,
  ) {
    this.logService.setContext(FormResponsesService.name);
  }

  public extractBlockTypes(
    jsonBlocks: FormBlockInstance[],
  ): Record<string, FormBlockType> {
    const blockTypes: Record<string, FormBlockType> = {};

    const processBlocks = (blocks: FormBlockInstance[]) => {
      blocks.forEach((block) => {
        blockTypes[block.id] = block.blockType;
        if (block.childBlock && Array.isArray(block.childBlock)) {
          processBlocks(block.childBlock);
        }
      });
    };

    processBlocks(jsonBlocks);
    return blockTypes;
  }

  create(createFormResponseDto: CreateFormResponseDto) {
    return 'This action adds a new formResponse';
  }

  findAll() {
    return `This action returns all formResponses`;
  }

  findOne(id: number) {
    return `This action returns a #${id} formResponse`;
  }

  update(id: number, updateFormResponseDto: UpdateFormResponseDto) {
    return `This action updates a #${id} formResponse`;
  }

  remove(id: number) {
    return `This action removes a #${id} formResponse`;
  }

  async getFormResponseByFormId(data: QueryPaginationFormResponseDto) {
    const {
      formId,
      current,
      filters,
      pageSize,
      search,
      sortField,
      sortOrder,
      universityId,
    } = data;
    console.log(data);
    try {
      const currentPage = current || 1;
      const itemsPerPage = pageSize || 10;
      const skip = (currentPage - 1) * itemsPerPage;
      const take = itemsPerPage;

      const whereFormResponses: any = {
        form_id: formId,
        AND: [
          search
            ? {
                OR: [
                  { name: { contains: search, mode: 'insensitive' } },
                  { email: { contains: search, mode: 'insensitive' } },
                  { phone_number: { contains: search, mode: 'insensitive' } },
                ],
              }
            : {},
          universityId ? { university_id: universityId } : {},
        ],
      };

      let FieldValueResponseWhere: any = {};
      if (filters && Object.keys(filters).length > 0) {
        FieldValueResponseWhere.OR = Object.entries(filters).map(
          async ([block_id, values]) => {
            const blockType = this.extractBlockTypes(
              (
                await this.prismaService.formSections.findMany({
                  where: { form_id: formId },
                  select: { json_blocks: true },
                })
              ).flatMap((s) => s.json_blocks as FormBlockInstance[]),
            )[block_id];

            if (blockType === 'InputNumber') {
              return { block_id, value_number: { in: values.map(Number) } };
            } else if (['CheckBox', 'RangePicker'].includes(blockType)) {
              return { block_id, value_array: { hasSome: values } };
            } else {
              return { block_id, value_string: { in: values } };
            }
          },
        );

        const blockResponses =
          await this.prismaService.fieldValueResponses.findMany({
            where: FieldValueResponseWhere,
            select: { form_response_id: true },
            distinct: ['form_response_id'],
          });

        const formResponseIds = blockResponses.map((br) => br.form_response_id);
        whereFormResponses.AND.push({ id: { in: formResponseIds } });
      }

      let orderBy: any = [];
      if (sortField && sortOrder) {
        const direction = sortOrder === 'ascend' ? 'asc' : 'desc';
        const blockType = this.extractBlockTypes(
          (
            await this.prismaService.formSections.findMany({
              where: { form_id: formId },
              select: { json_blocks: true },
            })
          ).flatMap((s) => s.json_blocks as FormBlockInstance[]),
        )[sortField];

        if (blockType === 'InputNumber') {
          orderBy = [
            {
              block_responses: {
                _every: { block_id: sortField, value_number: direction },
              },
            },
          ];
        }
      }
      const [responses, total] = await Promise.all([
        this.prismaService.formResponses.findMany({
          where: whereFormResponses,
          skip,
          take,
          orderBy,
          include: {
            field_value_responses: true,
            university: true,
          },
        }),
        this.prismaService.formResponses.count({ where: whereFormResponses }),
      ]);
      const data = responses.map((response) => ({
        id: response.id,
        name: response.name,
        email: response.email,
        phone_number: response.phone_number,
        university: response.university?.name || '-',
        ...response.field_value_responses.reduce((acc, block) => {
          acc[block.field_id] =
            block.value_string ??
            block.value_number ??
            block.value_array ??
            block.value_json ??
            '-';
          return acc;
        }, {}),
      }));
      return {
        data,
        pagination: {
          current: currentPage,
          pageSize: itemsPerPage,
          total,
        },
      };
    } catch (error) {
      this.logService.error(error);
      throw error;
    }
  }

  async submitForm(data: SubmitFormDto) {
    const { form_id, name, email, phone_number, university, ...dynamicFields } =
      data;
    try {
      const formSections = await this.prismaService.formSections.findMany({
        where: { form_id },
        select: { json_blocks: true },
      });

      if (formSections.length === 0) {
        throw new BadRequestException('Form not found!');
      }
      const allJsonBlocks: FormBlockInstance[] = formSections.flatMap(
        (section) => section.json_blocks as FormBlockInstance[],
      );
      const blockTypes = this.extractBlockTypes(allJsonBlocks);
      return this.prismaService.$transaction(async (prisma) => {
        const formResponse = await prisma.formResponses.create({
          data: {
            name,
            email,
            phone_number,
            university_id: university,
            form_id,
          },
        });
        const blockResponses = Object.entries(dynamicFields)
          .filter(([block_id]) => blockTypes[block_id])
          .map(([block_id, value]) => {
            const blockType = blockTypes[block_id];
            const blockData: any = {
              form_response_id: formResponse.id,
              field_id: block_id,
            };
            switch (blockType) {
              case 'InputText':
              case 'TextArea':
              case 'EditorText':
              case 'SelectOption':
              case 'RadioSelect':
              case 'DatePicker':
              case 'TimePicker':
                blockData.value_string = String(value);
                break;
              case 'InputNumber':
                blockData.value_number = Number(value);
                break;
              case 'CheckBox':
              case 'RangePicker':
                blockData.value_array = Array.isArray(value)
                  ? value.map(String)
                  : [String(value)];
                break;
              case 'Uploader':
              case 'Signature':
                blockData.value_json = Object(value);
                break;
              case 'RowLayout':
              case 'Heading':
              case 'Paragraph':
              case 'Link':
              case 'EditorDescription':
                return null;
              default:
                blockData.value_string = String(value);
            }

            return blockData;
          })
          .filter((block) => block !== null);
        await prisma.fieldValueResponses.createMany({
          data: blockResponses,
        });
        return formResponse;
      });
    } catch (error) {
      this.logService.error(error);
      throw error;
    }
  }
}
