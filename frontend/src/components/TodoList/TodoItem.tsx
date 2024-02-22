"use client"; // TODO (@PeterlitsZo) Check why we need this.

import { CheckCircle, Circle } from 'lucide-solid';

import { Todo } from "~/domain/todo";

import styles from './TodoItem.module.scss';
import { TodoPatch, patchTodo } from '~/requests';
import { createSignal } from 'solid-js';

interface TodoProps {
  todo: Todo;
}

export function TodoItem(props: TodoProps) {
  const [todo, setTodo] = createSignal(props.todo);

  console.log('render TodoItem');

  let status = () => {
    switch (todo().status) {
      case 'DONE':
        return <CheckCircle width='100%' height='100%' />;
      case 'TODO':
        return <Circle width='100%' height='100%' />;
    }
  };
  let togglePatch = (): TodoPatch => {
    switch (todo().status) {
      case 'DONE':
        return { status: 'TODO' };
      case 'TODO':
        return { status: 'DONE' };
    }
  };

  let toggle = () => async () => {
    let newTodo = await patchTodo(todo().id, togglePatch());
    console.log(newTodo);
    setTodo(() => newTodo);
  };

  return (
    <div class={styles.TodoItem}>
      <button class={styles.StatusButton} onClick={toggle()}>
        <div class={styles.StatusIcon}>
          {status()}
        </div>
      </button>
      <div>
        {todo().content.text}
      </div>
    </div>
  )
}