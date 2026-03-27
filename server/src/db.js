import fs from "node:fs";
import path from "node:path";
import initSqlJs from "sql.js";
import { seedData } from "./seed.js";

const dataDir = path.resolve(process.cwd(), "data");
const dbFile = path.join(dataDir, "release-dashboard.sqlite");

let SQL;
let db;

function ensureDir() {
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
}

function persist() {
  ensureDir();
  fs.writeFileSync(dbFile, Buffer.from(db.export()));
}

export async function initDb() {
  if (db) return db;
  SQL = await initSqlJs({});
  ensureDir();

  if (fs.existsSync(dbFile)) {
    db = new SQL.Database(fs.readFileSync(dbFile));
  } else {
    db = new SQL.Database();
    db.run(`
      CREATE TABLE projects (
        id INTEGER PRIMARY KEY,
        key TEXT NOT NULL,
        name TEXT NOT NULL
      );
      CREATE TABLE release_snapshots (
        id INTEGER PRIMARY KEY,
        project_key TEXT NOT NULL,
        builds_json TEXT NOT NULL,
        work_items_json TEXT NOT NULL,
        pull_requests_json TEXT NOT NULL,
        release_note TEXT NOT NULL,
        created_at TEXT NOT NULL
      );
    `);
    seedData(db);
    persist();
  }

  return db;
}

export function all(sql, params = []) {
  const stmt = db.prepare(sql, params);
  const rows = [];
  while (stmt.step()) {
    rows.push(stmt.getAsObject());
  }
  stmt.free();
  return rows;
}

export function getOne(sql, params = []) {
  return all(sql, params)[0] ?? null;
}

export function execute(sql, params = []) {
  db.run(sql, params);
  persist();
}
