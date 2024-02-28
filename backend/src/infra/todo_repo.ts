import type { TodoRepo as DomainTodoRepo, TodoContent, TodoPatch, TodoStatus } from "../domain/todo";
import { Todo } from "../domain/todo";

import { Database } from "./database";
import { Migration } from "./migration";

type RawTodo = {
  id: string;
  parent_id: string;
  status: TodoStatus;
  content: string;
  todos: string[];
}

async function toDomain(repo: TodoRepo, todo: RawTodo): Promise<Todo> {
  return new Todo(
    todo.id,
    todo.parent_id,
    todo.status,
    { type: 'text', text: todo.content },
    await repo.listTodosByIds(todo.todos),
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
    return await toDomain(this, result[0][0]);
  }

  async listTodosByIds(ids: string[]): Promise<Todo[]> {
    if (ids.length === 0) {
      return [];
    }

    const db = await this.getDb();

    const result = await db.query<[RawTodo[]]>(`
      SELECT * FROM todo WHERE id IN $ids;
    `, { ids });
    let todoMap = new Map();
    for (let i = 0; i < result.length; i++) {
      todoMap.set(result[0][i].id, result[0][i]);
    }
    return Promise.all(ids.map(id => todoMap.get(id)).map(todo => toDomain(this, todo)));
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
    return Promise.all(result[2].map(id => todoMap.get(id)).map(todo => toDomain(this, todo)));
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
      LET $created = (
        CREATE todo
          SET parent_id = todo_root:default,
              content = $content,
              status = $status,
              todos = []
      )[0];
      UPDATE todo_root:default SET todos = ${stat};
      RETURN $created;
    `, binding)
    return await toDomain(this, result[2]);
  }

  async addExistTodoToParent(id: string, parentId: string, index: number): Promise<void> {
    const db = await this.getDb();
   
    console.log({ parentId, id, index });
    await db.query(`
      UPDATE $parentId
        SET todos = array::insert(todos, $id, $index);
      UPDATE $id
        SET parent_id = $parentId;
    `, { parentId, id, index });
  }

  async removeTodo(id: string) {
    // TODO (@PeterlitsZo) delete softly.
    // TODO (@PeterlitsZo) delete all children.

    const db = await this.getDb();

    await db.query(`
      let $todo = (SELECT * FROM todo WHERE id = $id)[0];
      DELETE FROM todo WHERE id = $id;
      UPDATE $todo.parent_id
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
    return await toDomain(this, result[0][0]);
  }
}