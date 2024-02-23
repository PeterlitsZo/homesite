"use client";

import { LucideProps } from "lucide-solid/dist/types/types";

import styles from "./IconButton.module.scss";

// TODO (@PeterlitsZo) Check why we need this.

interface IconButtonProps {
  icon: (props: LucideProps) => import("solid-js").JSX.Element;
  onClick?: () => void;
}

export function IconButton(props: IconButtonProps) {
  return (
    <button class={styles.IconButton} onClick={props.onClick}>
      <div class={styles.Icon}>
        <props.icon width='100%' height='100%' />
      </div>
    </button>
  )
}