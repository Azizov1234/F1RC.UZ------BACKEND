import {
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { MulterOptions } from '@nestjs/platform-express/multer/interfaces/multer-options.interface';
import { diskStorage } from 'multer';
import { existsSync, mkdirSync } from 'fs';
import { unlink } from 'fs/promises';
import { extname, resolve } from 'path';
import { randomUUID } from 'crypto';

const UPLOAD_ROOT = resolve(process.cwd(), 'uploads');
const DEFAULT_MAX_IMAGE_SIZE_MB = 5;

const ALLOWED_IMAGE_MIME_TYPES = new Set([
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
]);

const ALLOWED_IMAGE_EXTENSIONS = new Set([
  '.jpg',
  '.jpeg',
  '.png',
  '.webp',
]);

type ImageUploadOptions = {
  folder: string;
  prefix: string;
  maxSizeMb?: number;
};

type ImageFileInput = {
  originalname: string;
  mimetype: string;
};

function validateSafeName(value: string, fieldName: string): void {
  if (!/^[a-zA-Z0-9_-]+$/.test(value)) {
    throw new BadRequestException(`${fieldName} is invalid`);
  }
}

function megabytesToBytes(sizeMb: number): number {
  return sizeMb * 1024 * 1024;
}

function ensureUploadFolder(folder: string): string {
  validateSafeName(folder, 'Upload folder');

  const uploadPath = resolve(UPLOAD_ROOT, folder);

  if (!uploadPath.startsWith(UPLOAD_ROOT)) {
    throw new BadRequestException('Upload path is invalid');
  }

  if (!existsSync(uploadPath)) {
    mkdirSync(uploadPath, { recursive: true });
  }

  return uploadPath;
}

function validateImageFile(file: ImageFileInput): void {
  const fileExt = extname(file.originalname).toLowerCase();

  if (!ALLOWED_IMAGE_MIME_TYPES.has(file.mimetype)) {
    throw new BadRequestException(
      'Faqat JPG, JPEG, PNG yoki WEBP rasm yuklash mumkin',
    );
  }

  if (!ALLOWED_IMAGE_EXTENSIONS.has(fileExt)) {
    throw new BadRequestException(
      'Rasm formati faqat .jpg, .jpeg, .png yoki .webp bo‘lishi kerak',
    );
  }
}

export function getImageUploadOptions(
  options: ImageUploadOptions,
): MulterOptions {
  const { folder, prefix, maxSizeMb = DEFAULT_MAX_IMAGE_SIZE_MB } = options;

  validateSafeName(prefix, 'File prefix');

  const uploadPath = ensureUploadFolder(folder);
  const maxSizeBytes = megabytesToBytes(maxSizeMb);

  return {
    storage: diskStorage({
      destination: (_req, _file, cb) => {
        cb(null, uploadPath);
      },

      filename: (_req, file, cb) => {
        const fileExt = extname(file.originalname).toLowerCase();
        const fileName = `${prefix}-${Date.now()}-${randomUUID()}${fileExt}`;

        cb(null, fileName);
      },
    }),

    fileFilter: (_req, file, cb) => {
      try {
        validateImageFile(file);
        cb(null, true);
      } catch (error) {
        cb(error as Error, false);
      }
    },

    limits: {
      fileSize: maxSizeBytes,
    },
  };
}

export function getUploadedFileUrl(
  file: Express.Multer.File | undefined,
  folder: string,
): string | undefined {
  if (!file) return undefined;

  validateSafeName(folder, 'Upload folder');

  return `/uploads/${folder}/${file.filename}`;
}

function resolveUploadedFilePath(filePath?: string | null): string | null {
  if (!filePath) return null;

  const cleanPath = filePath.replace(/^[/\\]+/, '');
  const fullPath = resolve(process.cwd(), cleanPath);

  if (!fullPath.startsWith(UPLOAD_ROOT)) {
    throw new BadRequestException('File path is invalid');
  }

  return fullPath;
}

export async function deleteFile(filePath?: string | null): Promise<void> {
  const fullPath = resolveUploadedFilePath(filePath);

  if (!fullPath) return;

  try {
    if (!existsSync(fullPath)) return;

    await unlink(fullPath);
  } catch {
    throw new InternalServerErrorException('File delete failed');
  }
}

export async function deleteUploadedFile(
  file?: Express.Multer.File | null,
): Promise<void> {
  await deleteFile(file?.path);
}

export async function deleteFiles(
  filePaths: Array<string | null | undefined>,
): Promise<void> {
  await Promise.all(filePaths.map((filePath) => deleteFile(filePath)));
}

export function getProfileAvatarUploadOptions(): MulterOptions {
  return getImageUploadOptions({
    folder: 'profiles',
    prefix: 'avatar',
    maxSizeMb: 2,
  });
}