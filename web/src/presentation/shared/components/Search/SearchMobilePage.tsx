"use client";

import { useRouter } from "next/navigation";

import type { Project } from "@/domain/models/Project";
import { ProjectCard } from "@/presentation/features/projects/components";
import { TEXTS } from "@/shared/locales/texts";

import { Input } from "../../ui";
import { SubmitButton } from "../SubmitButton";

import styles from "./SearchMobilePage.module.css";

export function SearchMobilePage() {
  const router = useRouter();
  const mockProjects: Project[] = [];

  return (
    <div className={styles.container}>
      <div className={styles.search}>
        <Input id="search" placeholder={TEXTS.searchPlaceholder} />
        <SubmitButton variant="text" className="btn-font-s" onClick={() => router.back()}>
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
