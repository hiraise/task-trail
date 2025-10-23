import { User } from "../user/user.entity";
import { Board } from "./board.entity";

const mockUsers: User[] = [
  {
    id: 1,
    username: "John Doe",
    email: "john.doe@example.com",
    avatarUrl: "https://i.pravatar.cc/150?u=1",
  },
  {
    id: 2,
    username: "Jane Smith",
    email: "jane.smith@example.com",
    avatarUrl: "https://i.pravatar.cc/150?u=2",
  },
  {
    id: 3,
    username: "Peter Jones",
    email: "peter.jones@example.com",
    avatarUrl: "https://i.pravatar.cc/150?u=3",
  },
  {
    id: 4,
    username: "Alice Williams",
    email: "alice.williams@example.com",
    avatarUrl: "https://i.pravatar.cc/150?u=4",
  },
  {
    id: 5,
    username: "Bob Brown",
    email: "bob.brown@example.com",
    avatarUrl: "https://i.pravatar.cc/150?u=5",
  },
  {
    id: 6,
    username: "",
    email: "hh@gmail.com",
  },
  {
    id: 7,
    username: "",
    email: "hh@gmail.com",
  },
  {
    id: 8,
    username: "",
    email: "hh@gmail.com",
  },
  {
    id: 9,
    username: "",
    email: "hh@gmail.com",
  },
];

const mockBoards: Board[] = Array.from({ length: 20 }, (_, i) => ({
  id: i + 1,
  name: `Board ${i + 1}`,
  taskCount: Math.floor(Math.random() * 50),
  members: mockUsers,
}));

mockBoards.push({
  id: 1001,
  name: "Супердлинющее название доски аж в три строчки",
  taskCount: 30,
  members: mockUsers,
});

export { mockBoards };
