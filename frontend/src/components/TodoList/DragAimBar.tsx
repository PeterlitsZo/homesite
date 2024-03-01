"use client"; // TODO (@PeterlitsZo) Check why we need this.

import styles from './DragAimBar.module.scss';

interface DragAimBarProps {
  active: boolean;
  indent: number;
}

export function DragAimBar(props: DragAimBarProps) {
  return (
    <div class={styles.DragAimBar}
        style={{ 'padding-left': `${props.indent}rem` }}
    >
      <div
        class={`${styles.Inner} ${props.active ? styles.Active : ''}`}
      />
    </div>
  );
}