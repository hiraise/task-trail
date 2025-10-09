import { useEffect, useRef, useState } from "react";
import clsx from "clsx";

import styles from "./ProjectInfoMobile.module.css";

import { Project } from "@/domain/project/project.entity";
import { TEXTS } from "@/shared/locales/texts";

interface ProjectInfoMobileProps {
  project: Project;
  owner: string;
}

export function ProjectInfoMobile({ project, owner }: ProjectInfoMobileProps) {
  const [showButton, setShowButton] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const textRef = useRef<HTMLParagraphElement>(null);

  const checkLines = () => {
    const el = textRef.current;
    if (!el) return;

    const lineHeight = parseFloat(getComputedStyle(el).lineHeight);
    const lines = Math.floor(el.scrollHeight / lineHeight);
    setShowButton(lines > 3);
  };

  useEffect(() => {
    const el = textRef.current;
    if (!el) return;

    const resizeObserver = new ResizeObserver(checkLines);
    resizeObserver.observe(el);
    return () => resizeObserver.disconnect();
  }, [isExpanded]);

  return (
    <div className={styles.titleWrapper}>
      <h2>{project.name}</h2>
      <div className={styles.description}>
        <p ref={textRef} className={clsx(!isExpanded && "multiline-3", "body-reg-2")}>
          {project.description}
        </p>
        {showButton && (
          <button className="btn-font-s" onClick={() => setIsExpanded(!isExpanded)}>
            {isExpanded ? TEXTS.hide : TEXTS.showMore}
          </button>
        )}
      </div>
      <p className={clsx(styles.owner, "body-reg-2")}>
        {owner}&nbsp; | &nbsp;{project.createdAt}
      </p>
    </div>
  );
}
