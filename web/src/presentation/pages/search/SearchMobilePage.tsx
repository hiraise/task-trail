"use client";

import { useRouter } from "next/navigation";

import styles from "./SearchMobilePage.module.css";

import { Input } from "@/presentation/ui/Input";
import { TEXTS } from "@/shared/locales/texts";
import { SubmitButton } from "@/presentation/widgets/auth/_components";
import { mockProjects } from "@/presentation/widgets/tasks/ProjectsList/ProjectsList.mock";
import { ProjectCard } from "@/presentation/widgets/projects/ProjectCard";

export function SearchMobilePage() {
  const router = useRouter();

  return (
    <div className={styles.container}>
      <div className={styles.search}>
        <Input id="search" placeholder={TEXTS.searchPlaceholder} />
        <SubmitButton $variant="text" className="btn-font-s" onClick={() => router.back()}>
          {TEXTS.cancel}
        </SubmitButton>
      </div>
      <div className={styles.content}>
        {mockProjects.map((project) => (
          <ProjectCard key={project.id} project={project} />
        ))}
      </div>
    </div>
  );
}
