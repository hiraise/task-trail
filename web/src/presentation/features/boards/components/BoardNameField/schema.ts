import z from "zod";

import { BOARD_NAME_MAX_LENGTH } from "@/domain/models/Board";
import { boardsTexts } from "@/shared/locales/boards";

// Board name: 1–200 characters (contract, BoardName); the web trims edge spaces itself
export const boardNameSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, boardsTexts.nameRequired)
    .max(BOARD_NAME_MAX_LENGTH, boardsTexts.nameTooLong),
});
