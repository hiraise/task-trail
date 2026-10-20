import { useSearch } from "@tanstack/react-router";

import { toast } from "sonner";

import { useResetPassword } from "../../hooks";
import { PasswordResetForm } from "../../components";

export function PasswordResetPage() {
  const { mutateAsync: resetPassword, isPending: isLoading } = useResetPassword();
  const { token } = useSearch({ from: "/auth/reset/" });

  const handleSubmit = async (password: string) => {
    if (!token) {
      toast.error("Что-то пошло не так");

      return;
    }
    await resetPassword({ password, token });
  };

  return <PasswordResetForm onSubmit={handleSubmit} isLoading={isLoading} />;
}
