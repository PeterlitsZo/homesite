import { Todo } from "~/domain/todo";

const baseUrl = () => {
  if (import.meta.env.MODE === "production") {
    if (import.meta.env.SSR) {
      return 'http://localhost:8000'; // TODO (@PeterlitsZo) Reading from env variable.
    }
    return import.meta.env.VITE_PROD_API_BASEURL;
  }
  return 'http://localhost:3000';
};

export async function listTodos() {
  let resp = await fetch(`${baseUrl()}/api/v1/todos`, {
    method: 'GET',
  });
  return await resp.json() as {
    list: Todo[];
  };
}

export interface TodoPatch {
  status: 'TODO' | 'DONE';
}

export async function patchTodo(id: string, patch: TodoPatch) {
  let resp = await fetch(`${baseUrl()}/api/v1/todos/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(patch),
  });
  return await resp.json() as Todo;
}

export async function addTodo(todo: Todo['content']) {
  let resp = await fetch(`${baseUrl()}/api/v1/todos`, {
    method: 'POST',
    body: JSON.stringify(todo),
  });
  return await resp.json() as Todo;
}

export async function deleteTodo(id: string) {
  let resp = await fetch(`${baseUrl()}/api/v1/todos/${id}`, {
    method: 'DELETE',
  });
  let result = await resp.json() as Todo;
  console.log(result);
  return result;
}

export async function reorderTodo(id: string, index: number) {
  console.log(id, index);
  await fetch(`${baseUrl()}/api/v1/todos/${id}/:reorder`, {
    method: 'POST',
    body: JSON.stringify({
      index,
      aim_parent_id: 'todo_root:default',
    }),
  });
}
