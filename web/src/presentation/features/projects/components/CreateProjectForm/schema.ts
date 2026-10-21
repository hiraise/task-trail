import z from "zod";

export const CreateProjectSchema = z.object({
  name: z
    .string()
    .min(6, "Project name must be at least 6 characters")
    .max(100, "Project name must not exceed 100 characters"),
  description: z.string().max(1000, "Description must not exceed 1000 characters").optional(),
});

export type CreateProjectFormData = z.infer<typeof CreateProjectSchema>;
