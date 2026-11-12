"use client";

/**
 * Images, made small enough to keep.
 *
 * A photo straight off a phone is several thousand pixels wide and a few
 * megabytes. Twenty of those in a notebook is a notebook that takes a visible
 * pause to open and a .docx too big to email. Nothing in a reading note needs
 * more than about 1600 pixels, so every image is resized to that on the way
 * in, once, rather than being carried around at full size forever.
 *
 * PNGs keep their format because screenshots of text re-encode badly as JPEG
 * and because transparency is worth keeping; everything else becomes JPEG.
 */

const MAX_EDGE = 1600;
const JPEG_QUALITY = 0.85;

export type InsertableImage = {
  src: string;
  width: number;
  height: number;
  alt: string;
};

export async function fileToImage(file: File): Promise<InsertableImage> {
  if (!file.type.startsWith("image/")) {
    throw new Error("That file is not an image.");
  }

  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });

  const image = await new Promise<HTMLImageElement>((resolve, reject) => {
    const element = new Image();
    element.onload = () => resolve(element);
    element.onerror = () => reject(new Error("That image could not be read."));
    element.src = dataUrl;
  });

  const scale = Math.min(1, MAX_EDGE / Math.max(image.naturalWidth, image.naturalHeight));
  const width = Math.round(image.naturalWidth * scale);
  const height = Math.round(image.naturalHeight * scale);
  const alt = file.name.replace(/\.[^.]+$/, "");

  // Already small enough, and in a format Word reads: keep the original bytes
  // rather than re-encoding and losing a little each time.
  const keepAsIs =
    scale === 1 && /^image\/(png|jpeg|gif|bmp)$/.test(file.type);
  if (keepAsIs) return { src: dataUrl, width, height, alt };

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) return { src: dataUrl, width, height, alt };
  context.drawImage(image, 0, 0, width, height);

  const png = file.type === "image/png";
  const src = canvas.toDataURL(
    png ? "image/png" : "image/jpeg",
    png ? undefined : JPEG_QUALITY,
  );
  return { src, width, height, alt };
}

/** The image files on a paste or drop, if there are any. */
export function imageFilesFrom(data: DataTransfer | null): File[] {
  if (!data) return [];
  return Array.from(data.files).filter((file) => file.type.startsWith("image/"));
}
