import styles from "./FormSelectionOptions.module.css";

import { ICONS } from "@/infrastructure/config/icons";
import { Icon } from "@/presentation/ui/Icon";

interface FormSelectionButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
}

function FormSelectionButton(props: FormSelectionButtonProps) {
  const handleClick = () => {
    if (props.onClick) props.onClick();
  };

  return (
    <div
      className={styles.container}
      onClick={handleClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && handleClick()}
    >
      {props.children}
      <Icon as={ICONS.downArrow} size="15px" />
    </div>
  );
}

function ContentWrapper({ children }: { children: React.ReactNode }) {
  return <div className={styles.contentWrapper}>{children}</div>;
}

interface PlaceholderProps {
  placeholder: string;
  value?: string;
}
function Placeholder({ value, placeholder }: PlaceholderProps) {
  return <span className={!value ? styles.placeholder : undefined}>{value || placeholder}</span>;
}

interface AssigneeSelectionProps {
  username?: string;
  onClick: () => void;
}

export function AssigneeSelection({ username, onClick }: AssigneeSelectionProps) {
  return (
    <FormSelectionButton onClick={onClick}>
      <ContentWrapper>
        <Icon as={ICONS.profile} size="18px" />
        <Placeholder placeholder="Ответственный" value={username} />
      </ContentWrapper>
    </FormSelectionButton>
  );
}

interface ProjectSelectionProps {
  project?: string;
  onClick: () => void;
}

export function ProjectSelection({ project, onClick }: ProjectSelectionProps) {
  return (
    <FormSelectionButton onClick={onClick}>
      <ContentWrapper>
        <Icon as={ICONS.project} size="18px" />
        <Placeholder placeholder="Проект" value={project} />
      </ContentWrapper>
    </FormSelectionButton>
  );
}
