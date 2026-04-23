import Database, { type Database as BetterSqliteDatabase } from "better-sqlite3";
import path from "node:path";
import fs from "node:fs";

const DB_DIR = path.join(process.cwd(), "data");
const DB_PATH = path.join(DB_DIR, "depipe.db");

// ensure data directory exists
if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true });
}

const db: BetterSqliteDatabase = new Database(DB_PATH);

// enable WAL mode for better performance
db.pragma("journal_mode = WAL");

db.exec(`
  CREATE TABLE IF NOT EXISTS deployments (
    id TEXT PRIMARY KEY,
    image TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    container_id TEXT,
    host_port INTEGER,
    container_port INTEGER,
    git_url TEXT,
    env TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE INDEX IF NOT EXISTS idx_deployments_status
  ON deployments(status);

  CREATE TABLE IF NOT EXISTS logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    deployment_id TEXT NOT NULL,
    message TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (deployment_id) REFERENCES deployments(id)
  );
`);

// migrate existing table to add new columns if they don't exist
const columns = db.prepare(`PRAGMA table_info(deployments)`).all() as { name: string }[];
const columnNames = columns.map((c) => c.name);

if (!columnNames.includes("env")) {
  db.exec(`ALTER TABLE deployments ADD COLUMN env TEXT`);
}

export default db;
