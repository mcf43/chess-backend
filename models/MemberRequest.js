// models/MemberRequest.js
import mongoose from "mongoose";

const MemberRequestSchema = new mongoose.Schema(
  {
    player_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    category_code: {
      type: String,
      required: true,
      enum: [
        "gm_wgm",
        "im",
        "student",
        "junior",
        "senior",
        "referee",
        "club",
        "coach",
        "branch",
      ],
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    requested_at: { type: Date, default: Date.now },
    processed_at: { type: Date },
    processed_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    description: {
      type: String,
      default: "",
    },
  },
  { timestamps: true },
);

const MemberRequest = mongoose.model("MemberRequest", MemberRequestSchema);

export default MemberRequest;
