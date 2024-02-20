import { Hono } from 'hono'
import { Database } from 'bun:sqlite';
import { TodoManager } from './domain/todo';
import { TodoRepo } from './infra/todo_repo';

const app = new Hono();

const todoRepo = new TodoRepo();
const todoManager = new TodoManager(todoRepo);

app.get('/api/v1/todos', (c) => {
  todoManager.addTodo({ type: 'text', text: '待办 1' });
  return c.text('Hello Hono!');
});

export default app
