import { Request, Response, NextFunction } from 'express';
import cloudinary from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.API_KEY,
  api_secret: process.env.API_SECRET
});

export const uploadMedia = (req: Request, res: Response, next: NextFunction) => {
  if (!req.file) {
    return next();
  }

  cloudinary.v2.uploader.upload(req.file.path, (error, result) => {
    if (error || !result) {
      console.error("Cloudinary upload error:", error);
      return res.status(500).json({ message: "Failed to upload media" });
    }

    req.body.media = result.secure_url;
    next();
  });
};
