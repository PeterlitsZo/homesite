import { JSX } from "solid-js";

import styles from './IconButtonGroup.module.scss';

interface IconButtonGroup {
  children: JSX.Element;
}

export function IconButtonGroup(props: IconButtonGroup) {
  return (
    <div class={styles.IconButtonGroup}>
      {props.children}
    </div>
  )
}