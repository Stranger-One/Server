import dotenv from "dotenv";
dotenv.config();

import express from "express";
import session from "express-session";
import passport from "passport";
import MongoStore from "connect-mongo";
import path from "path";
import { connectDB } from "./utils/db.js";

import authRoutes from "./routes/auth.js";
import dashboardRoutes from "./routes/dashboardRoutes.js";
import "./config/passport.js"; // passport setup
import { fileURLToPath } from "url";

// Create __filename and __dirname equivalents
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

connectDB();

// --- view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// --- session
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
      mongoUrl: process.env.MONGODB_URI,
      collectionName: "sessions",
    }),
    cookie: {
      httpOnly: true,
      // secure: true, // enable when using HTTPS
      maxAge: 1000 * 60 * 60 * 24, // 1 day
    },
  })
);

// --- passport init
app.use(passport.initialize());
app.use(passport.session());

// --- routes
app.use("/api/auth", authRoutes);
app.use("/api/dashboard", dashboardRoutes);

app.listen(PORT, () => console.log(`Server started on ${PORT}`));
