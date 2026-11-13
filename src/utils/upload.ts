import fs from 'fs';
import multer from 'multer';
import path from 'path';
import { v2 as cloudinary } from 'cloudinary';
import { config } from '../config';

const UPLOAD_DIR = path.resolve('uploads');
fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: UPLOAD_DIR,
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`);
  },
});

const ALLOWED = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'video/mp4'];

/** Accepts one `file` field: images or MP4 video, up to 10 MB. */
export const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (ALLOWED.includes(file.mimetype)) cb(null, true);
    else cb(new multer.MulterError('LIMIT_UNEXPECTED_FILE', 'file'));
  },
});

const cloudinaryEnabled = Boolean(config.cloudinary.cloudName && config.cloudinary.apiKey && config.cloudinary.apiSecret);

if (cloudinaryEnabled) {
  cloudinary.config({
    cloud_name: config.cloudinary.cloudName,
    api_key: config.cloudinary.apiKey,
    api_secret: config.cloudinary.apiSecret,
  });
}

/**
 * Returns a public URL for an uploaded file: Cloudinary when configured
 * (the local copy is then removed), otherwise the file served from /uploads.
 */
export async function storeMedia(file: Express.Multer.File): Promise<string> {
  if (!cloudinaryEnabled) {
    return `/uploads/${file.filename}`;
  }
  try {
    const result = await cloudinary.uploader.upload(file.path, { resource_type: 'auto', folder: 'social-media-api' });
    return result.secure_url;
  } finally {
    fs.promises.unlink(file.path).catch(() => undefined);
  }
}
