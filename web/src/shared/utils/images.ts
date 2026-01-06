import type { Area } from "react-easy-crop";

/**
 * Crops an image based on the specified area and returns the cropped image as a JPEG File.
 *
 * @param imageSrc - The source URL or data URI of the image to crop.
 * @param crop - An object specifying the cropping area with properties `x`, `y`, `width`, and `height`.
 * @param fileName - Optional filename for the cropped image (defaults to "cropped-avatar.jpg").
 * @returns A promise that resolves to a File containing the cropped image in JPEG format.
 *
 * @throws Will throw an error if the canvas context cannot be obtained or if the canvas is empty.
 */
export async function getCroppedImage(
  imageSrc: string,
  crop: Area,
  fileName = "cropped-avatar.jpg",
): Promise<File> {
  const image = new window.Image();
  image.src = imageSrc;
  await new Promise((res) => (image.onload = res));

  const canvas = document.createElement("canvas");
  canvas.width = crop.width;
  canvas.height = crop.height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Failed to get canvas context");

  ctx.drawImage(image, crop.x, crop.y, crop.width, crop.height, 0, 0, crop.width, crop.height);

  return new Promise<File>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) return reject(new Error("Canvas is empty"));

      // Convert Blob to File
      const file = new File([blob], fileName, {
        type: "image/jpeg",
        lastModified: Date.now(),
      });

      resolve(file);
    }, "image/jpeg");
  });
}

/**
 * Creates a FormData object containing an image file.
 *
 * @param file - The image data as a File or Blob.
 * @param fileName - Optional name to assign to the uploaded file (only used if file is Blob).
 * @param fieldName - The form field name for the file (defaults to `"avatar"`).
 * @returns A FormData instance with the image file appended.
 */
export function createImageFormData(
  file: File | Blob,
  fileName?: string,
  fieldName = "avatar",
): FormData {
  const formData = new FormData();

  if (file instanceof File) {
    // Use existing File object
    formData.append(fieldName, file);
  } else {
    // Convert Blob to File with provided name
    const finalFileName = fileName || "uploaded-image.jpg";
    const fileObj = new File([file], finalFileName, {
      type: file.type || "image/jpeg",
      lastModified: Date.now(),
    });
    formData.append(fieldName, fileObj);
  }

  return formData;
}
