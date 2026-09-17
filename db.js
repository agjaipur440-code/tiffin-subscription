const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const db = new sqlite3.Database(path.join(__dirname, 'tiffin.db'));

db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS plans (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    meals_per_day INTEGER NOT NULL,
    price_per_meal REAL NOT NULL
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS customers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    phone TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS subscriptions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    customer_id INTEGER NOT NULL,
    plan_id INTEGER NOT NULL,
    start_date TEXT NOT NULL,
    duration_days INTEGER NOT NULL,
    status TEXT DEFAULT 'active',
    total_bill REAL,
    FOREIGN KEY (customer_id) REFERENCES customers(id),
    FOREIGN KEY (plan_id) REFERENCES plans(id)
  )`);

  db.get('SELECT COUNT(*) as count FROM plans', (err, row) => {
    if (!err && row.count === 0) {
      const stmt = db.prepare('INSERT INTO plans (name, meals_per_day, price_per_meal) VALUES (?, ?, ?)');
      stmt.run('Basic', 1, 60.0);
      stmt.run('Standard', 2, 55.0);
      stmt.run('Premium', 3, 50.0);
      stmt.finalize();
    }
  });
});

module.exports = db;
