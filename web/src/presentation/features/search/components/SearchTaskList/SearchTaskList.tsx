import { Link } from "@tanstack/react-router";

import { isTaskArchived, type Task } from "@/domain/models/Task";
import { ProjectTask } from "@/presentation/shared/components/domainComponents";
import { useProjectMembers } from "@/presentation/shared/hooks";

import styles from "./SearchTaskList.module.css";

interface SearchTaskListProps {
  tasks: Task[];
  highlight: string;
}

/** Found tasks: key, name with the query highlighted, assignee avatar; a row opens the task. */
export function SearchTaskList({ tasks, highlight }: SearchTaskListProps) {
  return (
    <ul role="list" className={styles.list}>
      {tasks.map((task) => (
        <li key={task.id}>
          <SearchTaskRow task={task} highlight={highlight} />
        </li>
      ))}
    </ul>
  );
}

function SearchTaskRow({ task, highlight }: { task: Task; highlight: string }) {
  // Tasks come from several projects; the assignee is a member of the task's project.
  // Members are cached per project, so a project is requested once.
  const { data: members = [] } = useProjectMembers(task.projectId);

  return (
    <Link to="/tasks/$taskId" params={{ taskId: task.id }}>
      <ProjectTask
        taskKey={task.key}
        title={task.name}
        highlight={highlight}
        archived={isTaskArchived(task)}
        assignee={members.find((member) => member.id === task.assigneeId)}
      />
    </Link>
  );
}
