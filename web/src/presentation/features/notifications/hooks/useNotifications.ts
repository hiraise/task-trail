import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import type { Notification } from "@/domain/models/Notification";
import { notificationRepository } from "@/infrastructure/repositories";
import { QUERY_KEYS } from "@/shared/constants/queryKeys";
import { toastError } from "@/shared/errors/errorMessage";
import { errorTexts } from "@/shared/locales/messages";

import { useCheckAuthStatus } from "../../auth/hooks";

// There is no push channel (ADR-0038): the counter is polled once a minute
const UNREAD_POLL_INTERVAL = 60_000;

/** The unread counter of the bell; polled only while the tab is visible (ADR-0038). */
export function useUnreadNotifications() {
  const { isAuthenticated, authInitializing } = useCheckAuthStatus();

  return useQuery<number, Error>({
    queryKey: QUERY_KEYS.notification.unread,
    queryFn: () => notificationRepository.countUnread(),
    refetchInterval: UNREAD_POLL_INTERVAL,
    refetchIntervalInBackground: false,
    enabled: !!isAuthenticated && !authInitializing,
  });
}

/** The newest 100 notifications; fresh on every visit of the page. */
export function useNotifications() {
  return useQuery<Notification[], Error>({
    queryKey: QUERY_KEYS.notification.list,
    queryFn: () => notificationRepository.findAll(),
    staleTime: 0,
  });
}

export function useSetNotificationRead() {
  const queryClient = useQueryClient();

  return useMutation<Notification, Error, { id: string; read: boolean }>({
    mutationFn: ({ id, read }) => notificationRepository.setRead(id, read),
    onSettled: () => queryClient.invalidateQueries({ queryKey: QUERY_KEYS.notification.all }),
    onError: (error) => toastError(error, errorTexts.somethingWentWrong),
  });
}

export function useReadAllNotifications() {
  const queryClient = useQueryClient();

  return useMutation<void, Error, void>({
    mutationFn: () => notificationRepository.readAll(),
    onSettled: () => queryClient.invalidateQueries({ queryKey: QUERY_KEYS.notification.all }),
    onError: (error) => toastError(error, errorTexts.somethingWentWrong),
  });
}
