import { Area } from "react-easy-crop";

/**
 * Crops an image based on the specified area and returns the cropped image as a JPEG Blob.
 *
 * @param imageSrc - The source URL or data URI of the image to crop.
 * @param crop - An object specifying the cropping area with properties `x`, `y`, `width`, and `height`.
 * @returns A promise that resolves to a Blob containing the cropped image in JPEG format.
 *
 * @throws Will throw an error if the canvas context cannot be obtained or if the canvas is empty.
 */
export async function getCroppedImg(imageSrc: string, crop: Area): Promise<Blob> {
  const image = new window.Image();
  image.src = imageSrc;
  await new Promise((res) => (image.onload = res));

  const canvas = document.createElement("canvas");
  canvas.width = crop.width;
  canvas.height = crop.height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Failed to get canvas context");

  ctx.drawImage(image, crop.x, crop.y, crop.width, crop.height, 0, 0, crop.width, crop.height);

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) return reject(new Error("Canvas is empty"));
      resolve(blob);
    }, "image/jpeg");
  });
}

/**
 * Creates a FormData object containing an image file.
 *
 * @param blob - The image data as a Blob.
 * @param fileName - The name to assign to the uploaded file.
 * @param fieldName - The form field name for the file (defaults to `"file"`).
 * @returns A FormData instance with the image file appended.
 */
export function createImageFormData(blob: Blob, fileName: string, fieldName = "file"): FormData {
  const formData = new FormData();
  formData.append(fieldName, blob, fileName);
  return formData;
}
