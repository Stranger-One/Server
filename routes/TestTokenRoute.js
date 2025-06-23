import express from "express";

const route = express.Router();

route.get("/", (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    console.log("Received request on /api/testToken route", token);
    
    if (token === "valid-token") {
      res.status(200).json({ token, message: "Token is valid" });
    } else {
      res.status(401).json({ token, message: "Invalid token" });
    }
  } catch (error) {
    console.error("Error in /api/testToken route:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

export default route;
