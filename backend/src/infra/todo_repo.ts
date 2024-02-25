import type { TodoRepo as DomainTodoRepo, TodoContent, TodoPatch, TodoStatus } from "../domain/todo";
import { Todo } from "../domain/todo";

import { Database } from "./database";
import { Migration } from "./migration";

type RawTodo = {
  id: string;
  parent_id: string;
  status: TodoStatus;
  content: string;
}

function toDomain(todo: RawTodo) {
  return new Todo(
    todo.id,
    todo.parent_id,
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
    return toDomain(result[0][0]);
  }

  async listTodos(): Promise<Todo[]> {
    const db = await this.getDb();

    const result = await db.query<[null, RawTodo[], number[]]>(`
      LET $todos = (SELECT VALUE todos FROM todo_root WHERE id = todo_root:default)[0];
      SELECT * FROM todo WHERE id IN $todos;
      RETURN $todos;
    `)
    let todoMap = new Map();
    for (let i = 0; i < result[1].length; i++) {
      todoMap.set(result[1][i].id, result[1][i]);
    }
    return result[2].map(id => todoMap.get(id)).map(toDomain);
  }

  async addTodo(content: TodoContent, index?: number): Promise<Todo> {
    const db = await this.getDb();

    const appendStat = 'array::append(todos, $created.id)';
    const insertStat = 'array::insert(todos, $created.id, $index)';

    const [stat, binding] = (function () {
      if (index === undefined) {
        return [appendStat, { content: content.text, status: 'TODO' }];
      } else {
        return [insertStat, { content: content.text, status: 'TODO', index }]
      }
    })();
    const result = await db.query<[null, null, RawTodo]>(`
      LET $created = (CREATE todo SET parent_id = todo_root:default, content = $content, status = $status)[0];
      UPDATE todo_root:default SET todos = ${stat};
      RETURN $created;
    `, binding)
    return toDomain(result[2]);
  }

  async addExistTodoToParent(id: string, parentId: string, index: number): Promise<void> {
    const db = await this.getDb();
   
    console.log({ parentId, id, index });
    await db.query(`
      UPDATE $parentId
        SET todos = array::insert(todos, $id, $index)
    `, { parentId, id, index });
  }

  async removeTodo(id: string) {
    const db = await this.getDb();

    await db.query(`
      DELETE FROM todo WHERE id = $id;
      UPDATE todo_root:default
        SET todos = array::remove(todos, array::find_index(todos, $id));
    `, { id });
  }

  async removeTodoOnlyFromParent(id: string, parentId: string) {
    const db = await this.getDb();

    await db.query(`
      UPDATE $parentId
        SET todos = array::remove(todos, array::find_index(todos, $id));
    `, { parentId, id });
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