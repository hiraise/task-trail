"use client";

import { useGetCurrentUser } from "@/application/user/hooks/useGetCurrentUser";
import { Spinner } from "@/presentation/ui/Spinner";

export default function ProfileLayout({ children }: { children: React.ReactNode }) {
  const { data: user, isLoading } = useGetCurrentUser();

  if (isLoading) return <Spinner />;

  if (!user) return null;

  return <>{children}</>;
}
