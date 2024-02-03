"use client";

import { createSignal } from "solid-js";
import styles from "./Counter.module.scss";

export default function Counter() {
  const [count, setCount] = createSignal(0);
  return (
    <button class={styles.increment} onClick={() => setCount(count() + 1)}>
      Clicks: {count()}
    </button>
  );
}
