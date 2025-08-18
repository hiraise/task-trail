"use client";

import styles from "./FormSelectionOptions.module.css";

import { ICONS } from "@/infrastructure/config/icons";
import { Icon } from "@/presentation/ui/Icon";
import { useTaskModals } from "@/application/tasks/hooks/useTaskModals";

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
  onChange: (username: string) => void;
}

export function AssigneeSelection({ username, onChange }: AssigneeSelectionProps) {
  const { showSelectAssignee } = useTaskModals();

  const handleOnClick = async () => {
    const result = await showSelectAssignee();
    if (result) {
      const selectedUsername = result.username || result.email;
      onChange(selectedUsername);
    }
  };

  return (
    <FormSelectionButton onClick={handleOnClick}>
      <ContentWrapper>
        <Icon as={ICONS.profile} size="18px" />
        <Placeholder placeholder="Ответственный" value={username} />
      </ContentWrapper>
    </FormSelectionButton>
  );
}

interface ProjectSelectionProps {
  project?: string;
  onChange: (project: string) => void;
}

export function ProjectSelection({ project, onChange }: ProjectSelectionProps) {
  const { showSelectProject } = useTaskModals();

  const handleOnClick = async () => {
    const result = await showSelectProject();
    if (result) {
      onChange(result.name);
    }
  };

  return (
    <FormSelectionButton onClick={handleOnClick}>
      <ContentWrapper>
        <Icon as={ICONS.project} size="18px" />
        <Placeholder placeholder="Проект" value={project} />
      </ContentWrapper>
    </FormSelectionButton>
  );
}
