import type { TodoRepo as DomainTodoRepo, TodoContent, TodoPatch, TodoStatus } from "../domain/todo";
import { Todo } from "../domain/todo";

import { Database } from "./database";
import { Migration } from "./migration";

type RawTodo = {
  id: string;
  parent_id: string;
  status: TodoStatus;
  content: string;
  children: {
    list: string[];
    expended: boolean;
  }
}

async function toDomain(repo: TodoRepo, todo: RawTodo): Promise<Todo> {
  return new Todo(
    todo.id,
    todo.parent_id,
    todo.status,
    { type: 'text', text: todo.content },
    {
      list: await repo.listTodosByIds(todo.children.list),
      expended: todo.children.expended,
    }
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
    for (let i = 0; i < result[0].length; i++) {
      todoMap.set(result[0][i].id, result[0][i]);
    }
    return Promise.all(ids.map(id => todoMap.get(id)).map(todo => toDomain(this, todo)));
  }

  async listTodos(): Promise<Todo[]> {
    const db = await this.getDb();

    const result = await db.query<[null, RawTodo[], number[]]>(`
      LET $todos = (SELECT VALUE children FROM todo_root WHERE id = todo_root:default)[0].list;
      SELECT * FROM todo WHERE id IN $todos;
      RETURN $todos;
    `)
    console.log(result);
    let todoMap = new Map();
    for (let i = 0; i < result[1].length; i++) {
      todoMap.set(result[1][i].id, result[1][i]);
    }
    return Promise.all(result[2].map(id => todoMap.get(id)).map(todo => toDomain(this, todo)));
  }

  async addTodo(content: TodoContent, index?: number): Promise<Todo> {
    const db = await this.getDb();

    const appendStat = 'array::append(children.list, $created.id)';
    const insertStat = 'array::insert(children.list, $created.id, $index)';

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
              children = {
                list: [],
                expanded: true,
              }
      )[0];
      UPDATE todo_root:default SET children.list = ${stat};
      RETURN $created;
    `, binding)
    return await toDomain(this, result[2]);
  }

  async addExistTodoToParent(id: string, parentId: string, index: number): Promise<void> {
    const db = await this.getDb();
   
    console.log({ parentId, id, index });
    await db.query(`
      UPDATE $parentId
        SET children.list = array::insert(children.list, $id, $index);
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
        SET children.list = array::remove(children.list, array::find_index(children.list, $id));
    `, { id });
  }

  async getTodoIndexInParent(id: string, parentId: string): Promise<number> {
    const db = await this.getDb();

    const tableName = parentId.split(':')[0];
    let result = await db.query<[RawTodo[]]>(`
      SELECT * FROM type::table($tableName) WHERE id = $parentId;
    `, { parentId, tableName });

    let result2 = -1;
    console.log(parentId, tableName, result);
    result[0][0].children.list.forEach((v, i) => {
      if (v === id) {
        result2 = i;
      }
    })
    return result2;
  }

  async removeTodoOnlyFromParent(id: string, parentId: string, index?: number) {
    const db = await this.getDb();

    if (index !== undefined) {
      await db.query(`
        UPDATE $parentId
          SET children.list = array::remove(children.list, $index)
      `, { parentId, index });
    } else {
      await db.query(`
        UPDATE $parentId
          SET children.list = array::remove(children.list, array::find_index(children.list, $id));
      `, { parentId, id });
    }
  }

  async updateTodo(id: string, patch: TodoPatch): Promise<Todo> {
    const db = await this.getDb();

    const result = await db.query<[RawTodo[]]>(`
      UPDATE todo
        MERGE $patch
        WHERE id = $id;
    `, { id, patch });
    return await toDomain(this, result[0][0]);
  }
}