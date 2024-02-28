"use client";

import { createEffect, createResource, createSignal, from } from "solid-js";

import { deleteTodo, listTodos, reorderTodo } from "~/requests";
import { Todo } from "~/domain/todo";

import { TodoItem } from "./TodoItem";
import { TodoMaker } from "./TodoMaker";
import styles from "./TodoList.module.scss";
import { DragAimBar } from "./DragAimBar";

interface TodoListProps {
  class?: string;
}

interface TodoListInnerProps {
  class?: string;
  todos?: Todo[];
  refetch: () => void;
}

function TodoListInner(props: TodoListInnerProps) {
  const [dragAimIndex, setDragAimIndex] = createSignal(-1);
  const [draggingIndex, setDraggingIndex] = createSignal(-1);
  const [dragStatus, setDragStatus] = createSignal('NOT_OVER');

  const dropHandler = (i: number) => async (event: DragEvent) => {
    let aimIndex = dragAimIndex();
    const fromIndex = draggingIndex();
    console.log('DROP', aimIndex, fromIndex);
    if (aimIndex === fromIndex || aimIndex === fromIndex + 1 || aimIndex === -1 || fromIndex === -1) {
      // Do nothing...
    } else {
      // TODO (@PeterlitsZo) Looks like that it should be handled by backend.
      if (aimIndex > fromIndex) {
        aimIndex = aimIndex - 1;
      }
      await reorderTodo(props.todos![fromIndex].id, aimIndex);
      await props.refetch();
    }

    setDragAimIndex(-1);

    event.preventDefault();
  };

  const dragStartHandler = (i: number) => (event: DragEvent) => {
    setDraggingIndex(i);
  }

  const dragEndHandler = (i: number) => (event: DragEvent) => {
    setDraggingIndex(-1);
  }

  const dragOverHandler = (i: number) => (e: DragEvent) => {
    setDragStatus('OVER');

    let rect = (e.currentTarget! as HTMLDivElement).getBoundingClientRect();
    if (
      e.clientY < rect.top + rect.height / 4
      || (i === 0 && e.clientY < rect.top + rect.height * 3 / 8)
    ) {
      setDragAimIndex(i);
    } else if (
      e.clientY > rect.bottom - rect.height / 4
      || (i === props.todos!.length - 1 && e.clientY < rect.bottom - rect.height * 3 / 8)
    ) {
      setDragAimIndex(i + 1);
    } else {
      setDragAimIndex(-1);
    }

    e.preventDefault();
  };

  const dragLeaveHandler = (i: number) => (e: DragEvent) => {
    setDragStatus('MAYBE_LEAVE');
    setTimeout(() => {
      if (dragStatus() === 'MAYBE_LEAVE') {
        setDragStatus('NOT_OVER');
        setDragAimIndex(-1);
      }
    }, 50);

    e.preventDefault();
  }

  return (
      <div class={styles.Items}>
        {(props.todos ?? []).map((todo, i, todoList) => {
          const deleteThisTodo = async () => {
            await deleteTodo(todo.id);
            props.refetch();
          };
          return (
            <>
              <DragAimBar active={dragAimIndex() === i && dragStatus() !== 'NOT_OVER'} />
              <div
                draggable="true"
                onDragStart={dragStartHandler(i)}
                onDragEnd={dragEndHandler(i)}
                onDragOver={dragOverHandler(i)}
                onDragLeave={dragLeaveHandler(i)}
                onDrop={dropHandler(i)}
              >
                <TodoItem todo={todo} deleteMe={deleteThisTodo} />
                <div style={{ "padding-left": '1rem' }}>
                  <TodoListInner todos={todo.todos} refetch={props.refetch} />
                </div>
              </div>
              { i === todoList.length - 1
                ? <DragAimBar active={dragAimIndex() === i + 1 && dragStatus() !== 'NOT_OVER'} />
                : null }
            </>
          );
        })}
      </div>
  );
}

export function TodoList(props: TodoListProps) {
  const [data, { refetch }] = createResource(listTodos);
  const [todoList, setTodoList] = createSignal([] as Todo[]);

  createEffect(() => {
    if (data() !== undefined) {
      setTodoList(data()!.list);
    }
  })

  return (
    // TODO (@PeterlitsZo) Use library to concat those class string.
    <div class={`${props.class} ${styles.TodoList}`}>
      <TodoListInner todos={todoList()} class={props.class} refetch={refetch} />
      <TodoMaker setTodoList={setTodoList} />
    </div>
  );
}

