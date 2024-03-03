import { Hono, Context } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { Schema, ZodError, z } from 'zod';

import { TodoManager } from './domain/todo';
import { TodoRepo } from './infra/todo_repo';
import { Database } from './infra/database';
import { StatusCode } from 'hono/utils/http-status';

const app = new Hono();

const database = new Database();
const todoRepo = new TodoRepo(database);
const todoManager = new TodoManager(todoRepo);

class HandlableError extends Error {
  status: StatusCode;

  constructor(message: string, status: StatusCode) {
    super(message);
    this.status = status;
  }
}

async function safeGetJsonBody<T extends z.ZodRawShape>(c: Context, schema: z.ZodObject<T>) {
  let reqBody: any;
  try {
    reqBody = await c.req.json();
  } catch (err) {
    if (err instanceof SyntaxError) {
      // User may not pass the valid JSON body.
      throw new HandlableError('Not vaild JSON body: ' + err.message, 400);
    } else {
      throw err;
    }
  }

  let result: ReturnType<typeof schema.parse>;
  try {
    result = schema.parse(reqBody);
  } catch (err) {
    if (err instanceof ZodError) {
      throw new HandlableError('Unexcepted struct: ' + JSON.stringify(err.flatten()), 422);
    } else {
      throw err;
    }
  }
  return result;
}

app.use(async (c, next) => {
  console.log('middleware 1 start')
  await next()
  console.log(c.res.headers)
  console.log('middleware 1 end')
})

app.use(logger());

// TODO (@PeterlitsZo) Only open CORS middleware when it is dev mode.
app.use(cors({
  origin: '*',
  allowMethods: ['GET', 'HEAD', 'PUT', 'POST', 'DELETE', 'PATCH'],
}));

app.onError((err, c) => {
  console.error(err); // TODO (@PeterlitsZo) Using logging library.

  if (err instanceof HandlableError) {
    return c.json({
      msg: err.message,
    }, err.status);
  }

  return c.json({
    msg: 'Oops!',
  }, 500);
})

app.get('/api/v1/todos', async (c) => {
  let todos = await todoManager.listTodos();
  return c.json({
    list: todos,
  });
});

app.get('/api/v1/todos/:id', async (c) => {
  let todo = await todoManager.getTodo(c.req.param('id'));
  return c.json(todo);
});

app.post('/api/v1/todos', async (c) => {
  const todoContentSchema = z.object({
    type: z.literal('text'),
    text: z.string(),
  });
  let todoContent = await safeGetJsonBody(c, todoContentSchema);
  let todo = await todoManager.addTodo(todoContent);

  return c.json(todo);
})

app.delete('/api/v1/todos/:id', async (c) => {
  await todoManager.removeTodo(c.req.param('id'));

  return c.json(null);
});

app.patch('/api/v1/todos/:id', async (c) => {
  const todoPatchSchema = z.object({
    status: z.union([z.literal('TODO'), z.literal('DONE')]).optional(),
    children: z.object({
      expended: z.boolean(),
    }).optional(),
  });

  let todoPatch = await safeGetJsonBody(c, todoPatchSchema);
  let todo = await todoManager.updateTodo(c.req.param('id'), todoPatch);
  return c.json(todo);
})

app.post(`/api/v1/todos/:id/\:reorder`, async (c) => {
  const reorderTodoSchema = z.object({
    aim_parent_id: z.string(),
    index: z.number(),
  });

  let reorderTodoReq = await safeGetJsonBody(c, reorderTodoSchema);
  let todo = await todoManager.reorderTodo(
    c.req.param('id'),
    reorderTodoReq.aim_parent_id,
    reorderTodoReq.index
  );
  return c.json(todo);
})

console.log('port', JSON.parse(Bun.env.API_HTTP_PORT));

export default {
  port: JSON.parse(Bun.env.API_HTTP_PORT),
  fetch: app.fetch,
};
