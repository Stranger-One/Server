import { Router } from "express";
const router = Router();
import passport from "passport";
import { hash } from "bcryptjs";
import { v4 as uuidv4 } from "uuid";
import User from "../models/User.js";
import { sendMail } from "../utils/mailer.js";
import { ensureAuthenticated } from "../middlewares/auth.js";


// register page
router.post("/register", async (req, res) => {
  try {
    const { fullname, email, password, confirm } = req.body;
    if (!email || !password)
      return res.status(400).json({ error: "Email and password required" });
    if (password !== confirm)
      return res.status(400).json({ error: "Passwords do not match" });

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing)
      return res.status(400).json({ error: "Email already in use" });

    const saltRounds = 12;
    const passwordHash = await hash(password, saltRounds);

    const verifyToken = uuidv4(); // simple token (could store hashed token too)
    const user = new User({
        fullname,
      email: email.toLowerCase(),
      passwordHash,
      verifyToken,
      emailVerified: false,
    });
    await user.save();

    // send verification email
    const verifyUrl = `${
      process.env.BASE_URL
    }/api/auth/verify?token=${verifyToken}&email=${encodeURIComponent(
      user.email
    )}`;
    await sendMail({
      to: user.email,
      subject: "Please confirm your email address",
      html: `
          <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #222; max-width: 600px; margin: auto; padding: 20px;">
            <h2 style="color: #333;">Hi ${user.name || "there"},</h2>
            <p>Thanks for signing up! To finish creating your account, please confirm your email address by clicking the link below:</p>
            
            <p>
              <a href="${verifyUrl}" 
                 style="display: inline-block; background-color: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
                Verify Email
              </a>
            </p>
      
            <p>Or copy and paste this link into your browser:</p>
            <p style="word-break: break-all; color: #555;">${verifyUrl}</p>
      
            <p>If you didn’t sign up for this account, you can safely ignore this email.</p>
      
            <p style="margin-top: 30px;">Best regards,<br>Your App Team</p>
          </div>
        `,
    });

    return res.status(200).json({ email: user.email });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// email verification
router.get("/verify", async (req, res) => {
  try {
    const { token, email } = req.query;
    if (!token || !email) return res.send("Invalid link");

    const user = await User.findOne({
      email: email.toLowerCase(),
      verifyToken: token,
    });
    if (!user) return res.send("Invalid or expired token");

    user.emailVerified = true;
    user.verifyToken = undefined;
    await user.save();

    res.render("emailverifySuccess");
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// login
router.post("/login", (req, res, next) => {
  passport.authenticate("local", (err, user, info) => {
    if (err) return next(err);
    if (!user)
      return res.status(401).json({ error: info?.message || "Login failed" });

    req.logIn(user, async (err) => {
      if (err) return next(err);
      return res.status(200).json({ message: "Login successful" });
    });
  })(req, res, next);
});

// logout
router.get("/logout", (req, res) => {
  req.logout((err) => {
    if (err) console.error(err);
    req.session.destroy(() =>
      res.status(200).json({ message: "Logout successful" })
    );
  });
});

// forgot password
router.post("/forgot", async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user)
      return res.status(200).json({
        msg: "If that email exists, you will receive a reset link.",
      });

    const resetToken = uuidv4();
    user.resetToken = resetToken;
    user.resetTokenExpires = Date.now() + 1000 * 60 * 60; // 1 hour
    await user.save();

    const resetUrl = `${
      process.env.BASE_URL
    }/api/auth/reset?token=${resetToken}&email=${encodeURIComponent(
      user.email
    )}`;
    await sendMail({
      to: user.email,
      subject: "Reset your password",
      html: `
          <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #222; max-width: 600px; margin: auto; padding: 20px;">
            <h2 style="color: #333;">Hello ${user.name || "there"},</h2>
            <p>We received a request to reset your password. If you made this request, you can reset it by clicking the button below:</p>
            
            <p>
              <a href="${resetUrl}" 
                 style="display: inline-block; background-color: #f44336; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
                Reset Password
              </a>
            </p>
      
            <p>If the button above doesn’t work, copy and paste this link into your browser:</p>
            <p style="word-break: break-all; color: #555;">${resetUrl}</p>
      
            <p>If you didn’t request a password reset, you can safely ignore this email and your password will remain unchanged.</p>
      
            <p style="margin-top: 30px;">Stay secure,<br>Your App Team</p>
          </div>
        `,
    });

    res.status(200).json({
      msg: "If that email exists, you will receive a reset link.",
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

router.get("/reset", (req, res) => {
  const { token, email } = req.query;
  res.render("reset", { token, email, error: null });
});

router.post("/reset", async (req, res) => {
  try {
    const { token, email, password, confirm } = req.body;
    if (!token || !email) return res.send("Invalid request");
    if (!password || password !== confirm)
      return res.status(400).json({
        token,
        email,
        error: "Passwords do not match",
      });

    const user = await User.findOne({
      email: email.toLowerCase(),
      resetToken: token,
      resetTokenExpires: { $gt: Date.now() },
    });
    if (!user) return res.send("Invalid or expired token");

    user.passwordHash = await hash(password, 12);
    user.resetToken = undefined;
    user.resetTokenExpires = undefined;
    await user.save();

    res.render("resetSuccess");
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// profile (protected)
router.get("/profile", ensureAuthenticated, (req, res) => {
  res.status(200).json({ message: "profile", user: req.user });
});

export default router;
