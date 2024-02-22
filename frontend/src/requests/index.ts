import { Todo } from "~/domain/todo";

// TODO (@Peterlits) Use different baseUrl when the environment is different.
const baseUrl: string = 'http://localhost:3000'

export async function listTodos() {
  let resp = await fetch(`${baseUrl}/api/v1/todos`, {
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
  let resp = await fetch(`${baseUrl}/api/v1/todos/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(patch),
  });
  return await resp.json() as Todo;
}