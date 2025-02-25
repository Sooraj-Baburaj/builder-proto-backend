import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  displayName: {
    type: String,
  },
  profilePhoto: {
    type: String,
  },
  googleId: {
    type: String,
  },
  email: {
    type: String,
    index: true,
    unique: true,
    required: true,
  },
  password: {
    type: String,
  },
  resetPasswordToken: String,
  resetPasswordExpires: Date,
});

const User = mongoose.model("User", userSchema);

export default User;
