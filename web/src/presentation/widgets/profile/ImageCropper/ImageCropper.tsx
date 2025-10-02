import { useEffect, useState } from "react";
import Cropper, { Area, Point } from "react-easy-crop";

import styles from "./ImageCropper.module.css";

type AvatarCropperProps = {
  file: File;
  onCropComplete: (croppedArea: Area, croppedAreaPixels: Area) => void;
  onImageLoad?: (imageSrc: string) => void;
};

function readFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export const ImageCropper: React.FC<AvatarCropperProps> = ({
  file,
  onCropComplete,
  onImageLoad,
}) => {
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState<number>(1);

  useEffect(() => {
    readFile(file).then((src) => {
      setImageSrc(src);
      onImageLoad?.(src);
    });
  }, [file, onImageLoad]);

  if (!imageSrc) return null;

  return (
    <div className={styles.cropContainer}>
      <Cropper
        image={imageSrc}
        crop={crop}
        zoom={zoom}
        aspect={1}
        onCropChange={setCrop}
        onZoomChange={setZoom}
        onCropComplete={onCropComplete}
      />
    </div>
  );
};
