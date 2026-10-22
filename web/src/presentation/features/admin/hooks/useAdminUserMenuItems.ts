import type { AdminUser } from "@/domain/models/AdminUser";
import { getUserDisplayName } from "@/domain/models/User";
import { useGetCurrentUser } from "@/presentation/shared/hooks";
import { useGlobalModals } from "@/presentation/shared/hooks/useGlobalModals";
import type { MenuItem } from "@/presentation/shared/ui/DropdownMenu";
import { ICONS } from "@/shared/config/icons";
import { adminTexts } from "@/shared/locales/admin";

import { useChangeServiceAdmin } from "./useChangeServiceAdmin";
import { useCreatePasswordResetLink } from "./useCreatePasswordResetLink";
import { useSendPasswordResetMail } from "./useSendPasswordResetMail";
import { useServiceSettings } from "./useServiceSettings";

const texts = adminTexts.users;

/**
 * Действия администратора с пользователем: назначить или снять администратора (с себя — после
 * подтверждения) и сброс пароля. С почтой — письмо и, на случай потерянного ящика, ссылка;
 * без почты — только ссылка (ADR-0017). Себе сброс не нужен: пароль меняют в профиле.
 */
export function useAdminUserMenuItems(user: AdminUser) {
  const { data: currentUser } = useGetCurrentUser();
  const { data: settings } = useServiceSettings();
  const { mutate: changeAdmin } = useChangeServiceAdmin();
  const { mutate: sendResetMail } = useSendPasswordResetMail();
  const { mutateAsync: createResetLink } = useCreatePasswordResetLink();
  const { showConfirm, showPasswordResetLink } = useGlobalModals();

  const isMe = user.id === currentUser?.id;
  const name = getUserDisplayName(user);

  const items: MenuItem[] = [
    {
      label: texts.makeAdmin,
      icon: ICONS.profile,
      color: "var(--icon-tertiary)",
      onClick: () => changeAdmin({ userId: user.id, isAdmin: true }),
      isVisible: !user.isAdmin,
    },
    {
      label: texts.removeAdmin,
      icon: ICONS.profile,
      color: "var(--icon-tertiary)",
      onClick: async () => {
        if (isMe) {
          const confirmed = await showConfirm({
            title: texts.removeSelfTitle,
            description: texts.removeSelfDescription,
            confirmText: texts.removeSelfConfirm,
          });

          if (!confirmed) return;
        }
        changeAdmin({ userId: user.id, isAdmin: false });
      },
      isVisible: user.isAdmin,
    },
    {
      label: texts.sendResetMail,
      icon: ICONS.mail,
      color: "var(--icon-tertiary)",
      onClick: () => sendResetMail({ email: user.email }),
      isVisible: !isMe && !!settings?.mail,
    },
    {
      label: texts.resetLink,
      icon: ICONS.lock,
      color: "var(--icon-tertiary)",
      onClick: async () => {
        try {
          const link = await createResetLink({ userId: user.id });

          showPasswordResetLink({ name, link });
        } catch {
          // Ошибку показал useCreatePasswordResetLink
        }
      },
      isVisible: !isMe,
    },
  ];

  return { menuItems: items.filter((item) => item.isVisible) };
}
