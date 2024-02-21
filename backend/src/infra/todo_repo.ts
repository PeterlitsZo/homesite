import { PrismaClient, Todo as PrismaTodo } from '@prisma/client';

import type { TodoRepo as DomainTodoRepo, TodoContent, TodoPatch } from "../domain/todo";
import { Todo } from "../domain/todo";

function todoToDomain(todo: PrismaTodo) {
  return new Todo(
    JSON.stringify(todo.id),
    todo.status,
    { type: 'text', text: todo.content }
  );
}

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

    return todoToDomain(todo);
  }

  async listTodos(): Promise<Todo[]> {
    const todos = await this.client.todo.findMany();
    return todos.map(todo => {
      return todoToDomain(todo);
    });
  }

  async addTodo(content: TodoContent): Promise<Todo> {
    const todo = await this.client.todo.create({
      data: {
        content: content.text,
      }
    })
    return todoToDomain(todo);
  }

  async removeTodo(id: string) {
    await this.client.todo.delete({ where: { id: JSON.parse(id) }});
  }

  async updateTodo(id: string, patch: TodoPatch): Promise<Todo> {
    let todo = await this.client.todo.update({
      data: patch,
      where: { id: JSON.parse(id) },
    });
    return todoToDomain(todo);
  }
}