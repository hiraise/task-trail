import { useState } from "react";

import styles from "./DropdownMenu.module.css";

import {
  DropdownMenu,
  DropdownContent,
  DropdownItem,
  DropdownTrigger,
} from "@/presentation/ui/DropdownMenu";
import { MembersData } from "../MembersList/MembersList";
import { ICONS } from "@/infrastructure/config/icons";
import { Icon } from "@/presentation/ui/Icon";
import { users } from "../MembersList/MembersList.mock";

interface DropdownMenuAssigneeProps {
  onSelect: (value: string) => void;
}

export function DropdownMenuAssignee({ onSelect }: DropdownMenuAssigneeProps) {
  const [assinee, setAssignee] = useState<MembersData>();

  const handleSelect = (value: string) => {
    const selectedUser = users.find((user) => user.username === value);
    if (selectedUser) {
      setAssignee(selectedUser);
    }
    onSelect(value);
  };

  return (
    <DropdownMenu onSelect={handleSelect} value={assinee?.username}>
      <DropdownTrigger>
        <div className={styles.trigger}>
          <Icon as={ICONS.profile} size="18px" />
          <span className={assinee ? styles.selected : styles.placeholder}>
            {assinee?.username || "Ответственный"}
          </span>
        </div>
      </DropdownTrigger>

      <DropdownContent>
        {users.map((user) => (
          <DropdownItem key={user.email} value={user.username ?? ""}>
            <span>{user.username}</span>
          </DropdownItem>
        ))}
      </DropdownContent>
    </DropdownMenu>
  );
}
