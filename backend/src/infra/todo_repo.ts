import { PrismaClient } from '@prisma/client';

import type { TodoRepo as DomainTodoRepo, TodoContent } from "../domain/todo";
import { Todo } from "../domain/todo";

export class TodoRepo implements DomainTodoRepo {
  client: PrismaClient;

  constructor() {
    this.client = new PrismaClient();
  }

  async getTodo(id: string): Promise<Todo | null> {
    const todo = await this.client.todo.findFirst({ where: { id: JSON.parse(id) } });
    if (!todo) {
      return null;
    }

    return new Todo(JSON.stringify(todo.id), { type: 'text', text: todo.content });
  }

  async listTodos(): Promise<Todo[]> {
    const todos = await this.client.todo.findMany();
    return todos.map(todo => {
      return new Todo(JSON.stringify(todo.id), { type: 'text', text: todo.content });
    });
  }

  async addTodo(content: TodoContent): Promise<Todo> {
    const todo = await this.client.todo.create({
      data: {
        content: content.text,
      }
    })
    return new Todo(JSON.stringify(todo.id), { type: 'text', text: todo.content });
  }

  async removeTodo(id: string) {
    await this.client.todo.delete({ where: { id: JSON.parse(id) }});
  }
}