"use client"; // TODO (@PeterlitsZo) Check why we need this.

import { LucideProps } from "lucide-solid/dist/types/types";

import styles from "./IconButton.module.scss";
import { Dynamic } from "solid-js/web";

interface IconButtonProps {
  icon: (props: LucideProps) => import("solid-js").JSX.Element;
  onClick?: () => void;
}

export function IconButton(props: IconButtonProps) {
  return (
    <button class={styles.IconButton} onClick={props.onClick}>
      <div class={styles.Icon}>
        <Dynamic component={props.icon} width='100%' height='100%' />
      </div>
    </button>
  )
}