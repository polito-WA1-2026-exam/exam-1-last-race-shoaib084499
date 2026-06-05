import config from "../config/appConfig.js";
import { all, get, run } from "../db/database.js";

const normalizeSegmentKey = (a, b) => [Number(a), Number(b)].sort((x, y) => x - y).join("-");

const getNetwork = async () => {
  const stations = await all("SELECT id, name, x, y FROM stations ORDER BY name");
  const lineRows = await all(`
    SELECT l.id AS line_id, l.name AS line_name, l.color, s.id AS station_id, s.name AS station_name,
           s.x, s.y, ls.position
    FROM lines l
    JOIN line_stations ls ON ls.line_id = l.id
    JOIN stations s ON s.id = ls.station_id
    ORDER BY l.id, ls.position
  `);
  const linesById = new Map();
  for (const row of lineRows) {
    if (!linesById.has(row.line_id)) {
      linesById.set(row.line_id, {
        id: row.line_id,
        name: row.line_name,
        color: row.color,
        stations: [],
      });
    }
    linesById.get(row.line_id).stations.push({
      id: row.station_id,
      name: row.station_name,
      x: row.x,
      y: row.y,
    });
  }
  return { stations, lines: [...linesById.values()] };
};

const getSegments = async () => {
  const network = await getNetwork();
  const segmentMap = new Map();
  for (const line of network.lines) {
    for (let i = 0; i < line.stations.length - 1; i += 1) {
      const from = line.stations[i];
      const to = line.stations[i + 1];
      const key = normalizeSegmentKey(from.id, to.id);
      const existing = segmentMap.get(key) ?? {
        key,
        from: { id: from.id, name: from.name },
        to: { id: to.id, name: to.name },
        lineIds: [],
        lineNames: [],
      };
      existing.lineIds.push(line.id);
      existing.lineNames.push(line.name);
      segmentMap.set(key, existing);
    }
  }
  return [...segmentMap.values()];
};

const getAdjacency = async () => {
  const segments = await getSegments();
  const adjacency = new Map();
  for (const segment of segments) {
    for (const [from, to] of [
      [segment.from.id, segment.to.id],
      [segment.to.id, segment.from.id],
    ]) {
      if (!adjacency.has(from)) adjacency.set(from, []);
      adjacency.get(from).push({ stationId: to, segment });
    }
  }
  return adjacency;
};

const shortestDistance = (startId, destinationId, adjacency) => {
  const queue = [{ stationId: startId, distance: 0 }];
  const visited = new Set([startId]);
  while (queue.length) {
    const current = queue.shift();
    if (current.stationId === destinationId) return current.distance;
    for (const edge of adjacency.get(current.stationId) ?? []) {
      if (!visited.has(edge.stationId)) {
        visited.add(edge.stationId);
        queue.push({ stationId: edge.stationId, distance: current.distance + 1 });
      }
    }
  }
  return Infinity;
};

const pickStartAndDestination = async () => {
  const stations = await all("SELECT id, name FROM stations");
  const adjacency = await getAdjacency();
  const candidates = [];
  for (const start of stations) {
    for (const destination of stations) {
      if (start.id === destination.id) continue;
      const distance = shortestDistance(start.id, destination.id, adjacency);
      if (distance >= 3 && Number.isFinite(distance)) candidates.push({ start, destination });
    }
  }
  return candidates[Math.floor(Math.random() * candidates.length)];
};

const countStationLines = async () => {
  const rows = await all(`
    SELECT station_id, COUNT(*) AS line_count
    FROM line_stations
    GROUP BY station_id
  `);
  return new Map(rows.map((row) => [row.station_id, row.line_count]));
};

const publicStations = async () => {
  const stations = await all("SELECT id, name, x, y FROM stations ORDER BY name");
  const counts = await countStationLines();
  return stations.map((station) => ({ ...station, interchange: counts.get(station.id) > 1 }));
};

