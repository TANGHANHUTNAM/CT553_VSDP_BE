import { BadRequestException, Injectable } from '@nestjs/common';
import * as crypto from 'crypto';
import {
  FormBlockInstance,
  FormBlockNoInput,
  FormBlockType,
} from 'src/auth/interface/block.interfacet';
import { PrismaService } from 'src/core/prisma.service';
import { LogService } from 'src/log/log.service';
import { SubmitFormDto } from '../sections-form/dto/submit-form.dto';
import { CreateFormResponseDto } from './dto/create-form-response.dto';
import { QueryPaginationFormResponseDto } from './dto/query-pagination-form-response.dto';
import { UpdateFormResponseDto } from './dto/update-form-response.dto';
@Injectable()
export class FormResponsesService {
  constructor(
    private prismaService: PrismaService,
    private logService: LogService,
  ) {
    this.logService.setContext(FormResponsesService.name);
  }

  private extractInputBlocks(
    blocks: FormBlockInstance[],
  ): Array<{ id: string; label: string; blockType: string }> {
    return blocks.flatMap((block) => {
      if (!FormBlockNoInput.includes(block.blockType as any)) {
        return [
          {
            id: block.id,
            label: (block.attributes?.label as string) || '',
            blockType: block.blockType,
          },
        ];
      }
      if (block.childBlock) {
        return this.extractInputBlocks(block.childBlock);
      }
      return [];
    });
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
      status,
    } = data;

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
          status ? { status } : {},
        ],
      };

      const formSections = await this.prismaService.formSections.findMany({
        where: { form_id: formId },
        select: { json_blocks: true },
      });
      const allJsonBlocks: FormBlockInstance[] = formSections.flatMap(
        (s) => s.json_blocks as FormBlockInstance[],
      );
      const blockTypes = this.extractBlockTypes(allJsonBlocks);

      if (filters && Object.keys(filters).length > 0) {
        const fieldValueResponseWhere: any = {
          OR: Object.entries(filters).map(([field_id, values]) => {
            const blockType = blockTypes[field_id];
            if (blockType === 'InputNumber') {
              return { field_id, value_number: { in: values.map(Number) } };
            } else if (
              blockType === 'CheckBox' ||
              blockType === 'RangePicker'
            ) {
              return { field_id, value_array: { hasSome: values } };
            } else if (
              blockType === 'SelectOption' ||
              blockType === 'RadioSelect'
            ) {
              return { field_id, value_string: { in: values } };
            } else {
              return { field_id, value_string: { in: values } };
            }
          }),
        };

        const blockResponses =
          await this.prismaService.fieldValueResponses.findMany({
            where: fieldValueResponseWhere,
            select: { form_response_id: true },
            distinct: ['form_response_id'],
          });

        const formResponseIds = blockResponses.map((br) => br.form_response_id);
        if (formResponseIds.length === 0) {
          return {
            data: [],
            pagination: {
              current: currentPage,
              pageSize: itemsPerPage,
              totalRecords: 0,
            },
          };
        }
        whereFormResponses.AND.push({ id: { in: formResponseIds } });
      }

      let responses;
      const direction = sortOrder === 'ascend' ? 'ASC' : 'DESC';

      if (sortField === 'total_final_score' && sortOrder) {
        let queryParams: any[] = [formId];
        let paramIndex = 2;
        const rawQuery = `
        SELECT fr.*
        FROM "FormResponses" fr
        WHERE fr.form_id = $1
        ${search ? `AND (fr.name ILIKE $${paramIndex++} OR fr.email ILIKE $${paramIndex - 1} OR fr.phone_number ILIKE $${paramIndex - 1})` : ''}
        ${universityId ? `AND fr.university_id = $${paramIndex++}` : ''}
        ${status ? `AND fr.status = $${paramIndex++}::"ApplicantStatus"` : ''}
        ${whereFormResponses.AND.some((c: any) => c.id) ? 'AND fr.id IN (' + whereFormResponses.AND.find((c: any) => c.id).id.in.join(',') + ')' : ''}
        ORDER BY fr.total_final_score ${direction} NULLS LAST, fr.created_at ${direction} NULLS LAST
        LIMIT ${take} OFFSET ${skip}
      `;
        if (search) queryParams.push(`%${search}%`);
        if (universityId) queryParams.push(universityId);
        if (status) queryParams.push(status);

        responses = await this.prismaService.$queryRawUnsafe(
          rawQuery,
          ...queryParams,
        );
        const responseIds = responses.map((r: any) => r.id);
        responses = await this.prismaService.formResponses.findMany({
          where: { id: { in: responseIds } },
          include: { field_value_responses: true, university: true },
        });
        responses = responseIds.map((id: number) =>
          responses.find((r) => r.id === id),
        );
      } else if (sortField === 'created_at' && sortOrder) {
        let queryParams: any[] = [formId];
        let paramIndex = 2;
        const rawQuery = `
        SELECT fr.*
        FROM "FormResponses" fr
        WHERE fr.form_id = $1
        ${search ? `AND (fr.name ILIKE $${paramIndex++} OR fr.email ILIKE $${paramIndex - 1} OR fr.phone_number ILIKE $${paramIndex - 1})` : ''}
        ${universityId ? `AND fr.university_id = $${paramIndex++}` : ''}
        ${status ? `AND fr.status = $${paramIndex++}::"ApplicantStatus"` : ''}
        ${whereFormResponses.AND.some((c: any) => c.id) ? 'AND fr.id IN (' + whereFormResponses.AND.find((c: any) => c.id).id.in.join(',') + ')' : ''}
        ORDER BY fr.created_at ${direction} NULLS LAST
        LIMIT ${take} OFFSET ${skip}
      `;
        if (search) queryParams.push(`%${search}%`);
        if (universityId) queryParams.push(universityId);
        if (status) queryParams.push(status);

        responses = await this.prismaService.$queryRawUnsafe(
          rawQuery,
          ...queryParams,
        );
        const responseIds = responses.map((r: any) => r.id);
        responses = await this.prismaService.formResponses.findMany({
          where: { id: { in: responseIds } },
          include: { field_value_responses: true, university: true },
        });
        responses = responseIds.map((id: number) =>
          responses.find((r) => r.id === id),
        );
      } else if (
        sortField &&
        sortOrder &&
        blockTypes[sortField] === 'InputNumber'
      ) {
        let queryParams: any[] = [sortField, formId];
        let paramIndex = 3;
        const rawQuery = `
        SELECT fr.*
        FROM "FormResponses" fr
        LEFT JOIN "FieldValueResponses" fvr ON fr.id = fvr.form_response_id AND fvr.field_id = $1
        WHERE fr.form_id = $2
        ${search ? `AND (fr.name ILIKE $${paramIndex++} OR fr.email ILIKE $${paramIndex - 1} OR fr.phone_number ILIKE $${paramIndex - 1})` : ''}
        ${universityId ? `AND fr.university_id = $${paramIndex++}` : ''}
        ${status ? `AND fr.status = $${paramIndex++}::"ApplicantStatus"` : ''}
        ${whereFormResponses.AND.some((c: any) => c.id) ? 'AND fr.id IN (' + whereFormResponses.AND.find((c: any) => c.id).id.in.join(',') + ')' : ''}
        ORDER BY fvr.value_number ${direction} NULLS LAST
        LIMIT ${take} OFFSET ${skip}
      `;
        if (search) queryParams.push(`%${search}%`);
        if (universityId) queryParams.push(universityId);
        if (status) queryParams.push(status);

        responses = await this.prismaService.$queryRawUnsafe(
          rawQuery,
          ...queryParams,
        );
        const responseIds = responses.map((r: any) => r.id);
        responses = await this.prismaService.formResponses.findMany({
          where: { id: { in: responseIds } },
          include: { field_value_responses: true, university: true },
        });
        responses = responseIds.map((id: number) =>
          responses.find((r) => r.id === id),
        );
      } else {
        responses = await this.prismaService.formResponses.findMany({
          where: whereFormResponses,
          skip,
          take,
          include: { field_value_responses: true, university: true },
        });
      }

      const total = await this.prismaService.formResponses.count({
        where: whereFormResponses,
      });

      const data = responses.map((response) => ({
        id: response.id,
        name: response.name,
        email: response.email,
        phone_number: response.phone_number,
        university: response.university?.name || '-',
        total_final_score: response.total_final_score,
        final_scores: [...response.final_scores],
        status: response.status,
        snapshot_version: response.snapshot_version,
        created_at: response.created_at,
        ...response.field_value_responses.reduce((acc, block) => {
          if (block.value_json !== null) {
            acc[block.field_id] = block.value_json;
          } else if (block.value_array && block.value_array.length > 0) {
            acc[block.field_id] = block.value_array;
          } else if (block.value_number !== null) {
            acc[block.field_id] = block.value_number;
          } else if (block.value_string !== null) {
            acc[block.field_id] = block.value_string;
          } else {
            acc[block.field_id] = null;
          }
          return acc;
        }, {}),
      }));

      return {
        data,
        pagination: {
          current: currentPage,
          pageSize: itemsPerPage,
          totalRecords: total,
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
      const form = await this.prismaService.form.findUnique({
        where: { id: form_id },
      });
      if (!form) {
        throw new BadRequestException('Form not found!');
      }
      if (!form.is_public) {
        throw new BadRequestException('Form is not public!');
      }
      const formSections = await this.prismaService.formSections.findMany({
        where: { form_id },
        select: {
          json_blocks: true,
          name: true,
          id: true,
        },
      });

      const simplifiedStructure = formSections
        .sort((a, b) => a.id - b.id)
        .map((section) => ({
          id: section.id,
          name: section.name,
          blocks: this.extractInputBlocks(
            section.json_blocks as FormBlockInstance[],
          ),
        }));
      const formStructure = JSON.stringify(simplifiedStructure);
      const version = crypto
        .createHash('md5')
        .update(formStructure)
        .digest('hex');
      return this.prismaService.$transaction(async (prisma) => {
        const snapshot = await prisma.formSnapshots.upsert({
          where: { form_id_version: { form_id, version } },
          update: {},
          create: {
            form_id,
            version,
            snapshot_json: simplifiedStructure,
          },
        });

        const formResponse = await prisma.formResponses.create({
          data: {
            name,
            email,
            phone_number,
            university_id: university,
            form_id,
            snapshot_version: version,
            total_final_score: null,
            final_scores: [],
          },
        });

        const allJsonBlocks: FormBlockInstance[] = formSections.flatMap(
          (section) => section.json_blocks as FormBlockInstance[],
        );
        const blockTypes = this.extractBlockTypes(allJsonBlocks);

        const blockResponses = Object.entries(dynamicFields)
          .filter(([field_id]) => blockTypes[field_id])
          .map(([field_id, value]) => {
            const blockType = blockTypes[field_id];
            const blockData: any = {
              form_response_id: formResponse.id,
              field_id,
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
                blockData.value_json = value;
                break;
              default:
                return null;
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

  async getFormResponseDetail(responseId: number) {
    try {
      const formResponse = await this.prismaService.formResponses.findUnique({
        where: { id: responseId },
        include: {
          university: true,
          field_value_responses: true,
        },
      });

      if (!formResponse) {
        throw new BadRequestException('Form response not found!');
      }

      const snapshot = await this.prismaService.formSnapshots.findUnique({
        where: {
          form_id_version: {
            form_id: formResponse.form_id,
            version: formResponse.snapshot_version,
          },
        },
        select: { snapshot_json: true },
      });

      if (!snapshot) {
        throw new BadRequestException('Form snapshot not found!');
      }

      const snapshotStructure = snapshot.snapshot_json as Array<{
        name: string;
        blocks: Array<{ id: string; label: string; blockType: string }>;
      }>;

      const fieldValues = formResponse.field_value_responses.reduce(
        (acc, field) => {
          if (field.value_json !== null) {
            acc[field.field_id] = field.value_json;
          } else if (field.value_array && field.value_array.length > 0) {
            acc[field.field_id] = field.value_array;
          } else if (field.value_number !== null) {
            acc[field.field_id] = field.value_number;
          } else if (field.value_string !== null) {
            acc[field.field_id] = field.value_string;
          } else {
            acc[field.field_id] = null;
          }
          return acc;
        },
        {} as Record<string, any>,
      );

      const detailedSections = snapshotStructure.map((section) => ({
        name: section.name,
        fields: section.blocks.map((block) => ({
          id: block.id,
          label: block.label,
          blockType: block.blockType,
          value: fieldValues[block.id] ?? null,
        })),
      }));

      const responseDetail = {
        id: formResponse.id,
        name: formResponse.name,
        email: formResponse.email,
        phone_number: formResponse.phone_number,
        university: formResponse.university?.name || '-',
        total_final_score: formResponse.total_final_score,
        final_scores: [...formResponse.final_scores],
        status: formResponse.status,
        created_at: formResponse.created_at,
        form_id: formResponse.form_id,
        snapshot_version: formResponse.snapshot_version,
        sections: detailedSections,
      };

      return responseDetail;
    } catch (error) {
      this.logService.error(error);
      throw error;
    }
  }
}
