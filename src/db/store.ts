import { DatabaseSync, type StatementSync, type SQLInputValue } from 'node:sqlite';
import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';

export type Param = SQLInputValue;

/**
 * Thin, typed wrapper over node:sqlite.
 * - prepared statements are cached per SQL string
 * - nested transactions use savepoints
 * - rows come back as plain objects
 */
export class Store {
  readonly db: DatabaseSync;
  private readonly cache = new Map<string, StatementSync>();
  private txDepth = 0;

  constructor(path: string) {
    if (path !== ':memory:') mkdirSync(dirname(path), { recursive: true });
    this.db = new DatabaseSync(path);
    this.db.exec(`
      PRAGMA journal_mode = WAL;
      PRAGMA synchronous = NORMAL;
      PRAGMA foreign_keys = ON;
      PRAGMA busy_timeout = 5000;
      PRAGMA temp_store = MEMORY;
      PRAGMA cache_size = -20000;
    `);
  }

  private stmt(sql: string): StatementSync {
    let s = this.cache.get(sql);
    if (!s) {
      s = this.db.prepare(sql);
      this.cache.set(sql, s);
    }
    return s;
  }

  all<T = Record<string, unknown>>(sql: string, ...params: Param[]): T[] {
    return this.stmt(sql).all(...params) as T[];
  }

  get<T = Record<string, unknown>>(sql: string, ...params: Param[]): T | undefined {
    return this.stmt(sql).get(...params) as T | undefined;
  }

  run(sql: string, ...params: Param[]): { changes: number; lastId: number } {
    const r = this.stmt(sql).run(...params);
    return { changes: Number(r.changes), lastId: Number(r.lastInsertRowid) };
  }

  /** Run raw multi-statement SQL (migrations, maintenance). */
  exec(sql: string): void {
    this.db.exec(sql);
  }

  /** Runs `fn` atomically. Nested calls become savepoints. Rolls back on throw. */
  tx<T>(fn: () => T): T {
    const outer = this.txDepth === 0;
    const sp = `sp_${this.txDepth}`;
    this.db.exec(outer ? 'BEGIN IMMEDIATE' : `SAVEPOINT ${sp}`);
    this.txDepth++;
    try {
      const result = fn();
      this.txDepth--;
      this.db.exec(outer ? 'COMMIT' : `RELEASE ${sp}`);
      return result;
    } catch (err) {
      this.txDepth--;
      this.db.exec(outer ? 'ROLLBACK' : `ROLLBACK TO ${sp}; RELEASE ${sp}`);
      throw err;
    }
  }

  /** Consistent online backup into a single file (safe while the app is running). */
  backupTo(file: string): void {
    mkdirSync(dirname(file), { recursive: true });
    const escaped = file.replaceAll("'", "''");
    this.db.exec(`VACUUM INTO '${escaped}'`);
  }

  close(): void {
    this.cache.clear();
    this.db.close();
  }
}
