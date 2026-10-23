import clsx from "clsx";
import React from "react";

import { FormFieldError, Input } from "@/presentation/shared";
import { projectsTexts } from "@/shared/locales/projects";

import styles from "./ProjectKeyField.module.css";

interface ProjectKeyFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string;
  /** An explanation under the field, hidden while there is an error */
  hint?: string;
}

/**
 * The key field of the project forms (ADR-0026). The field shows the key upper-case, as the server
 * stores it; the value itself is upper-cased by the form schema (projectKeyField).
 */
export const ProjectKeyField = React.forwardRef<HTMLInputElement, ProjectKeyFieldProps>(
  ({ error, hint, id = "projectKey", ...rest }, ref) => (
    <div className={styles.field}>
      <Input
        ref={ref}
        id={id}
        type="text"
        aria-label={projectsTexts.keyLabel}
        aria-invalid={!!error}
        aria-describedby={`${id}-hint`}
        placeholder={projectsTexts.keyPlaceholder}
        autoComplete="off"
        maxLength={10}
        {...rest}
      />
      {error ? (
        <FormFieldError>{error}</FormFieldError>
      ) : (
        hint && (
          <span id={`${id}-hint`} className={clsx("caption-reg", styles.hint)}>
            {hint}
          </span>
        )
      )}
    </div>
  ),
);

ProjectKeyField.displayName = "ProjectKeyField";
