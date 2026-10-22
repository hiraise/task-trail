import { useCallback, useState } from "react";
import type { Area } from "react-easy-crop";
import { toast } from "sonner";

import { DialogButtons } from "@/presentation/shared";
import { useGlobalModalProps } from "@/presentation/shared/hooks/useGlobalModalProps";
import type { BaseModalProps } from "@/presentation/shared/modals/BaseModal";
import { BaseModal } from "@/presentation/shared/modals/BaseModal/BaseModal";
import { errorTexts } from "@/shared/locales/messages";
import { getCroppedImage } from "@/shared/utils/images";

import { ImageCropper } from "../../components";

import styles from "./CropImageModal.module.css";

export function CropImageModal(props: BaseModalProps<File>) {
  const { file } = useGlobalModalProps<{ file: File }>() ?? {};

  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [imageSrc, setImageSrc] = useState<string | null>(null);

  const handleCropComplete = useCallback((_croppedArea: Area, croppedAreaPixels: Area) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  if (!file) return null;

  const handleClose = () => props.onClose();

  const handleComplete = async () => {
    if (!imageSrc || !croppedAreaPixels) return;

    try {
      const croppedFile = await getCroppedImage(imageSrc, croppedAreaPixels);

      props.onClose(croppedFile);
    } catch {
      toast.error(errorTexts.somethingWentWrong);

      return;
    }
  };

  return (
    <BaseModal {...props} title="">
      <div className={styles.content}>
        <ImageCropper file={file} onCropComplete={handleCropComplete} onImageLoad={setImageSrc} />
        <DialogButtons variant="apply" onClose={handleClose} onApply={handleComplete} />
      </div>
    </BaseModal>
  );
}
