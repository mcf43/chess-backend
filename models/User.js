import mongoose from "mongoose";

const UserSchema = new mongoose.Schema(
  {
    firstname: { type: String, required: true },
    lastname: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    phone: { type: String },
    rank_standart: { type: String },
    rank_rapid: { type: String },
    rank_blitz: { type: String },
    birthday: { type: Date },
    role: { type: String, default: "user" },
    referee: { type: Boolean, default: false },
    fide_id: { type: String, default: null },
    gender: { type: String, default: null },
    fide_title: { type: String, default: null },
    pro_user: { type: Boolean, default: false },
    image: { type: String, default: null },

    // 🔐 Forgot password
    resetCode: { type: String },
    resetExpire: { type: Date },
  },
  { timestamps: true },
);

const User = mongoose.model("User", UserSchema);

export default User;
