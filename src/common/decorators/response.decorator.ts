import { SetMetadata } from '@nestjs/common';

export const RES_MESSAGE = 'res_message';
export const ResMessage = (message: string) =>
  SetMetadata('res_message', message);
