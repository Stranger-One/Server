import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
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

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: `${process.env.BASE_URL}/api/auth/google/callback`,
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        // profile contains id, displayName, emails, photos
        const existing = await User.findOne({ googleId: profile.id });
        if (existing) return done(null, existing);

        console.log("Profile: ", profile);

        const user = await User.create({
          googleId: profile.id,
          fullname: profile.displayName,
          email: profile.emails?.[0]?.value,
          photo: profile.photos?.[0]?.value,
          emailVerified: true,
          providers: {
            providerName: profile.provider,
            providerId: profile.id,
          },
        });

        done(null, user);
      } catch (err) {
        done(err);
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
