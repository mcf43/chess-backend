import mongoose from "mongoose";

const PaymentSchema = new mongoose.Schema(
  {
    amount: { type: Number, required: true },
    date: { type: Date, default: Date.now },
    method: { type: String, default: "QR" },
  },
  { _id: false },
);

const MembershipSchema = new mongoose.Schema(
  {
    is_membership: {
      type: Boolean,
      default: false,
    },
    membership_type: {
      type: [String],
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
      default: [],
    },
    status: {
      type: String,
      enum: ["pending", "active", "expired"],
      default: "pending",
    },
    start_date: {
      type: Date,
      required: true,
    },
    end_date: {
      type: Date,
      required: true,
    },
    player_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    payment_history: [PaymentSchema],
  },
  { timestamps: true },
);

const Membership = mongoose.model("Membership", MembershipSchema);

export default Membership;
