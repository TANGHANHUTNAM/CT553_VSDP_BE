import { BadRequestException, Global, Injectable } from '@nestjs/common';
import { UploadApiErrorResponse, UploadApiResponse, v2 } from 'cloudinary';
import * as streamifier from 'streamifier';

@Global()
@Injectable()
export class CloudinaryService {
  async uploadFile(
    file: Express.Multer.File,
  ): Promise<UploadApiResponse | UploadApiErrorResponse> {
    try {
      if (!file || !file.buffer) {
        throw new BadRequestException('File là bắt buộc');
      }
      return new Promise((resolve, reject) => {
        const upload = v2.uploader.upload_stream(
          { folder: 'ct553', quality: 'auto', fetch_format: 'auto' },
          (error, result) => {
            if (error) return reject(error);
            resolve(result);
          },
        );
        streamifier.createReadStream(file.buffer).pipe(upload);
      });
    } catch (error) {
      throw error;
    }
  }

  async deleteFile(publicId: string) {
    try {
      return new Promise((resolve, reject) => {
        v2.uploader.destroy(publicId, (error, result) => {
          if (error) return reject(error);
          resolve(result);
        });
      });
    } catch (error) {
      throw error;
    }
  }
}
