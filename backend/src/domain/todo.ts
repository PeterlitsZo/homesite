export type TodoContent = TextTodoContent;

interface TextTodoContent {
  type: 'text';
  text: string;
};

export class Todo {
  id: string;
  content: TodoContent;

  constructor(id: string, content: TodoContent) {
    this.id = id;
    this.content = content;
  }
}

export interface TodoRepo {
  getTodo(id: string): Promise<Todo | null>;
  listTodos(): Promise<Todo[]>;
  addTodo(content: TodoContent): Promise<Todo>;
  removeTodo(id: string): Promise<void>;
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
}