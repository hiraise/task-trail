import { zodResolver } from "@hookform/resolvers/zod";
import clsx from "clsx";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";

import { LABEL_COLORS, type LabelColor } from "@/domain/models/Label";
import type { LabelData } from "@/domain/repositories/LabelRepository";
import { ColorSwatches, FormFieldError, Input, SubmitButton } from "@/presentation/shared";
import { labelNameField } from "@/presentation/shared/forms/fields";
import { errorMessage } from "@/shared/errors/errorMessage";
import { hasErrorCode } from "@/shared/errors/types";
import { labelsTexts } from "@/shared/locales/labels";
import { tasksTexts } from "@/shared/locales/tasks";
import { TEXTS } from "@/shared/locales/texts";

import styles from "./LabelForm.module.css";

const schema = z.object({
  name: labelNameField,
  color: z.enum(LABEL_COLORS as [LabelColor, ...LabelColor[]]),
});

interface LabelFormProps {
  /** The label being edited; none — a new gray label */
  initial?: LabelData;
  /** Throws on failure: a LABEL_NAME_TAKEN error is shown under the name, others by the caller */
  onSubmit: (data: LabelData) => Promise<void>;
  onCancel: () => void;
}

/** The name and color of a project label (artboard E of stage 3): a new one or an edited one. */
export function LabelForm({ initial, onSubmit, onCancel }: LabelFormProps) {
  const {
    control,
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<LabelData>({
    resolver: zodResolver(schema),
    defaultValues: initial ?? { name: "", color: "gray" },
  });

  const submitHandler = async (data: LabelData) => {
    try {
      await onSubmit(data);
    } catch (error) {
      if (hasErrorCode(error, "LABEL_NAME_TAKEN")) {
        setError("name", {
          message: errorMessage(error, labelsTexts.updateLabelFailed),
        });
      }
    }
  };

  return (
    <form
      className={styles.form}
      aria-label={initial ? labelsTexts.editLabel : labelsTexts.newLabel}
      onSubmit={handleSubmit(submitHandler)}
      noValidate
    >
      <label className={styles.field}>
        <span className={clsx("body-reg-2", styles.caption)}>{labelsTexts.labelName}</span>
        <Input type="text" autoComplete="off" autoFocus aria-invalid={!!errors.name} {...register("name")} />
        {errors.name && <FormFieldError>{errors.name.message}</FormFieldError>}
      </label>
      <div className={styles.field}>
        <span className={clsx("body-reg-2", styles.caption)}>{tasksTexts.labelColor}</span>
        <Controller
          control={control}
          name="color"
          render={({ field }) => <ColorSwatches value={field.value} onChange={field.onChange} />}
        />
      </div>
      <div className={styles.buttons}>
        <SubmitButton type="button" variant="secondary" className="btn-font-s" onClick={onCancel}>
          {TEXTS.cancel}
        </SubmitButton>
        <SubmitButton type="submit" className="btn-font-s" disabled={isSubmitting}>
          {TEXTS.save}
        </SubmitButton>
      </div>
    </form>
  );
}
