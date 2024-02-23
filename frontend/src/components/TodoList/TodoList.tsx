"use client";

import { createEffect, createResource, createSignal } from "solid-js";

import { deleteTodo, listTodos } from "~/requests";
import { Todo } from "~/domain/todo";

import { TodoItem } from "./TodoItem";
import { TodoMaker } from "./TodoMaker";
import styles from "./TodoList.module.scss";

interface TodoListProps {
  class?: string;
}

export function TodoList(props: TodoListProps) {
  const [data] = createResource(listTodos);
  const [todoList, setTodoList] = createSignal([] as Todo[]);

  createEffect(() => {
    if (data() !== undefined) {
      setTodoList(data()!.list);
    }
  })

  return (
    // TODO (@PeterlitsZo) Use library to concat those class string.
    <div class={`${props.class} ${styles.TodoList}`}>
      <div class={styles.Items}>
        {todoList().map(todo => {
          const deleteThisTodo = async () => {
            await deleteTodo(todo.id);
            setTodoList(todoList => todoList.filter(t => (t.id !== todo.id)));
          };
          return (
            <TodoItem todo={todo} deleteMe={deleteThisTodo} />
          );
        })}
      </div>
      <TodoMaker setTodoList={setTodoList} />
    </div>
  );
}

