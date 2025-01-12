import { cloudinary } from 'src/config/cloudinary.config';

export const CloudinaryProvider = {
  provide: 'Cloudinary',
  useFactory: () => {
    return cloudinary;
  },
};
