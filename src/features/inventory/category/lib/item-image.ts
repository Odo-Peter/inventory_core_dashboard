export const MAX_IMAGE_BYTES = 5 * 1024 * 1024; // match the backend MAX_IMAGE_BYTES

export function validateImageFile(file: File): string | null {
  if (!file.type.startsWith('image/')) return 'Choose an image file';
  if (file.size > MAX_IMAGE_BYTES) {
    return `Image must be ${Math.round(MAX_IMAGE_BYTES / 1024 / 1024)} MB or smaller`;
  }
  return null;
}

const IMAGE_ERRORS: Record<string, string> = {
  image_changed: 'The image was changed by someone else. Reload and try again.',
  image_storage_not_configured: 'Image storage is not set up yet. Contact your administrator.',
  image_storage_unavailable: 'Image storage is unavailable right now. Try again shortly.',
};

export function getImageErrorMessage(err: unknown): string {
  const e = err as { response?: { status?: number; data?: { code?: string } } };
  const code = e?.response?.data?.code;
  if (code && IMAGE_ERRORS[code]) return IMAGE_ERRORS[code];
  if (e?.response?.status === 413) return 'Image is too large.';
  return err instanceof Error ? err.message : 'Could not update the image';
}
