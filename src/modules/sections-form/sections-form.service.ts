import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/core/prisma.service';
import { LogService } from 'src/log/log.service';
import { CreateSectionsFormDto } from './dto/create-sections-form.dto';
import { UpdateSectionsFormDto } from './dto/update-sections-form.dto';

import {
  FormBlockInstance,
  FormBlockType,
} from 'src/auth/interface/block.interfacet';

@Injectable()
export class SectionsFormService {
  constructor(
    private prisma: PrismaService,
    private logService: LogService,
  ) {
    this.logService.setContext(SectionsFormService.name);
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

  async create(createSectionsFormDto: CreateSectionsFormDto) {
    try {
      const sectionCreatedForm = await this.prisma.formSections.create({
        data: {
          ...createSectionsFormDto,
        },
      });
      const allSections = await this.prisma.formSections.findMany({
        where: {
          form_id: sectionCreatedForm.form_id,
        },
        orderBy: {
          created_at: 'asc',
        },
      });
      return allSections;
    } catch (error) {
      this.logService.error(error);
      throw error;
    }
  }

  async getSectionsByFormId(formId: string) {
    try {
      const sectionsForms = await this.prisma.formSections.findMany({
        where: {
          form_id: formId,
        },
        orderBy: {
          id: 'asc',
        },
      });
      return sectionsForms;
    } catch (error) {
      this.logService.error(error);
      throw error;
    }
  }

  findAll() {
    try {
    } catch (error) {
      this.logService.error(error);
      throw error;
    }
  }

  findOne(id: number) {
    return `This action returns a #${id} sectionsForm`;
  }

  async update(id: number, updateSectionsFormDto: UpdateSectionsFormDto) {
    try {
      if (!id) {
        throw new Error('Id is required!');
      }
      const updatedSection = await this.prisma.formSections.update({
        where: {
          id,
        },
        data: {
          ...updateSectionsFormDto,
        },
      });
      const allSections = await this.prisma.formSections.findMany({
        where: {
          form_id: updatedSection.form_id,
        },
        orderBy: {
          id: 'asc',
        },
      });
      return allSections;
    } catch (error) {
      this.logService.error(error);
      throw error;
    }
  }

  async remove(id: number) {
    try {
      const section = await this.prisma.formSections.delete({
        where: {
          id,
        },
      });
      const allSections = await this.prisma.formSections.findMany({
        where: {
          form_id: section.form_id,
        },
        orderBy: {
          id: 'asc',
        },
      });
      return allSections;
    } catch (error) {
      this.logService.error(error);
      throw error;
    }
  }

  // async submitForm(data: SubmitFormDto) {
  //   const { form_id, name, email, phone_number, university, ...dynamicFields } =
  //     data;
  //   try {
  //     const formSections = await this.prisma.formSections.findMany({
  //       where: { form_id },
  //       select: { json_blocks: true },
  //     });

  //     if (formSections.length === 0) {
  //       throw new BadRequestException('Form not found!');
  //     }
  //     const allJsonBlocks: FormBlockInstance[] = formSections.flatMap(
  //       (section) => section.json_blocks as FormBlockInstance[],
  //     );
  //     const blockTypes = this.extractBlockTypes(allJsonBlocks);
  //     return this.prisma.$transaction(async (prisma) => {
  //       const formResponse = await prisma.formResponses.create({
  //         data: {
  //           name,
  //           email,
  //           phone_number,
  //           university_id: university,
  //           form_id,
  //         },
  //       });
  //       const blockResponses = Object.entries(dynamicFields)
  //         .filter(([block_id]) => blockTypes[block_id])
  //         .map(([block_id, value]) => {
  //           const blockType = blockTypes[block_id];
  //           const blockData: any = {
  //             form_response_id: formResponse.id,
  //             field_id: block_id,
  //           };
  //           switch (blockType) {
  //             case 'InputText':
  //             case 'TextArea':
  //             case 'EditorText':
  //             case 'SelectOption':
  //             case 'RadioSelect':
  //             case 'DatePicker':
  //             case 'TimePicker':
  //               blockData.value_string = String(value);
  //               break;
  //             case 'InputNumber':
  //               blockData.value_number = Number(value);
  //               break;
  //             case 'CheckBox':
  //             case 'RangePicker':
  //               blockData.value_array = Array.isArray(value)
  //                 ? value.map(String)
  //                 : [String(value)];
  //               break;
  //             case 'Uploader':
  //             case 'Signature':
  //               blockData.value_json = Object(value);
  //               break;
  //             case 'RowLayout':
  //             case 'Heading':
  //             case 'Paragraph':
  //             case 'Link':
  //             case 'EditorDescription':
  //               return null;
  //             default:
  //               blockData.value_string = String(value);
  //           }

  //           return blockData;
  //         })
  //         .filter((block) => block !== null);
  //       await prisma.fieldValueResponses.createMany({
  //         data: blockResponses,
  //       });
  //       return formResponse;
  //     });
  //   } catch (error) {
  //     this.logService.error(error);
  //     throw error;
  //   }
  // }
}
