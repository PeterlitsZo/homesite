import { PrismaClient } from '@prisma/client';

import type { TodoRepo as DomainTodoRepo, TodoContent } from "../domain/todo";
import { Todo } from "../domain/todo";

export class TodoRepo implements DomainTodoRepo {
  client: PrismaClient;

  constructor() {
    this.client = new PrismaClient();
  }

  async addTodo(content: TodoContent): Promise<Todo> {
    const todo = await this.client.todo.create({
      data: {
        content: content.text,
      }
    })
    console.log(todo);

    const result = new Todo();
    // result.content = content;
    return result;
  }
}