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

  constructor(id: string, parentId: string, status: TodoStatus, content: TodoContent) {
    this.id = id;
    this.parent_id = parentId;
    this.status = status;
    this.content = content;
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

  /** removeTodoOnlyFromParent will only remove it from parent (so parent do not
   * know it any more), but it is still exist. */
  removeTodoOnlyFromParent(id: string, parentId: string): Promise<void>;

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
    let todo = await this.repo.getTodo(id);
    if (todo === null) {
      throw new Error(`Unexpected todo id ${id} - todo not exist`);
    }
    await this.repo.removeTodoOnlyFromParent(todo.id, todo.parent_id);
    await this.repo.addExistTodoToParent(todo.id, aimParentId, index);
    return todo;
  }
}