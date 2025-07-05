import { UserItem } from "./UserItem";
import { users } from "./UsersList.mock";
import styles from "./UsersList.module.css";

export function UsersList() {
  return (
    <div className={styles.container}>
      {users.map((user) => (
        <UserItem key={user.id} user={user} />
      ))}
    </div>
  );
}
