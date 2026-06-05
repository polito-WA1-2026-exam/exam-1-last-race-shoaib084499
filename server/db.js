import crypto from "node:crypto";
import sqlite3 from "sqlite3";

const db = new sqlite3.Database("last-race.sqlite");
sqlite3.verbose();

const run = (sql, params = []) =>
  new Promise((resolve, reject) => {
    db.run(sql, params, function onRun(err) {
      if (err) reject(err);
      else resolve(this);
    });
  });

const get = (sql, params = []) =>
  new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });

const all = (sql, params = []) =>
  new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });

const hashPassword = (password, salt = crypto.randomBytes(16).toString("hex")) => {
  const hash = crypto
    .pbkdf2Sync(password, salt, 120000, 64, "sha512")
    .toString("hex");
  return { salt, hash };
};

const verifyPassword = (password, salt, expectedHash) => {
  const { hash } = hashPassword(password, salt);
  return crypto.timingSafeEqual(Buffer.from(hash, "hex"), Buffer.from(expectedHash, "hex"));
};

const lines = [
  {
    name: "Red Line",
    color: "#d84a4a",
    stations: ["Centrale", "Porta Velaria", "Crocevia del Falco", "Piazza delle Lanterne"],
  },
  {
    name: "Blue Line",
    color: "#3274b8",
    stations: ["Centrale", "Fontana Oscura", "Borgo Sereno", "Viale dei Mosaici", "Arco del Sale"],
  },
  {
    name: "Green Line",
    color: "#3c9b62",
    stations: ["Porta Velaria", "Fontana Oscura", "Torre Cinerea", "Campo dell'Eco", "Giardini Nord"],
  },
  {
    name: "Yellow Line",
    color: "#d9a529",
    stations: ["Piazza delle Lanterne", "Torre Cinerea", "Viale dei Mosaici", "Campo dell'Eco", "Mercato Vecchio"],
  },
  {
    name: "Violet Line",
    color: "#7b58a6",
    stations: ["Borgo Sereno", "Darsena Chiara", "Mercato Vecchio", "Archivio Sud"],
  },
];

const stationPositions = {
  Centrale: [80, 80],
  "Porta Velaria": [250, 80],
  "Crocevia del Falco": [430, 80],
  "Piazza delle Lanterne": [610, 80],
  "Fontana Oscura": [250, 230],
  "Borgo Sereno": [430, 230],
  "Viale dei Mosaici": [610, 230],
  "Torre Cinerea": [430, 370],
  "Campo dell'Eco": [610, 370],
  "Giardini Nord": [250, 370],
  "Arco del Sale": [780, 230],
  "Mercato Vecchio": [780, 370],
  "Darsena Chiara": [610, 520],
  "Archivio Sud": [950, 520],
};

const events = [
  ["Quiet journey", "Nothing unusual happens.", 0],
  ["Wrong platform", "You lose time correcting your direction.", -2],
  ["Kind passenger", "A passenger shares a useful shortcut.", 1],
  ["Ticket inspector", "Your ticket is checked and a fee applies.", -3],
  ["Found coin pouch", "You find a small pouch under the seat.", 3],
  ["Crowded carriage", "You miss a chance to board quickly.", -1],
  ["Express transfer", "A fast connection saves resources.", 2],
  ["Signal failure", "A delay costs extra coins.", -4],
  ["Street musician", "A cheerful song improves your luck.", 1],
  ["Maintenance refund", "The operator refunds part of the trip.", 4],
];

const users = [
  ["alice@example.com", "Alice", "password"],
  ["bruno@example.com", "Bruno", "password"],
  ["carla@example.com", "Carla", "password"],
];

const createSchema = async () => {
  await run("PRAGMA foreign_keys = ON");
  await run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    salt TEXT NOT NULL,
    password_hash TEXT NOT NULL
  )`);
  await run(`CREATE TABLE IF NOT EXISTS stations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    x INTEGER NOT NULL,
    y INTEGER NOT NULL
  )`);
  await run(`CREATE TABLE IF NOT EXISTS lines (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    color TEXT NOT NULL
  )`);
  await run(`CREATE TABLE IF NOT EXISTS line_stations (
    line_id INTEGER NOT NULL REFERENCES lines(id),
    station_id INTEGER NOT NULL REFERENCES stations(id),
    position INTEGER NOT NULL,
    PRIMARY KEY (line_id, station_id)
  )`);
  await run(`CREATE TABLE IF NOT EXISTS events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    effect INTEGER NOT NULL CHECK(effect BETWEEN -4 AND 4)
  )`);
  await run(`CREATE TABLE IF NOT EXISTS games (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id),
    start_station_id INTEGER NOT NULL REFERENCES stations(id),
    destination_station_id INTEGER NOT NULL REFERENCES stations(id),
    status TEXT NOT NULL,
    route_json TEXT,
    events_json TEXT,
    final_score INTEGER,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    completed_at TEXT
  )`);
};

const seed = async () => {
  const stationCount = await get("SELECT COUNT(*) AS count FROM stations");
  if (stationCount.count > 0) return;

  const stationNames = [...new Set(lines.flatMap((line) => line.stations))];
  for (const name of stationNames) {
    const [x, y] = stationPositions[name];
    await run("INSERT INTO stations (name, x, y) VALUES (?, ?, ?)", [name, x, y]);
  }

  for (const line of lines) {
    const lineResult = await run("INSERT INTO lines (name, color) VALUES (?, ?)", [line.name, line.color]);
    for (const [position, stationName] of line.stations.entries()) {
      const station = await get("SELECT id FROM stations WHERE name = ?", [stationName]);
      await run("INSERT INTO line_stations (line_id, station_id, position) VALUES (?, ?, ?)", [
        lineResult.lastID,
        station.id,
        position,
      ]);
    }
  }

  for (const event of events) {
    await run("INSERT INTO events (title, description, effect) VALUES (?, ?, ?)", event);
  }

  for (const [email, name, password] of users) {
    const { salt, hash } = hashPassword(password);
    await run("INSERT INTO users (email, name, salt, password_hash) VALUES (?, ?, ?, ?)", [
      email,
      name,
      salt,
      hash,
    ]);
  }

  const alice = await get("SELECT id FROM users WHERE email = ?", ["alice@example.com"]);
  const bruno = await get("SELECT id FROM users WHERE email = ?", ["bruno@example.com"]);
  const centrale = await get("SELECT id FROM stations WHERE name = ?", ["Centrale"]);
  const campo = await get("SELECT id FROM stations WHERE name = ?", ["Campo dell'Eco"]);
  const porta = await get("SELECT id FROM stations WHERE name = ?", ["Porta Velaria"]);
  const mercato = await get("SELECT id FROM stations WHERE name = ?", ["Mercato Vecchio"]);
  await run(
    `INSERT INTO games (user_id, start_station_id, destination_station_id, status, final_score, completed_at)
     VALUES (?, ?, ?, 'completed', 25, CURRENT_TIMESTAMP)`,
    [alice.id, centrale.id, campo.id],
  );
  await run(
    `INSERT INTO games (user_id, start_station_id, destination_station_id, status, final_score, completed_at)
     VALUES (?, ?, ?, 'completed', 18, CURRENT_TIMESTAMP)`,
    [bruno.id, porta.id, mercato.id],
  );
};

await createSchema();
await seed();

export { all, get, run, verifyPassword };
