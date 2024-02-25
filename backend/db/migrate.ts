#!/usr/bin/env bun

import postgres from 'postgres';

const databaseUrl = (function() {
  const result = Bun.env.DATABASE_URL;
  if (result === undefined) {
    throw new Error('Environment variable DATABASE_URL not defined');
  }
  return result;
})();

const sql = postgres(databaseUrl);

type HasMetaTable = 'UNKNOWN' | boolean;
type Version = 'UNKNOWN' | number;

class DataSource {
  hasMetaTable: HasMetaTable = 'UNKNOWN';
  version: Version = 'UNKNOWN';

  async makeSureHavingMetaTable() {
    if (this.hasMetaTable === 'UNKNOWN') {
      let result = await sql`
        SELECT EXISTS (
          SELECT 1
          FROM information_schema.tables
          WHERE table_name = 'meta'
        );
      `;
      let hasMetaTable = result[0].exists as boolean;
      this.hasMetaTable = hasMetaTable;
    }
    if (this.hasMetaTable) {
      return;
    }
    if (!this.hasMetaTable) {
      await sql`
        CREATE TABLE meta (
          name VARCHAR,
          value JSON
        );
      `;
      this.hasMetaTable = true;
    }
  }

  async prepareMetaTable() {
    await this.makeSureHavingMetaTable();

    if (this.version === 'UNKNOWN') {
      let result = await sql`
        SELECT value FROM meta WHERE name = 'version';
      `;
      if (result.length === 0) {
        let result = await sql`
          INSERT INTO meta (name, value) VALUES ('version', '0') RETURNING *;
        `;
        this.version = result[0].value;
      } else {
        this.version = result[0].value;
      }
    }
  }

  async getVersion() {
    await this.prepareMetaTable();

    return this.version as number;
  }

  async incrVersion() {
    let result = await sql`
      UPDATE meta
      SET value = ${await this.getVersion() + 1}
      WHERE name = 'version'
      RETURNING *;
    `;
    this.version = result[0].value;
  }

  async migrate() {
    if (await this.getVersion() === 0) {
      // Create a initial table 'todos'.

      await sql`
        CREATE TABLE "todos" (
          "id"      SERIAL NOT NULL,
          "content" TEXT NOT NULL,
        
          CONSTRAINT "todos.pkey" PRIMARY KEY ("id")
        );
      `;
      await this.incrVersion();
    }
    if (await this.getVersion() === 1) {
      // Add colume 'status' to table 'todos'.

      await sql`
        CREATE TYPE "STATUS" AS ENUM ('DONE', 'TODO');
      `;
      await sql`
        ALTER TABLE "todos" ADD COLUMN "status" "STATUS" NOT NULL DEFAULT 'TODO';
      `;
      await this.incrVersion();
    }
    if (await this.getVersion() === 2) {
      // Add table 'todo_roots';
      //
      // The default root's name is just named 'default'.

      await sql`
        CREATE TABLE "todo_roots" (
          "id"       SERIAL NOT NULL,
          "name"     TEXT NOT NULL,
          "todo_ids" INTEGER[] NOT NULL,

          CONSTRAINT "todo_roots.pkey" PRIMARY KEY ("id"),
          CONSTRAINT "todo_roots.name.unique" UNIQUE ("name")
        );
      `;
      await sql`
        INSERT INTO "todo_roots" (name, todo_ids) VALUES ('default', '{}');
      `;
      await this.incrVersion();
    }
  }
}

await new DataSource().migrate();

await sql.end();