export type TodoContent = TextTodoContent;

interface TextTodoContent {
  type: 'text';
  text: string;
};

export class Todo {
  // id: string;
  // content: TodoContent;
}

export interface TodoRepo {
  addTodo(content: TodoContent): Promise<Todo>;
}

export class TodoManager {
  private repo: TodoRepo;

  constructor(repo: TodoRepo) {
    this.repo = repo;
  }

  addTodo(content: TodoContent): Todo {
    return this.repo.addTodo(content);
  }
}