const validateRoute = async (game, route) => {
  if (!Array.isArray(route) || route.length === 0) {
    return { valid: false, reason: "The route is empty." };
  }

  const segmentMap = new Map((await getSegments()).map((segment) => [segment.key, segment]));
  const stationLines = await countStationLines();
  const used = new Set();
  const normalized = [];

  for (const item of route) {
    const fromId = Number(item?.fromId);
    const toId = Number(item?.toId);
    if (!Number.isInteger(fromId) || !Number.isInteger(toId) || fromId === toId) {
      return { valid: false, reason: "Every step must contain two different stations." };
    }
    const key = normalizeSegmentKey(fromId, toId);
    const segment = segmentMap.get(key);
    if (!segment) return { valid: false, reason: "The route contains a segment that is not in the network." };
    if (used.has(key)) return { valid: false, reason: "A segment was selected more than once." };
    used.add(key);
    normalized.push({ fromId, toId, key, possibleLineIds: segment.lineIds });
  }

  if (normalized[0].fromId !== game.start_station_id) {
    return { valid: false, reason: "The route does not start from the assigned station." };
  }
  if (normalized.at(-1).toId !== game.destination_station_id) {
    return { valid: false, reason: "The route does not end at the assigned destination." };
  }
  for (let i = 1; i < normalized.length; i += 1) {
    if (normalized[i - 1].toId !== normalized[i].fromId) {
      return { valid: false, reason: "The selected segments are not in a continuous sequence." };
    }
  }

  let possibleLines = new Set(normalized[0].possibleLineIds);
  for (let i = 1; i < normalized.length; i += 1) {
    const interchangeStation = normalized[i].fromId;
    const nextLines = new Set(normalized[i].possibleLineIds);
    const compatible = new Set();
    for (const currentLine of possibleLines) {
      for (const nextLine of nextLines) {
        if (currentLine === nextLine || stationLines.get(interchangeStation) > 1) compatible.add(nextLine);
      }
    }
    if (compatible.size === 0) {
      return { valid: false, reason: "A line change happens outside an interchange station." };
    }
    possibleLines = compatible;
  }

  return { valid: true, route: normalized };
};

const createGame = async (userId) => {
  const { start, destination } = await pickStartAndDestination();
  const result = await run(
    `INSERT INTO games (user_id, start_station_id, destination_station_id, status)
     VALUES (?, ?, ?, 'planning')`,
    [userId, start.id, destination.id],
  );
  const segments = await getSegments();
  return {
    gameId: result.lastID,
    initialCoins: config.initialCoins,
    start,
    destination,
    stations: await publicStations(),
    segments: segments.map(({ key, from, to }) => ({ key, from, to })).sort(() => Math.random() - 0.5),
  };
};

const submitRoute = async (gameId, userId, route) => {
  const game = await get("SELECT * FROM games WHERE id = ? AND user_id = ?", [gameId, userId]);
  if (!game) return { status: 404, body: { error: "Game not found." } };
  if (game.status === "completed") return { status: 409, body: { error: "This game is already completed." } };

  const validation = await validateRoute(game, route);
  if (!validation.valid) {
    await run(
      `UPDATE games SET status = 'completed', route_json = ?, events_json = ?, final_score = 0,
       completed_at = CURRENT_TIMESTAMP WHERE id = ?`,
      [JSON.stringify(route ?? []), JSON.stringify([]), gameId],
    );
    return {
      status: 200,
      body: { valid: false, reason: validation.reason, initialCoins: config.initialCoins, finalScore: 0, steps: [] },
    };
  }

  const eventRows = await all("SELECT id, title, description, effect FROM events");
  let coins = config.initialCoins;
  const steps = validation.route.map((segment, index) => {
    const event = eventRows[Math.floor(Math.random() * eventRows.length)];
    coins += event.effect;
    return {
      index: index + 1,
      fromId: segment.fromId,
      toId: segment.toId,
      event,
      coins,
    };
  });
  const finalScore = Math.max(0, coins);
  await run(
    `UPDATE games SET status = 'completed', route_json = ?, events_json = ?, final_score = ?,
     completed_at = CURRENT_TIMESTAMP WHERE id = ?`,
    [JSON.stringify(validation.route), JSON.stringify(steps), finalScore, gameId],
  );
  return { status: 200, body: { valid: true, initialCoins: config.initialCoins, finalScore, steps } };
};

const getRanking = async () =>
  all(`
    SELECT u.name, u.email, MAX(g.final_score) AS best_score
    FROM users u
    JOIN games g ON g.user_id = u.id
    WHERE g.status = 'completed'
    GROUP BY u.id
    HAVING best_score IS NOT NULL
    ORDER BY best_score DESC, u.name ASC
  `);

export { createGame, getNetwork, getRanking, getSegments, submitRoute };
