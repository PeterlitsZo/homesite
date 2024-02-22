"use client";

import { createResource } from "solid-js";
import { Todo } from "~/domain/todo";
import { listTodos } from "~/requests";
import { TodoItem } from "./TodoItem";

export function TodoList() {
  const [data] = createResource(listTodos);

  console.log(data());

  return (
    <div>
      {data()?.list.map(todo => (
        <TodoItem todo={todo} />
      ))}
    </div>
  );
}

