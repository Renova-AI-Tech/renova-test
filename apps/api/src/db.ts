import Database from "better-sqlite3";
import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

export type AppDatabase = Database.Database;

const apiRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");

export const defaultDatabasePath = resolve(apiRoot, "data/dev.sqlite");

export function openDatabase(filename = defaultDatabasePath) {
  if (filename !== ":memory:") {
    mkdirSync(dirname(filename), { recursive: true });
  }

  const db = new Database(filename);
  db.pragma("foreign_keys = ON");
  createSchema(db);
  return db;
}

export function createSchema(db: AppDatabase) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS clients (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS projects (
      id TEXT PRIMARY KEY,
      client_id TEXT NOT NULL,
      name TEXT NOT NULL,
      FOREIGN KEY (client_id) REFERENCES clients(id)
    );

    CREATE TABLE IF NOT EXISTS assignees (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE
    );

    CREATE TABLE IF NOT EXISTS demands (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      client_id TEXT NOT NULL,
      project_id TEXT NOT NULL,
      assignee_id TEXT,
      status TEXT NOT NULL,
      priority TEXT NOT NULL,
      due_date TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      completed_at TEXT,
      FOREIGN KEY (client_id) REFERENCES clients(id),
      FOREIGN KEY (project_id) REFERENCES projects(id),
      FOREIGN KEY (assignee_id) REFERENCES assignees(id)
    );

    CREATE TABLE IF NOT EXISTS demand_events (
      id TEXT PRIMARY KEY,
      demand_id TEXT NOT NULL,
      type TEXT NOT NULL,
      message TEXT NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY (demand_id) REFERENCES demands(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS demand_comments (
      id TEXT PRIMARY KEY,
      demand_id TEXT NOT NULL,
      body TEXT NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY (demand_id) REFERENCES demands(id) ON DELETE CASCADE
    );
  `);
}

export function resetDatabase(db: AppDatabase) {
  db.exec(`
    DELETE FROM demand_comments;
    DELETE FROM demand_events;
    DELETE FROM demands;
    DELETE FROM projects;
    DELETE FROM assignees;
    DELETE FROM clients;
  `);
}
