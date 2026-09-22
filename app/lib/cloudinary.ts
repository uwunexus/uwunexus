/**
 * Cloudinary image upload utility with client-side compression.
 * Compresses images on the browser using Canvas API before uploading
 * to save storage and reduce upload time.
 */

const CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME!;
const UPLOAD_PRESET = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET!;

/**
 * Compress an image file client-side using Canvas API.
 * @param file - The original image file
 * @param maxWidth - Max width in pixels (default 1200)
 * @param quality - JPEG quality 0-1 (default 0.8)
 */
export async function compressImage(
  file: File,
  maxWidth = 1200,
  quality = 0.8
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);
      const ratio = Math.min(maxWidth / img.width, 1);
      //make HTML 5 Canvas
      const canvas = document.createElement("canvas");
      canvas.width = img.width * ratio;
      canvas.height = img.height * ratio;

      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      canvas.toBlob(
        (blob) => {
          if (blob) resolve(blob);
          else reject(new Error("Canvas compression failed"));
        },
        "image/jpeg",
        quality // 0.8 (80% quality)
      );
    };

    img.onerror = () => reject(new Error("Image load failed"));
    img.src = url;
  });
}

export const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
export const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/jpg"];

/**
 * Validates file size (max 5MB) and type (JPEG, PNG, WebP).
 * Returns null if valid, or a friendly error message string if invalid.
 */
export function validateImageFile(file: File): string | null {
  if (!ALLOWED_IMAGE_TYPES.includes(file.type.toLowerCase())) {
    return "Please select an image file (JPG, PNG, or WebP).";
  }
  if (file.size > MAX_FILE_SIZE) {
    return "Please choose a photo smaller than 5MB.";
  }
  return null;
}

/**
 * Compress and upload an image to Cloudinary.
 * Returns the secure URL of the uploaded image.
 */
export async function uploadToCloudinary(
  file: File,
  folder = "uwunexus"
): Promise<string> {
  if (!CLOUD_NAME || !UPLOAD_PRESET) {
    throw new Error("Cloudinary environment variables not configured. Check .env.local");
  }

  const validationError = validateImageFile(file);
  if (validationError) {
    throw new Error(validationError);
  }

  const compressed = await compressImage(file);
  const originalKB = Math.round(file.size / 1024);
  const compressedKB = Math.round(compressed.size / 1024);
  console.log(`Image compressed: ${originalKB}KB → ${compressedKB}KB`);

  const formData = new FormData();
  formData.append("file", compressed, "upload.jpg");
  formData.append("upload_preset", UPLOAD_PRESET);
  formData.append("folder", folder);

  // [REST API - POST]: 3rd-Party External REST API - Upload compressed image to Cloudinary CDN
  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
    { method: "POST", body: formData }
  );

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error?.message || "Cloudinary upload failed");
  }

  const data = await res.json();
  return data.secure_url as string;
}
