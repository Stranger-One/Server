import express from "express";
import { someHeavyTask } from "../utils/SomeTasks.js";
import { logger } from "../server.js";

const router = express.Router();

router.get("/", (req, res) => {
  logger.info("Monitor Route accessed", {
    timestamp: new Date().toISOString(),
    method: req.method,
    url: req.url,
  });
  res.status(200).json({
    message: "Monitor Route is working",
    timestamp: new Date().toISOString(),
  });
});

router.get("/slow", (req, res) => {
  
  try {
    const response = someHeavyTask();
    response.then((message) => {
      res.status(200).json({ message });
    });
    logger.info("Slow Route accessed", {
    timestamp: new Date().toISOString(),
    method: req.method,
    url: req.url,
  });
  } catch (error) {
    logger.error("Error in Slow Route", {
      timestamp: new Date().toISOString(),
      method: req.method,
      url: req.url,
      error: error.message,
    } );
    res
      .status(500)
      .json({ error: "An error occurred while processing the request" });
  }
});

export default router;
