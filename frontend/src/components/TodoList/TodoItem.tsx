"use client"; // TODO (@PeterlitsZo) Check why we need this.

import { CheckCircle, Circle, Trash2 } from 'lucide-solid';

import { Todo } from "~/domain/todo";

import styles from './TodoItem.module.scss';
import { TodoPatch, deleteTodo, patchTodo } from '~/requests';
import { createSignal } from 'solid-js';
import IconButton from '../IconButton';

interface TodoProps {
  todo: Todo;
  indent: number;
  canDrop: boolean;
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
      class={`${styles.TodoItem} ${todo().status === 'DONE' ? styles.Done : ''} ${props.canDrop ? styles.CanDrop : ''}`}
      style={{ "padding-left": `${props.indent}rem` }}
      onPointerOver={() => setHover(true)}
      onPointerLeave={() => setHover(false)}
    >
      <IconButton icon={status()} onClick={toggle} />
      <div
        class={styles.Content}
      >
        {todo().content.text}
      </div>
      {/* TODO (@PeterlitsZo) Use library */}
      <div class={`${styles.Toolbar} ${isHover() ? styles.Hover : ''}`}>
        <IconButton icon={Trash2} onClick={props.deleteMe} />
      </div>
    </div>
  )
}