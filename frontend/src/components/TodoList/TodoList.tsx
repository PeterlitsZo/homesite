"use client";

import { createEffect, createResource, createSignal, from } from "solid-js";

import { deleteTodo, listTodos, reorderTodo } from "~/requests";
import { Todo } from "~/domain/todo";

import Tree from "~/components/Tree";

import { TodoItem } from "./TodoItem";
import { TodoMaker } from "./TodoMaker";
import { DragAimBar } from "./DragAimBar";

import styles from "./TodoList.module.scss";
import { Item, ItemId } from "../Tree/TreeItem";

interface TodoListProps {
  class?: string;
}

export function TodoList(props: TodoListProps) {
  const [data, { refetch }] = createResource(listTodos);
  const [todoList, setTodoList] = createSignal([] as Todo[]);
  const [dragAimIndex, setDragAimIndex] = createSignal(-1);
  const [draggingIndex, setDraggingIndex] = createSignal(-1);
  const [dragStatus, setDragStatus] = createSignal('NOT_OVER');

  createEffect(() => {
    if (data() !== undefined) {
      setTodoList(data()!.list);
    }
  })

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
      await reorderTodo(todoList()[fromIndex].id, aimIndex);
      await refetch();
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
      || (i === todoList().length - 1 && e.clientY < rect.bottom - rect.height * 3 / 8)
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
    // TODO (@PeterlitsZo) Use library to concat those class string.
    <div class={`${props.class} ${styles.TodoList}`}>
      <div class={styles.Items}>
        {todoList().map((todo, i, todoList) => {
          const deleteThisTodo = async () => {
            await deleteTodo(todo.id);
            setTodoList(todoList => todoList.filter(t => (t.id !== todo.id)));
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
              </div>
              { i === todoList.length - 1
                ? <DragAimBar active={dragAimIndex() === i + 1 && dragStatus() !== 'NOT_OVER'} />
                : null }
            </>
          );
        })}
      </div>
      <Tree
        data={{
          'foo': { id: 'foo', data: 'foo', children: ['baz'] },
          'foo2': { id: 'foo2', data: 'foo2', children: [] },
          'bar': { id: 'bar', data: 'bar', children: [] },
          'bar2': { id: 'bar2', data: 'bar2', children: [] },
          'baz': { id: 'baz', data: 'baz', children: [] }
        }}
        rootList={['foo', 'bar', 'foo2', 'bar2']}
        render={(item, props) => (
          <div>ITEM: {item.data} PROPS: {JSON.stringify(props)}</div>
        )}
        indentWidth="1.5rem"
      />
      <TodoMaker setTodoList={setTodoList} />
    </div>
  );
}

