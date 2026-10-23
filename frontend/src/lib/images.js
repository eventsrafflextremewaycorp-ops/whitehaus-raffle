export const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
export const IMAGE_MAX_BYTES = 5 * 1024 * 1024;

/** Quick check before uploading; the server checks again. Returns an error message or null. */
export function checkImageFile(file) {
  if (!file) return "Choose an image first.";
  if (!IMAGE_TYPES.includes(file.type)) return "Upload a JPG, PNG or WebP image.";
  if (file.size > IMAGE_MAX_BYTES) return "The image must be 5 MB or smaller.";
  return null;
}
