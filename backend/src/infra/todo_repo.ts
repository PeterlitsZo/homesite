import type { TodoRepo as DomainTodoRepo, TodoContent, TodoPatch, TodoStatus } from "../domain/todo";
import { Todo } from "../domain/todo";

import { Database } from "./database";
import { Migration } from "./migration";

type RawTodo = {
  id: string;
  status: TodoStatus;
  content: string;
}

function toDomain(todo: RawTodo) {
  return new Todo(
    todo.id,
    todo.status,
    { type: 'text', text: todo.content },
  )
}

export class TodoRepo implements DomainTodoRepo {
  inited = false;

  db: Database;

  constructor(db: Database) {
    this.db = db;
  }

  async getDb() {
    if (this.inited) return await this.db.getInner();

    await new Migration(this.db).migrate();
    this.inited = true;
    return await this.db.getInner();
  }

  async getTodo(id: string): Promise<Todo | null> {
    const db = await this.getDb();

    const result = await db.query<[RawTodo[]]>(
      'SELECT * FROM todo WHERE id = $id',
      { id }
    )
    if (result[0].length === 0) {
      return null;
    }
    return null;
  }

  async listTodos(): Promise<Todo[]> {
    const db = await this.getDb();

    const result = await db.query<[RawTodo[]]>(`
      SELECT * FROM todo WHERE id IN (
        SELECT VALUE todos FROM todo_root WHERE id = todo_root:default
      )[0];
    `)
    return result[0].map(toDomain);
  }

  async addTodo(content: TodoContent): Promise<Todo> {
    const db = await this.getDb();

    const result = await db.query<[null, null, RawTodo]>(`
      LET $created = (CREATE todo SET content = $content, status = $status)[0];
      UPDATE todo_root:default SET todos = array::append(todos, $created.id);
      RETURN $created;
    `, { content: content.text, status: 'TODO' })
    return toDomain(result[2]);
  }

  async removeTodo(id: string) {
    const db = await this.getDb();

    const result = await db.query(`
      DELETE FROM todo WHERE id = $id;
      UPDATE todo_root:default
        SET todos = array::remove(todos, array::find_index(todos, $id));
    `, { id });
    console.log(result);
  }

  async updateTodo(id: string, patch: TodoPatch): Promise<Todo> {
    const db = await this.getDb();

    const result = await db.query<[RawTodo[]]>(`
      UPDATE todo
        SET status = $patch.status
        WHERE id = $id;
    `, { id, patch });
    return toDomain(result[0][0]);
  }
}