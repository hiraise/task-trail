import { toast } from "sonner";

import { clientLogger } from "@/infrastructure/config/clientLogger";
import { errorTexts } from "../locales/messages";
import { AppError, AppErrorType } from "../errors/types";

interface AsyncOperationProps<T = void> {
  action: () => Promise<T>;
  onError?: (error: Error) => void;
  setIsLoading: (loading: boolean) => void;
  errorMessage?: string;
  showToastOnError?: boolean;
}

/**
 * Helper function to handle async operations with loading state and error handling
 * Follows usecase pattern - all business logic should be inside action callback
 * @param props - Configuration object for the async operation
 * @returns Promise that resolves when operation completes or rejects on error
 */
export const handleAsyncAction = async <T>({
  action,
  errorMessage = errorTexts.somethingWentWrong,
  ...props
}: AsyncOperationProps<T>): Promise<T | undefined> => {
  const { onError, setIsLoading, showToastOnError = true } = props;

  setIsLoading(true);
  try {
    return await action();
  } catch (error) {
    const errorInstance =
      error instanceof Error
        ? error
        : new AppError(AppErrorType.SERVER, errorTexts.somethingWentWrong);
    clientLogger.error("createAsyncHandler error:", { error: errorInstance });
    if (onError) onError(errorInstance);
    if (showToastOnError) toast.error(errorMessage);
  } finally {
    setIsLoading(false);
  }
};
