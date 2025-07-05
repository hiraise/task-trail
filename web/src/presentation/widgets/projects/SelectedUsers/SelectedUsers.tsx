import { useState } from "react";

import styles from "./SelectedUsers.module.css";
import { UserData } from "../AddParticipantForm/AddParticipantForm";
import { SelectedUserEmail } from "../SelectedUserEmail";
import { participantsTexts } from "../AddParticipantForm/addParticipants";

const selectedUsers: UserData[] = Array.from({ length: 20 }, (_, i) => ({
  email: `ilkat@gmail.com${i}`,
}));

export function SelectedUsers() {
  const [users, setUsers] = useState<UserData[]>(selectedUsers);
  const handleDeleteUser = (user: UserData) => {
    setUsers((prevUsers) => prevUsers.filter((u) => u.email !== user.email));
  };

  if (users.length === 0) return null;
  return (
    <div className={styles.container}>
      <span className={styles.infoMessage}>
        {participantsTexts.infoMessage}
      </span>
      <div className={styles.selectedUsers}>
        {users.map((user, index) => (
          <SelectedUserEmail
            key={index}
            email={user.email}
            onClick={handleDeleteUser}
          />
        ))}
      </div>
    </div>
  );
}
