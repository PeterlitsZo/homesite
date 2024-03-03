"use client"; // TODO (@PeterlitsZo) Check why we need this.

// import { CheckCircle, ChevronDown, Circle, Trash2 } from 'lucide-solid';
import CheckCircle from "../icons/CheckCircle";
import ChevronDown from "../icons/ChevronDown";
import Circle from "../icons/Circle";
import Trash2 from "../icons/Trash2";

import { Todo } from "~/domain/todo";

import styles from './TodoItem.module.scss';
import { TodoPatch, deleteTodo, patchTodo } from '~/requests';
import { createSignal } from 'solid-js';
import IconButton, { IconButtonGroup } from '../IconButton';
import ChevronRight from "../icons/ChevronRight";

interface TodoProps {
  todo: Todo;
  indent: number;
  canDrop: boolean;
  deleteMe: () => void;
  refetch: () => void;
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
  let expended = () => {
    return todo().children.expended ? ChevronDown : ChevronRight;
  };
  let toggleStatusPatch = (): TodoPatch => {
    switch (todo().status) {
      case 'DONE':
        return { status: 'TODO' };
      case 'TODO':
        return { status: 'DONE' };
    }
  };
  let toggleExpandedPatch = (): TodoPatch => {
    return (
      todo().children.expended
        ? { children: { expended: false } }
        : { children: { expended: true } }
    )
  }

  let toggleStatus = async () => {
    let newTodo = await patchTodo(todo().id, toggleStatusPatch());
    setTodo(newTodo);
  };
  let toggleExpanded = async () => {
    let newTodo = await patchTodo(todo().id, toggleExpandedPatch());
    setTodo(newTodo);
    props.refetch();
  };

  return (
    <div
      class={`${styles.TodoItem} ${todo().status === 'DONE' ? styles.Done : ''} ${props.canDrop ? styles.CanDrop : ''}`}
      style={{ "padding-left": `${0.25 + 2 * props.indent}rem` }}
      onPointerOver={() => setHover(true)}
      onPointerLeave={() => setHover(false)}
    >
      <IconButtonGroup>
        {
          todo().children.list.length === 0
            ? <IconButton  />
            : <IconButton icon={expended()} onClick={toggleExpanded} />
        }
        <IconButton icon={status()} onClick={toggleStatus} />
      </IconButtonGroup>
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