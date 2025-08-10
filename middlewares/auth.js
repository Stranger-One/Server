export function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    console.log("Logged in user:", req.user); // user details
    return next();
  }
  res.status(401).json({ error: "Unauthorized" });
}
