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
