"use client";

import Image from "next/image";

import styles from "./SearchDesktopPage.module.css";

import { ICONS } from "@/infrastructure/config/icons";
import { Icon } from "@/presentation/ui/Icon";
import { Input } from "@/presentation/ui/Input";
import { ProjectCard } from "@/presentation/widgets/projects/ProjectCard";
import { TEXTS } from "@/shared/locales/texts";
import { ASSETS } from "@/infrastructure/config/assets";
import { Project } from "@/domain/project/project.entity";

export function SearchDesktopPage() {
  const projects: Project[] = [];

  return (
    <div className={styles.container}>
      <div className={styles.search}>
        <SearchIcon />
        <Input id="search" placeholder={TEXTS.searchPlaceholder} />
      </div>

      <div className={styles.content}>
        {projects.length === 0 ? (
          <EmptyState />
        ) : (
          projects.map((project) => <ProjectCard key={project.id} project={project} />)
        )}
      </div>
    </div>
  );
}

function SearchIcon() {
  return (
    <div className={styles.searchIcon}>
      <Icon as={ICONS.search} size="24px" inheritColor />
    </div>
  );
}

function EmptyState() {
  return (
    <div className={styles.emptyState}>
      <Image src={ASSETS.images.search} width={160} height={160} alt={TEXTS.emptySearch} />
      <p className="bode-reg-2">{TEXTS.emptySearch}</p>
    </div>
  );
}
