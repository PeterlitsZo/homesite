export type TodoContent = TextTodoContent;

interface TextTodoContent {
  type: 'text';
  text: string;
};

export type TodoStatus = 'TODO' | 'DONE';

export class Todo {
  id: string;
  status: TodoStatus;
  content: TodoContent;

  constructor(id: string, status: TodoStatus, content: TodoContent) {
    this.id = id;
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
  addTodo(content: TodoContent): Promise<Todo>;
  removeTodo(id: string): Promise<void>;
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
}