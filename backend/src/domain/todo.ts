export type TodoContent = TextTodoContent;

interface TextTodoContent {
  type: 'text';
  text: string;
};

export type TodoStatus = 'TODO' | 'DONE';

export class Todo {
  id: string;
  parent_id: string;
  status: TodoStatus;
  content: TodoContent;
  todos: Todo[];

  constructor(id: string, parentId: string, status: TodoStatus, content: TodoContent, todos: Todo[]) {
    this.id = id;
    this.parent_id = parentId;
    this.status = status;
    this.content = content;
    this.todos = todos;
  }
}

export type TodoPatch = {
  status: TodoStatus;
}

export interface TodoRepo {
  getTodo(id: string): Promise<Todo | null>;

  listTodos(): Promise<Todo[]>;

  addTodo(content: TodoContent, index?: number): Promise<Todo>;

  removeTodo(id: string): Promise<void>;

  getTodoIndexInParent(id: string, parentId: string): Promise<number>;

  /**
   * removeTodoOnlyFromParent will only remove it from parent (so parent do not
   * know it any more), but it is still exist.
   * 
   * If the index is provided, it will try to remove the index directly.
   */
  removeTodoOnlyFromParent(id: string, parentId: string, index?: number): Promise<void>;

  addExistTodoToParent(id: string, parentId: string, index: number): Promise<void>;

  updateTodo(id: string, patch: TodoPatch): Promise<Todo>;
}

export class TodoManager {
  private repo: TodoRepo;

  constructor(repo: TodoRepo) {
    this.repo = repo;
  }

  async getTodo(id: string): Promise<Todo | null> {
    return this.repo.getTodo(id);
  }

  async listTodos(): Promise<Todo[]> {
    return this.repo.listTodos();
  }

  async addTodo(content: TodoContent): Promise<Todo> {
    return this.repo.addTodo(content);
  }

  async removeTodo(id: string) {
    return this.repo.removeTodo(id);
  }

  async updateTodo(id: string, patch: TodoPatch): Promise<Todo> {
    return this.repo.updateTodo(id, patch);
  }

  async reorderTodo(id: string, aimParentId: string, index: number): Promise<Todo> {
    // TODO (@PeterlitsZo) Need to make sure the request is valid.

    let todo = await this.repo.getTodo(id);
    if (todo === null) {
      throw new Error(`Unexpected todo id ${id} - todo not exist`);
    }

    let parentTodoId = aimParentId;
    while (true) {
      if (parentTodoId.split(':')[0] === 'todo_root') {
        break;
      }
      let parentTodo = (await this.repo.getTodo(parentTodoId))!;
      if (parentTodo === null) {
        throw new Error("Unexpected: the aim parent is null? id=" + parentTodoId);
      }
      if (parentTodo.parent_id === id) {
        throw new Error("Unexpected: the aim parent should be the current todo's child");
      }
      if (parentTodo.parent_id.split(':')[0] === 'todo_root') {
        break;
      }
      parentTodoId = parentTodo.parent_id;
    }

    if (todo.parent_id === aimParentId) {
      let originIndex = await this.repo.getTodoIndexInParent(todo.id, aimParentId);
      await this.repo.addExistTodoToParent(todo.id, aimParentId, index);
      if (originIndex > index) {
        await this.repo.removeTodoOnlyFromParent(todo.id, todo.parent_id, originIndex + 1);
      } else {
        await this.repo.removeTodoOnlyFromParent(todo.id, todo.parent_id, originIndex);
      }
    } else {
      await this.repo.addExistTodoToParent(todo.id, aimParentId, index);
      await this.repo.removeTodoOnlyFromParent(todo.id, todo.parent_id);
    }
    return todo;
  }
}