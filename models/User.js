import mongoose from 'mongoose';

const ProviderSchema = new mongoose.Schema({
  providerName: String,
  providerId: String
}, { _id: false });

const UserSchema = new mongoose.Schema({
  fullname: { type: String, default: "" },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  passwordHash: { type: String }, // not present for pure-OAuth users
  emailVerified: { type: Boolean, default: false },
  verifyToken: { type: String }, // token for email verification (store hashed if you want extra security)
  resetToken: { type: String }, // token for password reset
  resetTokenExpires: { type: Date },
  providers: [ProviderSchema],
  googleId: { type: String, default: "" },
  githubId: { type: String, default: "" },
  facebookId: { type: String, default: "" },  
  photo: { type: String, default: "" },
  createdAt: { type: Date, default: Date.now }
});

const User = mongoose.model("User", UserSchema);
export default User;
