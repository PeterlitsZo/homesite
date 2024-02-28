import { Database } from './database';

type Version = {
  id: 'meta:version',
  value: number,
}

export class Migration {
  /** The current version. Using `getCurrentVersion` to get me. Inited by
   * `prepareMetaTable`. */
  currentVersion: number | undefined = undefined;

  db: Database;

  constructor(db: Database) {
    this.db = db;
  }

  /** Make sure the table 'meta' is inited. It will also init the
   * `currentVersion` */
  async prepareMetaTable() {
    const db = await this.db.getInner();

    let result = await db.query<[Version[]]>(
      'SELECT * FROM meta WHERE id = meta:version'
    );
    if (result[0].length === 0) {
      let result = await db.query<[Version[]]>(
        'CREATE meta:version SET value = 0'
      );
      this.currentVersion = result[0][0].value;
      return;
    }
    this.currentVersion = result[0][0].value;
  }

  async getVersion() {
    if (this.currentVersion === undefined) {
      await this.prepareMetaTable();
    }
    return this.currentVersion!;
  }

  async incrVersion() {
    const db = await this.db.getInner();

    let result = await db.query<[Version[]]>(
      'UPDATE meta:version SET value = $version',
      { version: await this.getVersion() + 1 },
    )
    this.currentVersion = result[0][0].value;
  }

  async migrate() {
    const db = await this.db.getInner();

    if (await this.getVersion() === 0) {
      // VERSION 1:
      //
      // * Application can create record in table `todo`, it has:
      //   * `id` field;
      //   * `content` field: it is just a normal string;
      //   * `parent_id` field: it must be "todo_root:default";
      //   * `status` field: it must be "TODO" or "DONE";
      // * There is also a table `todo_root`, it has just one record, which has
      //   id "todo_root:default":
      //   * `id` field;
      //   * `todos` field: it is a array which contains all ids of those todo
      //     records.
      await db.query(
        'CREATE todo_root:default SET todos = []'
      );
      await this.incrVersion();
    }

    if (await this.getVersion() === 1) {
      // VERSION 2:
      //
      // * table `todo` will has a field `todos` (like table `todo_root` does).
      //   It must be an array, which contains all ids of its sub todo records.
      await db.query(
        'UPDATE todo SET todos = []'
      );
      await this.incrVersion();
    }
  }
}