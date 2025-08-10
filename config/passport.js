import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import User from "../models/User.js";
import { compare } from "bcryptjs";

passport.use(
  new LocalStrategy(
    { usernameField: "email" },
    async (email, password, done) => {
      try {
        const user = await User.findOne({ email: email.toLowerCase() });
        if (!user)
          return done(null, false, { message: "Incorrect email or password." });

        if (user.emailVerified === false) {
          return done(null, false, {
            message: "Email not verified. Check your inbox.",
          });
        }

        const match = await compare(password, user.passwordHash);
        if (!match)
          return done(null, false, { message: "Incorrect email or password." });

        return done(null, user);
      } catch (err) {
        return done(err);
      }
    }
  )
);

passport.serializeUser((user, done) => {
  console.log("serializeUser - user: ", user);
  // console.log("serializeUser - user._id: ", user._id);
  // console.log("serializeUser - user.id: ", user.id);

  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  console.log("deserializeUser - id: ", id);
  try {
    const user = await User.findById(id).select(
      "-passwordHash -resetToken -verifyToken"
    );
    done(null, user);
  } catch (err) {
    done(err);
  }
});
