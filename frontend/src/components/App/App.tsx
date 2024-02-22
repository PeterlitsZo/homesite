import TodoList from "~/components/TodoList";

import styles from "./App.module.scss";

export function App() {
  return (
    <div class={styles.App}>
      <TodoList class={styles.TodoList} />
    </div>
  )
}