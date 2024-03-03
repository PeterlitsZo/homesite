"use client";

import { For, JSX, VoidComponent, createContext, createEffect, createResource, createSignal, from, useContext } from "solid-js";

import { deleteTodo, listTodos, reorderTodo } from "~/requests";
import { Todo } from "~/domain/todo";

import { TodoItem } from "./TodoItem";
import { TodoMaker } from "./TodoMaker";
import styles from "./TodoList.module.scss";
import { DragAimBar } from "./DragAimBar";
import { createStore } from "solid-js/store";
import { Properties } from "solid-js/web";

interface TodoListProps {
  class?: string;
}

interface TodoListInnerProps {
  class?: string;
  todos?: Todo[];
  parentId: string;
  indent: number;
  refetch: () => void;
}

type DragState =
  | { type: 'INIT', }
  | { type: 'DRAGGING', fromId: string }
  | { type: 'OK_TO_DROP', fromId: string, aimParentId: string, aimIndex: number }
  ;

type DragStateChanger = {
  startDragging: (fromId: string) => void;
  okToDrop: (aimParentId: string, aimIndex: number) => void;
  notOkToDrop: () => void;
  reset: () => void;
}

type TDragLayerContext = [DragState, DragStateChanger];

const DragLayerContext = createContext<TDragLayerContext>();

function TodoListInner(props: TodoListInnerProps) {
  const [dragAimIndex, setDragAimIndex] = createSignal(-1);
  const [dragInsideIndex, setDragInsideIndex] = createSignal(-1);
  const [draggingIndex, setDraggingIndex] = createSignal(-1);
  const [dragStatus, setDragStatus] = createSignal('NOT_OVER' as 'NOT_OVER' | 'OVER' | 'MAYBE_LEAVE');

  const [state, { startDragging, okToDrop, notOkToDrop, reset }] = useContext(DragLayerContext)!;

  const todos = () => {
    return props.todos ?? [];
  }

  const dropHandler = (i: number) => async (event: DragEvent) => {
    if (state.type !== 'OK_TO_DROP') {
      throw new Error('Assert state is OK_TO_DROP');
    }

    if (state.fromId === state.aimParentId) {
      reset();
      return;
    }

    await reorderTodo(state.fromId, state.aimParentId, state.aimIndex);
    await props.refetch();
    reset();

    event.preventDefault();
  };

  const dragStartHandler = (i: number) => (event: DragEvent) => {
    setDraggingIndex(i);

    startDragging(todos()[i].id);
  }

  const dragEndHandler = (i: number) => (event: DragEvent) => {
    setDraggingIndex(-1);

    reset();
  }

  const dragOverHandler = (i: number) => (e: DragEvent) => {
    setDragStatus('OVER');

    const rect = (e.currentTarget! as HTMLDivElement).getBoundingClientRect();
    const parentId = props.parentId;
    const currentTodo = props.todos![i];
    const currentId = currentTodo.id;
    const hasChildren = currentTodo.children.list.length !== 0;

    function ofTop(ratio: number) {
      return e.clientY < rect.top + rect.height * ratio;
    }
    function ofBottom(ratio: number) {
      return e.clientY > rect.bottom - rect.height * ratio;
    }
    const isFirstChild = i === 0;
    const isLastChild = i === props.todos!.length;

    if (!hasChildren) {
      if (ofTop(1/4) || (isFirstChild && ofTop(5/16))) {
        okToDrop(parentId, i);
      } else if (ofBottom(1/4) || (isLastChild && ofBottom(5/16))) {
        okToDrop(parentId, i + 1);
      } else {
        okToDrop(currentId, 0);
      }
    } else {
      if (ofTop(1/4) || (isFirstChild && ofTop(5/16))) {
        okToDrop(parentId, i);
      } else {
        okToDrop(currentId, 0);
      }
    }

    e.preventDefault();
  };

  const dragLeaveHandler = (i: number) => (e: DragEvent) => {
    setDragStatus('MAYBE_LEAVE');
    setTimeout(() => {
      if (dragStatus() === 'MAYBE_LEAVE') {
        setDragStatus('NOT_OVER');
        notOkToDrop();
      }
    }, 50);

    e.preventDefault();
  }

  return (
    <For each={todos()}>
      {(todo, i) => {
        const deleteThisTodo = async () => {
          await deleteTodo(todo.id);
          props.refetch();
        };

        return (
          <>
            <DragAimBar
              indent={props.indent}
              active={(
                state.type === 'OK_TO_DROP'
                && state.aimParentId === todo.parent_id
                && state.aimIndex === i()
                && dragStatus() !== 'NOT_OVER'
              )}
            />
            <div
              class={styles.Item}
              draggable="true"
              onDragStart={dragStartHandler(i())}
              onDragEnd={dragEndHandler(i())}
              onDragOver={dragOverHandler(i())}
              onDragLeave={dragLeaveHandler(i())}
              onDrop={dropHandler(i())}
            >
              {/*dragInsideIndex() === i() && <div class={styles.DragShadow}/>*/}
              <TodoItem
                todo={todo}
                deleteMe={deleteThisTodo}
                indent={props.indent}
                canDrop={state.type === 'OK_TO_DROP' && state.aimParentId === todo.id && dragStatus() === 'OVER'}
                refetch={props.refetch}
              />
            </div>
            {
              todo.children.expended
                ? (
                  <TodoListInner
                    todos={todo.children.list}
                    refetch={props.refetch}
                    parentId={todo.id}
                    indent={props.indent + 1}
                  />
                )
                : null
            }
            { i() === todos().length - 1
              ? (
                  <DragAimBar
                    indent={props.indent}
                    active={(
                      state.type === 'OK_TO_DROP'
                      && state.aimParentId === todo.parent_id
                      && state.aimIndex === i() + 1
                      && dragStatus() !== 'NOT_OVER'
                    )} />
                )
              : null }
          </>
        );
      }}
    </For>
  );
}

interface DragLayerProps {
  children: JSX.Element;
}

export function DragLayer(props: DragLayerProps) {
  const [state, setState] = createStore({
    type: 'INIT',
  } as DragState);
  const dragLayer = [
    state,
    {
      startDragging(id: string) {
        setState({ type: 'DRAGGING', fromId: id })
      },
      okToDrop(aimParentId: string, aimIndex: number) {
        setState({ type: 'OK_TO_DROP', aimParentId, aimIndex });
      },
      notOkToDrop() {
        setState({ type: 'DRAGGING' });
      },
      reset() { setState({ type: 'INIT' }) },
    }
  ] as TDragLayerContext;

  return (
    <DragLayerContext.Provider value={dragLayer}>
      {props.children}
    </DragLayerContext.Provider>
  )
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
      <div class={styles.Items}>
        <DragLayer>
          <TodoListInner
            todos={todoList()}
            class={props.class}
            refetch={refetch}
            parentId="todo_root:default"
            indent={0}
          />
        </DragLayer>
      </div>
      <TodoMaker setTodoList={setTodoList} />
    </div>
  );
}

