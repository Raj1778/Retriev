import { cloudinary } from "../config/cloudinary.config.js";
import streamifier from "streamifier";
export const uploadToCloudinary = (buffer, options = {}) => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        resource_type: "raw", // Use 'raw' for PDF files
        format: "pdf",
        ...options,
      },
      (error, result) => {
        if (error) {
          reject(error);
        } else {
          resolve(result);
        }
      },
    );

    streamifier.createReadStream(buffer).pipe(uploadStream);
  });
};
export const deleteFromCloudinary = (publicId) => {
  return cloudinary.uploader.destroy(publicId, {
    resource_type: "raw",
  });
};
