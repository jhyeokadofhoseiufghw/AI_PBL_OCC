export const MAX_EVENT_IMAGE_SIZE_BYTES = 4 * 1024 * 1024;
export const EVENT_IMAGE_SIZE_ERROR = "이미지는 4MB 이하여야 합니다.";

export function validateEventImage(file: File) {
  if (!file.type.startsWith("image/"))
    return "이미지 파일만 업로드할 수 있습니다.";
  if (file.size > MAX_EVENT_IMAGE_SIZE_BYTES) return EVENT_IMAGE_SIZE_ERROR;
  return null;
}
