import { useEffect, useState } from "react";
import Cropper, { Area, Point } from "react-easy-crop";

import styles from "./ImageCropper.module.css";
import { IconButton } from "@/presentation/ui/IconButton";
import { ICONS } from "@/infrastructure/config/icons";
import { Spinner } from "@/presentation/ui/Spinner";

type AvatarCropperProps = {
  file: File;
  onCropComplete: (formData: FormData) => void;
  onClose: () => void;
};

function readFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

async function getCroppedImg(imageSrc: string, crop: Area): Promise<Blob> {
  const image = new window.Image();
  image.src = imageSrc;
  await new Promise((res) => (image.onload = res));

  const canvas = document.createElement("canvas");
  canvas.width = crop.width;
  canvas.height = crop.height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Failed to get canvas context");

  ctx.drawImage(
    image,
    crop.x,
    crop.y,
    crop.width,
    crop.height,
    0,
    0,
    crop.width,
    crop.height
  );

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) return reject(new Error("Canvas is empty"));
      resolve(blob);
    }, "image/jpeg");
  });
}

export const ImageCropper: React.FC<AvatarCropperProps> = ({
  file,
  onCropComplete,
  onClose,
}) => {
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState<number>(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    readFile(file).then(setImageSrc);
  }, [file]);

  const handleCropComplete = (_croppedArea: Area, croppedAreaPixels: Area) => {
    setCroppedAreaPixels(croppedAreaPixels);
  };

  const handleSave = async () => {
    if (!imageSrc || !croppedAreaPixels) return;
    setLoading(true);
    try {
      const croppedBlob = await getCroppedImg(imageSrc, croppedAreaPixels);
      const formData = new FormData();
      formData.append("file", croppedBlob, file.name);
      onCropComplete(formData);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  if (!imageSrc) return null;

  return (
    <div className={styles["crop-container"]}>
      <div className={styles["crop-view"]}>
        <Cropper
          image={imageSrc}
          crop={crop}
          zoom={zoom}
          aspect={1}
          onCropChange={setCrop}
          onZoomChange={setZoom}
          onCropComplete={handleCropComplete}
        />
      </div>
      <div className={styles["crop-actions"]}>
        <IconButton icon={ICONS.close} variant="ghost" onClick={onClose} />
        {loading ? (
          <Spinner size={16} />
        ) : (
          <IconButton icon={ICONS.check} variant="ghost" onClick={handleSave} />
        )}
      </div>
    </div>
  );
};
