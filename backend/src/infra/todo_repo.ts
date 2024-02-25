import postgres from 'postgres';

import type { TodoRepo as DomainTodoRepo, TodoContent, TodoPatch } from "../domain/todo";
import { Todo } from "../domain/todo";

const databaseUrl = (function() {
  const result = Bun.env.DATABASE_URL;
  if (result === undefined) {
    throw new Error('Environment variable DATABASE_URL not defined');
  }
  return result;
})();

const sql = postgres(databaseUrl);

interface RawTodo {
  id: number;
  status: 'TODO' | 'DONE';
  content: string;
}

function todoToDomain(todo: RawTodo) {
  return new Todo(
    JSON.stringify(todo.id),
    todo.status,
    { type: 'text', text: todo.content }
  );
}

export class TodoRepo implements DomainTodoRepo {
  constructor() {}

  async getTodo(id: string): Promise<Todo | null> {
    const todos = await sql`
      SELECT * FROM todos
        WHERE id = ${JSON.parse(id)};
    `;
    if (todos.length === 0) {
      return null;
    }

    return todoToDomain(todos[0] as RawTodo);
  }

  async listTodos(): Promise<Todo[]> {
    const todos = await sql`
      SELECT t.*
        FROM todos t
        JOIN todo_roots tr ON t.id = ANY(tr.todo_ids)
        WHERE tr.name = 'default';
    ` as RawTodo[];

    return todos.map(todo => {
      return todoToDomain(todo);
    });
  }

  async addTodo(content: TodoContent): Promise<Todo> {
    const todos = await sql`
      INSERT INTO todos (content)
        VALUES (${content.text})
        RETURNING *;
    ` as RawTodo[];
    await sql`
      UPDATE todo_roots
        SET todo_ids = ARRAY_APPEND(todo_ids, ${todos[0].id})
        WHERE name = 'default';
    `;

    return todoToDomain(todos[0]);
  }

  async removeTodo(id: string) {
    await sql`
      DELETE FROM todos WHERE id = ${JSON.parse(id)};
    `;
    await sql`
      UPDATE todo_roots
        SET todo_ids = ARRAY_REMOVE(todo_ids, ${JSON.parse(id)})
        WHERE name = 'default';
    `;
  }

  async updateTodo(id: string, patch: TodoPatch): Promise<Todo> {
    let todos = await sql`
      UPDATE todos
        SET status = ${patch.status}
        WHERE id = ${JSON.parse(id)}
        RETURNING *;
    ` as RawTodo[];
    return todoToDomain(todos[0]);
  }
}