import { Surreal } from 'surrealdb.js';
import { z } from 'zod';

export class Database {
  db: Surreal;
  connected: boolean = false;

  constructor() {
    this.db = new Surreal();
  }

  getConfig() {
    const config = {
      url: Bun.env.SURREAL_URL,
      namespace: Bun.env.SURREAL_NAMESPACE,
      database: Bun.env.SURREAL_DATABASE,
      username: Bun.env.SURREAL_USERNAME,
      password: Bun.env.SURREAL_PASSWORD,
    };
    const configSchema = z.object({
      url: z.string(),
      namespace: z.string(),
      database: z.string(),
      username: z.string(),
      password: z.string(),
    })
    const result = configSchema.parse(config);
    return result;
  }

  async connect() {
    const config = this.getConfig();

    await this.db.connect(config.url, {
      namespace: config.namespace,
      database: config.database,
      auth: {
        namespace: config.namespace,
        database: config.database,
        username: config.username,
        password: config.password,
      },
    });

    this.connected = true;
  }

  async getInner() {
    if (!this.connected) {
      await this.connect();
    }
    return this.db;
  }

  async close() {
    this.db.close();
  }
}
