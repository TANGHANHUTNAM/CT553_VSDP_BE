import * as multer from 'multer';

export const multerOptions = {
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // Giới hạn file 5MB
  },
};
