import express from "express";
import requireAuth from "../middleware/auth.js";
import { createGame, getNetwork, getRanking, getSegments, submitRoute } from "../services/gameService.js";

const router = express.Router();

router.get("/network", requireAuth, async (req, res, next) => {
  try {
    const network = await getNetwork();
    const segments = await getSegments();
    res.json({
      ...network,
      segments: segments.map(({ key, from, to, lineNames }) => ({ key, from, to, lineNames })),
    });
  } catch (err) {
    next(err);
  }
});

router.post("/games", requireAuth, async (req, res, next) => {
  try {
    res.status(201).json(await createGame(req.user.id));
  } catch (err) {
    next(err);
  }
});

router.post("/games/:id/route", requireAuth, async (req, res, next) => {
  try {
    const gameId = Number(req.params.id);
    if (!Number.isInteger(gameId)) return res.status(400).json({ error: "Invalid game id." });
    const result = await submitRoute(gameId, req.user.id, req.body?.route);
    return res.status(result.status).json(result.body);
  } catch (err) {
    next(err);
  }
});

router.get("/ranking", requireAuth, async (req, res, next) => {
  try {
    res.json({ ranking: await getRanking() });
  } catch (err) {
    next(err);
  }
});

export default router;
