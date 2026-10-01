/** أطول ضلع بعد الضغط: كفاية للتحليل وصغيرة على النت الضعيف */
export const MAX_IMAGE_SIDE = 1400;
const JPEG_QUALITY = 0.82;

export class ImageReadError extends Error {
  constructor() {
    super("الصورة دي مش مدعومة. صوّرها تاني من الكاميرا أو احفظها JPG.");
    this.name = "ImageReadError";
  }
}

/** المقاس الجديد مع الحفاظ على النسبة؛ الصور الصغيرة مابتتكبّرش */
export function fitWithin(width: number, height: number, max = MAX_IMAGE_SIDE): { width: number; height: number } {
  const scale = Math.min(1, max / Math.max(width, height));
  return { width: Math.round(width * scale), height: Math.round(height * scale) };
}

/**
 * بيحوّل أي صورة يقدر المتصفح يقراها (منها HEIC على آيفون) لـ JPEG أطول ضلع فيها 1400px.
 * createImageBitmap بيظبط اتجاه الصورة من الـ EXIF.
 * اللوجو بيبقى PNG أصغر عشان الخلفية الشفافة.
 */
export async function compressImage(
  file: File,
  { maxSide = MAX_IMAGE_SIDE, type = "image/jpeg" }: { maxSide?: number; type?: "image/jpeg" | "image/png" } = {},
): Promise<Blob> {
  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  } catch {
    throw new ImageReadError();
  }
  const size = fitWithin(bitmap.width, bitmap.height, maxSide);
  const canvas = document.createElement("canvas");
  canvas.width = size.width;
  canvas.height = size.height;
  const context = canvas.getContext("2d");
  if (!context) throw new ImageReadError();
  context.drawImage(bitmap, 0, 0, size.width, size.height);
  bitmap.close();

  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, type, JPEG_QUALITY));
  if (!blob) throw new ImageReadError();
  return blob;
}
