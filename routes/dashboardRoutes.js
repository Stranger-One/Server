import express from "express";
import { ensureAuthenticated } from "../middlewares/auth.js";
const router = express.Router();

router.get("/", ensureAuthenticated, (req, res) => {
  res.json({ message: "dashboard", user: req.user });
});

export default router;