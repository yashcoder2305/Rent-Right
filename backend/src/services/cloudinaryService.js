// Cloudinary file upload service.
// Uploads PDF, DOCX, and image buffers to Cloudinary and returns the secure_url.

import { v2 as cloudinary } from 'cloudinary';
import streamifier from 'streamifier';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Upload a file buffer to Cloudinary.
 * @param {Buffer} buffer - The file buffer.
 * @param {string} filename - Original filename (used as public_id hint).
 * @param {string} mimetype - MIME type of the file.
 * @returns {Promise<{ secure_url: string, public_id: string }>}
 */
export function uploadToCloudinary(buffer, filename, mimetype) {
  return new Promise((resolve, reject) => {
    // Choose resource_type based on mimetype
    let resourceType = 'raw'; // default for PDFs, DOCX
    if (mimetype.startsWith('image/')) resourceType = 'image';

    const options = {
      resource_type: resourceType,
      public_id: `rentright/leases/${Date.now()}-${filename.replace(/\s+/g, '_')}`,
      overwrite: false,
    };

    // For images, request OCR add-on if available (graceful no-op if not enabled)
    if (resourceType === 'image') {
      options.ocr = 'adv_ocr';
    }

    const uploadStream = cloudinary.uploader.upload_stream(options, (error, result) => {
      if (error) return reject(new Error(`Cloudinary upload failed: ${error.message}`));
      resolve({ secure_url: result.secure_url, public_id: result.public_id, ocr_data: result.info?.ocr });
    });

    streamifier.createReadStream(buffer).pipe(uploadStream);
  });
}

/**
 * Check if Cloudinary is configured.
 */
export function isCloudinaryConfigured() {
  return !!(
    process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET
  );
}
