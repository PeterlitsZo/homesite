"use client"; // TODO (@PeterlitsZo) Check why we need this.

import { JSX } from "solid-js";

import styles from "./IconButton.module.scss";
import { Dynamic } from "solid-js/web";

interface IconButtonProps {
  icon?: () => JSX.Element;
  class?: string;
  onClick?: () => void;
}

export function IconButton(props: IconButtonProps) {
  return (
    <button class={`${styles.IconButton} ${props.onClick ? styles.CanClick : ''}`} onClick={props.onClick}>
      <div class={`${styles.Icon} ${props.class}`}>
        {
          props.icon
            ? <Dynamic component={props.icon} />
            : null
        }
      </div>
    </button>
  )
}