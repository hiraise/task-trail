import { useState, useCallback } from "react";
import { Area } from "react-easy-crop";
import { toast } from "sonner";

import { BaseModal } from "./BaseModal";
import { BaseModalProps } from "./BaseModal.types";
import { ImageCropper } from "../widgets/profile/ImageCropper";
import { DialogButtons } from "../widgets/common/DialogButtons";
import { DeviceBased } from "@/presentation/ui/DeviceBased";
import { useGlobalModalProps } from "@/shared/hooks/useGlobalModalProps";
import { createImageFormData, getCroppedImg as getCroppedImage } from "@/shared/utils/images";
import { errorTexts } from "@/shared/locales/messages";

export default function CropImageModal(props: BaseModalProps<FormData>) {
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
      const croppedBlob = await getCroppedImage(imageSrc, croppedAreaPixels);
      const formData = createImageFormData(croppedBlob, file.name);
      props.onClose(formData);
    } catch (error) {
      console.error("Error cropping image:", error);
      toast.error(errorTexts.somethingWentWrong);
      return;
    }
  };

  return (
    <BaseModal {...props} title="">
      <DeviceBased
        desktop={
          <div style={{ gap: "16px" }}>
            <ImageCropper
              file={file}
              onCropComplete={handleCropComplete}
              onImageLoad={setImageSrc}
            />
            <DialogButtons variant="apply" onClose={handleClose} onApply={handleComplete} />
          </div>
        }
        mobile={
          <div style={{ gap: "24px" }}>
            <ImageCropper
              file={file}
              onCropComplete={handleCropComplete}
              onImageLoad={setImageSrc}
            />
            <DialogButtons variant="apply" onClose={handleClose} onApply={handleComplete} />
          </div>
        }
      />
    </BaseModal>
  );
}
