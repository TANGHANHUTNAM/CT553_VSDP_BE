import { BadRequestException, Injectable } from '@nestjs/common';
import * as crypto from 'crypto';
import {
  FormBlockInstance,
  FormBlockNoInput,
  FormBlockType,
} from 'src/auth/interface/block.interfacet';
import { PrismaService } from 'src/core/prisma.service';
import { LogService } from 'src/log/log.service';

import { CreateFormResponseDto } from './dto/create-form-response.dto';
import { QueryPaginationFormResponseDto } from './dto/query-pagination-form-response.dto';
import { UpdateFormResponseDto } from './dto/update-form-response.dto';
import { ApplicantStatus } from '@prisma/client';
@Injectable()
export class FormResponsesService {
  constructor(
    private prismaService: PrismaService,
    private logService: LogService,
  ) {
    this.logService.setContext(FormResponsesService.name);
  }

  private extractInputBlocks(blocks: FormBlockInstance[]): Array<{
    id: string;
    label: string;
    blockType: string;
    options: string[];
  }> {
    return blocks.flatMap((block) => {
      if (!FormBlockNoInput.includes(block.blockType as string)) {
        return [
          {
            id: block.id,
            label: (block.attributes?.label as string) || '',
            blockType: block.blockType,
            options: Array.isArray(block.attributes?.options)
              ? block.attributes.options
              : [],
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

  async findAllResponseToFilterByForm(id: string) {
    try {
      const form = await this.prismaService.form.findUnique({
        where: { id },
      });
      if (!form) {
        throw new BadRequestException('Form not found!');
      }
      const formResponse = await this.prismaService.formResponses.findMany({
        where: { form_id: id, status: 'SUBMITTED' },
        include: {
          university: {
            select: {
              name: true,
            },
          },
        },
      });
      return formResponse;
    } catch (error) {
      this.logService.error(error);
      throw error;
    }
  }

  async update(id: number, updateFormResponseDto: UpdateFormResponseDto) {
    const { name, email, phone_number, university, status, dynamic_fields } =
      updateFormResponseDto;
    try {
      const existingResponse =
        await this.prismaService.formResponses.findUnique({
          where: { id },
          include: { field_value_responses: true },
        });

      if (!existingResponse) {
        throw new BadRequestException('Response not found!');
      }

      // Lấy cấu trúc hiện tại của form từ formSections
      const formSections = await this.prismaService.formSections.findMany({
        where: { form_id: existingResponse.form_id },
        select: { json_blocks: true, name: true, id: true },
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
      const newVersion = crypto
        .createHash('md5')
        .update(formStructure)
        .digest('hex');

      // Lấy snapshot hiện tại của response
      const currentSnapshot = await this.prismaService.formSnapshots.findUnique(
        {
          where: {
            form_id_version: {
              form_id: existingResponse.form_id,
              version: existingResponse.snapshot_version,
            },
          },
          select: { snapshot_json: true },
        },
      );

      const currentSnapshotJson = currentSnapshot?.snapshot_json as Array<{
        name: string;
        blocks: Array<{
          id: string;
          label: string;
          blockType: string;
          options?: string[];
        }>;
      }> | null;

      // So sánh cấu trúc hiện tại với snapshot cũ để kiểm tra có trường mới không
      const isStructureChanged =
        JSON.stringify(currentSnapshotJson) !== formStructure;

      const allJsonBlocks: FormBlockInstance[] = formSections.flatMap(
        (s) => s.json_blocks as FormBlockInstance[],
      );
      const blockTypes = this.extractBlockTypes(allJsonBlocks);

      // Lấy tất cả các field_id từ snapshot hiện tại
      const currentSnapshotFields = new Set(
        currentSnapshotJson?.flatMap((section) =>
          section.blocks.map((block) => block.id),
        ) || [],
      );

      // Lấy tất cả các field_id từ cấu trúc hiện tại
      const currentStructureFields = new Set(
        simplifiedStructure.flatMap((section) =>
          section.blocks.map((block) => block.id),
        ),
      );

      // Kiểm tra xem có field mới nào trong form không
      const hasNewFields = Array.from(currentStructureFields).some(
        (fieldId) => !currentSnapshotFields.has(fieldId),
      );

      const updatedResponse = await this.prismaService.$transaction(
        async (prisma) => {
          // Cập nhật snapshot nếu có trường mới
          let snapshotVersion = existingResponse.snapshot_version;
          if (hasNewFields || (isStructureChanged && !currentSnapshotJson)) {
            const newSnapshot = await prisma.formSnapshots.upsert({
              where: {
                form_id_version: {
                  form_id: existingResponse.form_id,
                  version: newVersion,
                },
              },
              update: {},
              create: {
                form_id: existingResponse.form_id,
                version: newVersion,
                snapshot_json: simplifiedStructure,
              },
            });
            snapshotVersion = newSnapshot.version;
          }

          // Cập nhật formResponses
          const updatedFormResponse = await prisma.formResponses.update({
            where: { id },
            data: {
              name,
              email,
              phone_number,
              university_id: university,
              status,
              snapshot_version: snapshotVersion,
            },
          });

          // Xử lý dynamic_fields: Chỉ thêm hoặc cập nhật các trường mới/chưa tồn tại
          if (dynamic_fields && Object.keys(dynamic_fields).length > 0) {
            const existingFieldIds = new Set(
              existingResponse.field_value_responses.map(
                (field) => field.field_id,
              ),
            );

            const fieldValueResponsesToCreate = [];
            const fieldValueResponsesToUpdate = [];

            for (const [field_id, value] of Object.entries(dynamic_fields)) {
              if (!blockTypes[field_id]) continue; // Bỏ qua nếu field_id không hợp lệ

              const blockType = blockTypes[field_id];
              const fieldData: any = {
                form_response_id: id,
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
                  fieldData.value_string = String(value);
                  break;
                case 'InputNumber':
                  fieldData.value_number = Number(value);
                  break;
                case 'CheckBox':
                case 'RangePicker':
                  fieldData.value_array = Array.isArray(value)
                    ? value.map(String)
                    : [String(value)];
                  break;
                case 'Uploader':
                case 'Signature':
                  fieldData.value_json = value;
                  break;
                default:
                  throw new BadRequestException(
                    `Unsupported block type: ${blockType}`,
                  );
              }

              if (existingFieldIds.has(field_id)) {
                // Nếu field đã tồn tại, thêm vào danh sách để cập nhật
                fieldValueResponsesToUpdate.push({
                  where: {
                    form_response_id_field_id: {
                      form_response_id: id,
                      field_id,
                    },
                  },
                  data: fieldData,
                });
              } else {
                // Nếu field chưa tồn tại, thêm vào danh sách để tạo mới
                fieldValueResponsesToCreate.push(fieldData);
              }
            }

            // Cập nhật các field đã tồn tại
            for (const updateData of fieldValueResponsesToUpdate) {
              await prisma.fieldValueResponses.update({
                where: updateData.where,
                data: updateData.data,
              });
            }

            // Tạo các field mới
            if (fieldValueResponsesToCreate.length > 0) {
              await prisma.fieldValueResponses.createMany({
                data: fieldValueResponsesToCreate,
              });
            }
          }

          return updatedFormResponse;
        },
      );

      // Lấy lại tất cả field_value_responses sau khi cập nhật để trả về
      const updatedFieldValues =
        await this.prismaService.fieldValueResponses.findMany({
          where: { form_response_id: id },
        });

      const finalFieldValues = updatedFieldValues.reduce(
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

      return {
        name: updatedResponse.name,
        email: updatedResponse.email,
        phone_number: updatedResponse.phone_number,
        university: updatedResponse.university_id,
        status: updatedResponse.status,
        snapshot_version: updatedResponse.snapshot_version,
        dynamic_fields: finalFieldValues,
      };
    } catch (error) {
      this.logService.error(error);
      throw error;
    }
  }
  async remove(id: number) {
    try {
      if (!id) {
        throw new BadRequestException('Form response not found!');
      }
      const formResponse = await this.prismaService.formResponses.delete({
        where: { id },
      });
      return formResponse;
    } catch (error) {
      this.logService.error(error);
      throw error;
    }
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

  async submitForm(data: CreateFormResponseDto) {
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
      if (form.scope === 'SCHOLARSHIP') {
        const emailExists = await this.prismaService.formResponses.findFirst({
          where: { email, form_id },
        });
        if (emailExists) {
          throw new BadRequestException('Email này đã được đăng ký!');
        }
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
        blocks: Array<{
          id: string;
          label: string;
          blockType: string;
          options?: string[];
        }>;
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
          options: block.options || [],
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

  async getFormResponseUpdate(responseId: number) {
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

      // Lấy snapshot hiện tại của form response
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
        blocks: Array<{
          id: string;
          label: string;
          blockType: string;
          options?: string[];
        }>;
      }>;

      // Lấy cấu trúc mới nhất của form từ formSections
      const formSections = await this.prismaService.formSections.findMany({
        where: { form_id: formResponse.form_id },
        select: {
          json_blocks: true,
          name: true,
          id: true,
        },
      });

      const latestStructure = formSections
        .sort((a, b) => a.id - b.id)
        .map((section) => ({
          name: section.name,
          blocks: this.extractInputBlocks(
            section.json_blocks as FormBlockInstance[],
          ),
        }));

      // Tạo danh sách các trường đã điền từ field_value_responses
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

      // Tạo Map chứa thông tin các trường từ snapshot hiện tại
      const snapshotFieldsMap = new Map<string, any>();
      snapshotStructure.forEach((section) => {
        section.blocks.forEach((block) => {
          snapshotFieldsMap.set(block.id, {
            id: block.id,
            label: block.label,
            blockType: block.blockType,
            options: block.options || [],
          });
        });
      });

      // Tạo Map chứa thông tin các trường từ cấu trúc mới nhất
      const latestFieldsMap = new Map<string, any>();
      latestStructure.forEach((section) => {
        section.blocks.forEach((block) => {
          latestFieldsMap.set(block.id, {
            id: block.id,
            label: block.label,
            blockType: block.blockType,
            options: block.options || [],
          });
        });
      });

      // Kết hợp tất cả các trường: đã điền và mới từ latest structure
      const allFieldsMap = new Map<string, any>();

      // 1. Thêm các trường đã điền (từ field_value_responses)
      Object.keys(fieldValues).forEach((fieldId) => {
        const snapshotBlock = snapshotFieldsMap.get(fieldId);
        const latestBlock = latestFieldsMap.get(fieldId);
        allFieldsMap.set(fieldId, {
          id: fieldId,
          // Ưu tiên label và blockType từ latest structure nếu còn tồn tại, nếu không thì từ snapshot
          label:
            latestBlock?.label || snapshotBlock?.label || `Field ${fieldId}`,
          blockType:
            latestBlock?.blockType || snapshotBlock?.blockType || 'Unknown',
          value: fieldValues[fieldId],
          options: latestBlock?.options || snapshotBlock?.options || [],
        });
      });

      // 2. Thêm các trường mới từ latest structure (nếu chưa có trong fieldValues)
      latestStructure.forEach((section) => {
        section.blocks.forEach((block) => {
          if (!allFieldsMap.has(block.id)) {
            allFieldsMap.set(block.id, {
              id: block.id,
              label: block.label,
              blockType: block.blockType,
              value: null, // Trường mới chưa có giá trị
              options: block.options || [],
            });
          }
        });
      });

      // Nhóm các trường theo section từ latestStructure
      const detailedSections = latestStructure.map((section) => {
        const sectionFields = section.blocks.map((block) => {
          const field = allFieldsMap.get(block.id);
          return {
            id: block.id,
            label: field.label,
            blockType: field.blockType,
            value: field.value,
            options: field.options,
          };
        });

        // Thêm các trường cũ đã điền nhưng không còn trong section này
        const removedFieldsInSection = Array.from(allFieldsMap.values()).filter(
          (field) =>
            !section.blocks.some((block) => block.id === field.id) &&
            snapshotStructure.some((snapSection) =>
              snapSection.blocks.some(
                (snapBlock) =>
                  snapBlock.id === field.id &&
                  snapSection.name === section.name,
              ),
            ),
        );

        return {
          name: section.name,
          fields: [
            ...sectionFields,
            ...removedFieldsInSection.map((field) => ({
              id: field.id,
              label: field.label,
              blockType: field.blockType,
              value: field.value,
              options: field.options,
            })),
          ],
        };
      });

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

  async approveResponse(id: number) {
    try {
      if (!id) {
        throw new BadRequestException('Form response not found!');
      }
      const formResponse = await this.prismaService.formResponses.update({
        where: { id },
        data: { status: ApplicantStatus.CHECKED },
      });
      return formResponse;
    } catch (error) {
      this.logService.error(error);
      throw error;
    }
  }

  async rejectResponse(id: number, rejected_reason: string) {
    try {
      if (!id) {
        throw new BadRequestException('Form response not found!');
      }
      const formResponse = await this.prismaService.formResponses.update({
        where: { id },
        data: { status: ApplicantStatus.REJECTED, rejected_reason },
      });
      return formResponse;
    } catch (error) {
      this.logService.error(error);
      throw error;
    }
  }
  async getFormResponsesWithReviewers(
    formId: string,
    scoringSectionId: number,
    take: number = 10,
    skip: number = 0,
    search?: string,
    universityId?: number,
  ) {
    // Validate inputs
    const formExists = await this.prismaService.form.findUnique({
      where: { id: formId },
    });
    if (!formExists) {
      throw new BadRequestException('Form không tồn tại');
    }

    const sectionExists = await this.prismaService.scoringSections.findUnique({
      where: { id: scoringSectionId },
    });
    if (!sectionExists) {
      throw new BadRequestException('Scoring section không tồn tại');
    }

    if (take < 1 || skip < 0) {
      throw new BadRequestException(
        'take phải lớn hơn 0 và skip không được âm',
      );
    }

    if (universityId && universityId < 1) {
      throw new BadRequestException('universityId phải là một số hợp lệ');
    }

    // Xây dựng điều kiện where
    const whereClause: any = {
      form_id: formId,
      status: {
        notIn: [ApplicantStatus.SUBMITTED, ApplicantStatus.REJECTED],
      },
    };

    // Thêm điều kiện tìm kiếm chung
    if (search) {
      whereClause.OR = [
        {
          name: {
            contains: search,
            mode: 'insensitive',
          },
        },
        {
          email: {
            contains: search,
            mode: 'insensitive',
          },
        },
        {
          phone_number: {
            contains: search,
            mode: 'insensitive',
          },
        },
      ];
    }

    // Thêm điều kiện lọc university_id
    if (universityId) {
      whereClause.university_id = universityId;
    }

    // Truy vấn FormResponses và tổng số bản ghi
    const [formResponses, total] = await Promise.all([
      this.prismaService.formResponses.findMany({
        where: whereClause,
        select: {
          id: true,
          name: true,
          email: true,
          phone_number: true,
          created_at: true,
          status: true,
          updated_at: true,
          university: {
            select: {
              name: true,
            },
          },
          response_assignments: {
            where: {
              scoring_section_id: scoringSectionId,
            },
            select: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  role: { select: { name: true } },
                  avatar_url: true,
                  phone_number: true,
                },
              },
            },
          },
        },
        take,
        skip,
        orderBy: {
          updated_at: 'desc',
        },
      }),
      this.prismaService.formResponses.count({
        where: whereClause,
      }),
    ]);

    const responses = formResponses.map((response) => ({
      id: response.id,
      name: response.name,
      email: response.email,
      phone_number: response.phone_number,
      created_at: response.created_at,
      status: response.status,
      updated_at: response.updated_at,
      university: response.university?.name || '-',
      assignedReviewers: response.response_assignments.map((assignment) => ({
        id: assignment.user.id,
        name: assignment.user.name,
        email: assignment.user.email,
        role: assignment.user.role.name,
        avatar_url: assignment.user.avatar_url,
        phone_number: assignment.user.phone_number,
      })),
    }));

    return {
      responses,
      total,
      current: take,
      pageSize: skip,
    };
  }

  async getAllReviewers() {
    try {
      const reviewers = await this.prismaService.user.findMany({
        where: {
          active: true,
          role: {
            name: {
              notIn: ['SUPER ADMIN'],
            },
            active: true,
          },
        },
        include: {
          role: {
            select: {
              name: true,
              description: true,
            },
          },
        },
      });
      return reviewers.map((reviewer) => ({
        id: reviewer.id,
        name: reviewer.name,
        email: reviewer.email,
        role: reviewer.role.name,
        avatar_url: reviewer.avatar_url,
        description: reviewer.role.description,
      }));
    } catch (error) {
      this.logService.error(error);
      throw error;
    }
  }
}
