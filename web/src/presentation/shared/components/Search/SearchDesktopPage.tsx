"use client";

import Image from "next/image";

import type { ProjectResponseDto } from "@/application/dto/ProjectResponseDto";
import { ProjectCard } from "@/presentation/features/projects/components/ProjectCard";
import { ASSETS } from "@/shared/config/assets";
import { ICONS } from "@/shared/config/icons";
import { TEXTS } from "@/shared/locales/texts";

import { Icon, Input } from "../../ui";

import styles from "./SearchDesktopPage.module.css";

export function SearchDesktopPage() {
  const projects: ProjectResponseDto[] = [];

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
