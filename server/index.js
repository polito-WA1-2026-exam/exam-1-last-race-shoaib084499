import cors from "cors";
import express from "express";
import session from "express-session";
import connectSqlite3 from "connect-sqlite3";
import passport from "passport";
import config from "./src/config/appConfig.js";
import { configurePassport } from "./src/config/passport.js";
import gameRoutes from "./src/routes/gameRoutes.js";
import sessionRoutes from "./src/routes/sessionRoutes.js";

const app = express();
const SQLiteStore = connectSqlite3(session);

configurePassport();

app.use(express.json());
app.use(
  cors({
    origin: config.clientOrigin,
    credentials: true,
  }),
);
app.use(
  session({
    store: new SQLiteStore({ db: config.sessionDatabaseFile }),
    secret: config.sessionSecret,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      sameSite: "lax",
      maxAge: 1000 * 60 * 60,
    },
  }),
);
app.use(passport.initialize());
app.use(passport.session());

app.use("/api/sessions", sessionRoutes);
app.use("/api", gameRoutes);

app.use((err, req, res, next) => {
  console.error(err);
  if (res.headersSent) return next(err);
  return res.status(500).json({ error: "Internal server error." });
});

app.listen(config.port, () => {
  console.log(`Server listening at http://localhost:${config.port}`);
});
