import express from "express";
import passport from "passport";
import { toPublicUser } from "../config/passport.js";

const router = express.Router();

router.get("/current", (req, res) => {
  res.json({ user: req.user ? toPublicUser(req.user) : null });
});

router.post("/", (req, res, next) => {
  passport.authenticate("local", (err, user, info) => {
    if (err) return next(err);
    if (!user) return res.status(401).json({ error: info?.message ?? "Invalid credentials." });
    return req.login(user, (loginErr) => {
      if (loginErr) return next(loginErr);
      return res.status(201).json({ user: toPublicUser(user) });
    });
  })(req, res, next);
});

router.delete("/current", (req, res, next) => {
  req.logout((err) => {
    if (err) return next(err);
    return res.status(204).end();
  });
});

export default router;
