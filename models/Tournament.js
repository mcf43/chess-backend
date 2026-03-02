import mongoose from "mongoose";

const tournamentSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String, required: true },
    startDate: { type: Date, required: true },
    location: { type: String, required: true },
    price: { type: Number, required: true },
    image: { type: String },
    age_category: { type: String },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    registeredUsers: [
      { type: mongoose.Schema.Types.ObjectId, ref: "User", default: [] },
    ],
  },
  { timestamps: true },
);

export default mongoose.model("Tournament", tournamentSchema);
