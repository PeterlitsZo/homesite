"use client"; // TODO (@PeterlitsZo) Check why we need this.

import styles from "./IconButton.module.scss";
import { Dynamic } from "solid-js/web";

interface IconButtonProps {
  icon: () => import("solid-js").JSX.Element;
  onClick?: () => void;
}

export function IconButton(props: IconButtonProps) {
  return (
    <button class={styles.IconButton} onClick={props.onClick}>
      <div class={styles.Icon}>
        <Dynamic component={props.icon} />
      </div>
    </button>
  )
}