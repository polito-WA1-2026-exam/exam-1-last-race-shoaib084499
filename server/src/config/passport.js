import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { get, verifyPassword } from "../db/database.js";

const toPublicUser = (user) => ({ id: user.id, email: user.email, name: user.name });

const configurePassport = () => {
  passport.use(
    new LocalStrategy({ usernameField: "email", passwordField: "password" }, async (email, password, done) => {
      try {
        const user = await get("SELECT * FROM users WHERE email = ?", [email]);
        if (!user || !verifyPassword(password, user.salt, user.password_hash)) {
          return done(null, false, { message: "Invalid email or password." });
        }
        return done(null, toPublicUser(user));
      } catch (err) {
        return done(err);
      }
    }),
  );

  passport.serializeUser((user, done) => done(null, user.id));
  passport.deserializeUser(async (id, done) => {
    try {
      const user = await get("SELECT id, email, name FROM users WHERE id = ?", [id]);
      done(null, user);
    } catch (err) {
      done(err);
    }
  });
};

export { configurePassport, toPublicUser };
