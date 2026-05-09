export const IMAGE_UPLOAD_MAX_BYTES = 8 * 1024 * 1024;
export const ALLOWED_IMAGE_MIME_TYPES = new Set(['image/jpeg', 'image/jpg', 'image/png', 'image/webp']);

export const validateImageFile = (file) => {
  if (!file) {
    return { ok: false, message: 'Please select an image file.' };
  }

  if (!ALLOWED_IMAGE_MIME_TYPES.has(String(file.type || '').toLowerCase())) {
    return { ok: false, message: 'Unsupported image type. Use JPG, PNG, or WEBP.' };
  }

  if (Number(file.size || 0) > IMAGE_UPLOAD_MAX_BYTES) {
    return { ok: false, message: 'Image is too large. Maximum size is 8MB.' };
  }

  return { ok: true };
};

export const readFileAsDataUrl = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(typeof reader.result === 'string' ? reader.result : '');
    reader.onerror = () => reject(new Error('Failed to read image file.'));
    reader.readAsDataURL(file);
  });
