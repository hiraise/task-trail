import { useRef } from "react";

type UseSelectImageProps = {
  onSelect: (file: File) => void;
};

export function useSelectImage({ onSelect }: UseSelectImageProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);

  const openFileDialog = () => {
    inputRef.current?.click();
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files[0]) {
      onSelect(files[0]);
      e.target.value = "";
    }
  };

  return {
    inputRef,
    openFileDialog,
    handleChange,
  };
}
