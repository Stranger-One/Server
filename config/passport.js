import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { Strategy as GithubStrategy } from "passport-github2";
import { Strategy as FacebookStrategy } from "passport-facebook";
import User from "../models/User.js";
import { compare } from "bcryptjs";

// Local Strategy: email + password
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

// Google Strategy: Google
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
        const existing = await User.findOne({
          email: profile.emails?.[0]?.value,
        });
        if (existing) {
          existing.googleId = profile.id;
          existing.fullname = profile.displayName;
          existing.email = profile.emails?.[0]?.value;
          existing.photo = profile.photos?.[0]?.value;
          existing.emailVerified = true;
          existing.providers = [
            ...existing.providers,
            {
              providerName: profile.provider,
              providerId: profile.id,
            },
          ];

          await existing.save();

          return done(null, existing);
        }

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

// Github Strategy
passport.use(
  new GithubStrategy(
    {
      clientID: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
      callbackURL: `${process.env.BASE_URL}/api/auth/github/callback`,
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        // profile contains id, displayName, emails, photos

        if (!profile.emails || profile.emails.length === 0) {
          const res = await fetch("https://api.github.com/user/emails", {
            headers: {
              Authorization: `token ${accessToken}`,
              "User-Agent": "node.js",
            },
          });
          const emails = await res.json();
          console.log("emails: ", emails);
          profile.emails = emails;
        }

        console.log("Profile: ", profile);

        const existing = await User.findOne({
          email: profile.emails?.[0]?.email,
        });

        if (existing) {
          existing.githubId = profile.id;
          existing.fullname = profile.displayName;
          existing.email = profile.emails?.[0]?.email || profile._json.email;
          existing.photo = profile.photos?.[0]?.value;
          existing.emailVerified =
            profile.emails?.[0]?.email || profile._json.email ? true : false;
          existing.providers = [
            ...existing.providers,
            {
              providerName: profile.provider,
              providerId: profile.id,
            },
          ];

          await existing.save();
          return done(null, existing);
        }

        const user = await User.create({
          githubId: profile.id,
          fullname: profile.displayName,
          email: profile.emails?.[0]?.email || profile._json.email,
          photo: profile.photos?.[0]?.value,
          emailVerified:
            profile.emails?.[0]?.email || profile._json.email ? true : false,
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

// FaceBook Strategy - Not working Properly :)
passport.use(
  new FacebookStrategy(
    {
      clientID: process.env.FACEBOOK_APP_ID,
      clientSecret: process.env.FACEBOOK_APP_SECRET,
      callbackURL: `${process.env.BASE_URL}/api/auth/facebook/callback`,
      profileFields: [
        "id",
        "displayName",
        "photos",
        "email",
        "birthday",
        "gender",
      ],
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        // profile contains id, displayName, emails, photos
        console.log("Profile: ", profile);

        const existing = await User.findOne({ facebookId: profile.id });

        if (existing) {
          existing.facebookId = profile.id;
          existing.fullname = profile.displayName;
          existing.email =
            profile.emails?.[0]?.value || profile._json.email || null;
          existing.photo = profile.photos?.[0]?.value;
          existing.emailVerified =
            profile.emails?.[0]?.value || profile._json.email ? true : false;
          existing.providers = {
            providerName: profile.provider,
            providerId: profile.id,
          };

          await existing.save();
          return done(null, existing);
        }

        const user = await User.create({
          facebookId: profile.id,
          fullname: profile.displayName,
          email: profile.emails?.[0]?.value || profile._json.email,
          photo: profile.photos?.[0]?.value,
          emailVerified:
            profile.emails?.[0]?.value || profile._json.email ? true : false,
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
