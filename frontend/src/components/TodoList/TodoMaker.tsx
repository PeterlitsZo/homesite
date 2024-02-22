"use client";

import { Setter, createSignal } from "solid-js";

import { Todo } from "~/domain/todo";
import { addTodo } from "~/requests";

import styles from "./TodoMaker.module.scss";

interface TodoMakerProps {
  setTodoList: Setter<Todo[]>;
}

export function TodoMaker(props: TodoMakerProps) {
  const [content, setContent] = createSignal('');

  const send = async () => {
    if (content() === '') {
      return;
    }

    let todo = await addTodo({
      type: 'text',
      text: content(),
    })
    props.setTodoList(todos => [...todos, todo]);
    setContent('');
  };

  return (
    <div class={styles.TodoMaker}>
      <textarea
        class={styles.Editor}
        value={content()}
        onChange={(e) => setContent(e.target.value)}
      />
      <button class={styles.Sender} onClick={send}>
        Send
      </button>
    </div>
  )
}