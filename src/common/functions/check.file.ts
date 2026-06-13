// import { BadRequestException } from '@nestjs/common';
// import { Express } from 'express';

// export const ALLOWED_IMAGE_FORMATS = ['image/jpeg', 'image/png', 'image/webp'];

// export const ALLOWED_VIDEO_FORMATS = [
//   'video/mp4',
//   'video/mkv',
//   'video/webm',
//   'video/avi',
//   'video/x-matroska',
//   'video/x-msvideo',
//   'video/quicktime',
// ];

// export const ALLOWED_FILE_FORMATS = [
//   'application/pdf',
//   'application/zip',
//   'application/x-zip-compressed',
//   'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
//   'application/msword',
//   'application/vnd.ms-excel',
//   'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
// ];

// export const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10 MB
// export const MAX_VIDEO_SIZE = 100 * 1024 * 1024; // 100 MB
// export const MAX_FILE_SIZE = 50 * 1024 * 1024; //  50 MB

// export function validateImage(file: Express.Multer.File): void {
//   if (!ALLOWED_IMAGE_FORMATS.includes(file.mimetype)) {
//     throw new BadRequestException(
//       `Rasm formati noto'g'ri. Ruxsat etilgan: ${ALLOWED_IMAGE_FORMATS.join(', ')}`,
//     );
//   }

//   if (file.size > MAX_IMAGE_SIZE) {
//     throw new BadRequestException(
//       `Rasm juda katta. Max: 10MB, yuklangan: ${(file.size / 1024 / 1024).toFixed(2)}MB`,
//     );
//   }
// }

// export function validateVideo(file: Express.Multer.File): void {
//   if (!ALLOWED_VIDEO_FORMATS.includes(file.mimetype)) {
//     throw new BadRequestException(
//       `Video formati noto'g'ri. Ruxsat etilgan: ${ALLOWED_VIDEO_FORMATS.join(', ')}`,
//     );
//   }

//   if (file.size > MAX_VIDEO_SIZE) {
//     throw new BadRequestException(
//       `Video juda katta. Max: 100MB, yuklangan: ${(file.size / 1024 / 1024).toFixed(2)}MB`,
//     );
//   }
// }

// export function validateFile(file: Express.Multer.File): void {
//   if (!ALLOWED_FILE_FORMATS.includes(file.mimetype)) {
//     throw new BadRequestException(
//       `File formati noto‘g‘ri. Ruxsat etilgan: ${ALLOWED_FILE_FORMATS.join(', ')}`,
//     );
//   }

//   if (file.size > MAX_FILE_SIZE) {
//     throw new BadRequestException(
//       `File juda katta. Max: 50MB, yuklangan: ${(file.size / 1024 / 1024).toFixed(2)}MB`,
//     );
//   }
// }
