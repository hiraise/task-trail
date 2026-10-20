import Image from "next/image";

import { ICONS } from "@/shared/config/icons";

import { Icon } from "../../ui";
import { SubmitButton } from "../SubmitButton";

import styles from "./EmptyListState.module.css";

interface EmptyListStateProps {
  src: string;
  alt: string;
  text: string;
  btnLabel: string;
  onClick: () => void;
}

export function EmptyListState({ src, alt, text, btnLabel, onClick }: EmptyListStateProps) {
  return (
    <div className={styles.content}>
      <div className={styles.emptyState}>
        <Image src={src} width={160} height={160} alt={alt} />
        <span className="body-reg">{text}</span>
        <SubmitButton variant="text" className={styles.button} onClick={onClick}>
          <Icon as={ICONS.plus} size="24px" inheritColor />
          <span className="btn-font-s">{btnLabel}</span>
        </SubmitButton>
      </div>
    </div>
  );
}
