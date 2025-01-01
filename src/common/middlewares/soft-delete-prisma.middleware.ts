import { Prisma } from '@prisma/client';

export function softDeleteMiddleware(): Prisma.Middleware {
  return async (params, next) => {
    // Áp dụng xóa mềm thay vì xóa cứng
    if (params.action === 'delete') {
      params.action = 'update';
      params.args.data = { deleted_at: new Date() };
    }

    // Xử lý `deleteMany`
    if (params.action === 'deleteMany') {
      params.action = 'updateMany';
      if (!params.args.data) {
        params.args.data = {};
      }
      params.args.data.deleted_at = new Date();
    }

    // Bỏ qua các bản ghi bị xóa mềm cho findMany hoặc findUnique
    if (['findMany', 'findUnique', 'findFirst'].includes(params.action)) {
      if (!params.args.where) {
        params.args.where = {};
      }
      params.args.where.deleted_at = null;
    }

    return next(params);
  };
}
