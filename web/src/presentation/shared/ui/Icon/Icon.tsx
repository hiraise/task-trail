import type { ComponentType, CSSProperties, SVGProps } from "react";

import { logger } from "@/infrastructure/config/clientLogger";

import styles from "./Icon.module.css";

interface IconProps extends Omit<SVGProps<SVGSVGElement>, "color"> {
  as: ComponentType<SVGProps<SVGSVGElement>>;
  color?: string;
  size?: string;
  inheritColor?: boolean;
}

export function Icon({ as: AsComponent, color, size, inheritColor, ...rest }: IconProps) {
  if (!AsComponent) {
    logger.error('Icon component requires "as" prop');

    return null;
  }

  const classNames = [styles.icon, inheritColor ? styles.inheritColor : "", rest.className]
    .filter(Boolean)
    .join(" ");

  const style: CSSProperties = {};

  if (size) {
    style.width = size;
    style.height = size;
  }

  if (color && !inheritColor) {
    style.color = color;
  }

  return <AsComponent className={classNames} style={style} role={"icon"} {...rest} />;
}
