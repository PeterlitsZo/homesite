"use client"; // TODO (@PeterlitsZo) Check why we need this.

import { createSignal } from 'solid-js';

import { Todo } from "~/domain/todo";
import { TodoPatch, deleteTodo, patchTodo } from '~/requests';

import { CheckCircle, Circle, Trash2 } from '../Icons';
import IconButton from '../IconButton';

import styles from './TodoItem.module.scss';

interface TodoProps {
  todo: Todo;
  deleteMe: () => void;
}

export function TodoItem(props: TodoProps) {
  const [todo, setTodo] = createSignal(props.todo);
  const [isHover, setHover] = createSignal(false);

  console.log('render TodoItem');

  let status = () => {
    switch (todo().status) {
      case 'DONE':
        return CheckCircle;
      case 'TODO':
        return Circle;
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

  let toggle = async () => {
    let newTodo = await patchTodo(todo().id, togglePatch());
    setTodo(newTodo);
  };

  return (
    <div
      class={styles.TodoItem}
      onPointerOver={() => setHover(true)}
      onPointerLeave={() => setHover(false)}
    >
      <IconButton icon={status()} onClick={toggle} />
      <div class={styles.Content}>
        {todo().content.text}
      </div>
      {/* TODO (@PeterlitsZo) Use library */}
      <div class={`${styles.Toolbar} ${isHover() ? styles.Hover : ''}`}>
        <IconButton icon={Trash2} onClick={props.deleteMe} />
      </div>
    </div>
  )
}