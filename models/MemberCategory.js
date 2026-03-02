import mongoose from "mongoose";

const MemberCategorySchema = new mongoose.Schema(
  {
    name: { type: String, required: true },

    code: { type: String, required: true, unique: true },

    price: { type: Number, required: true },

    duration_month: { type: Number, default: 12 },

    description1: { type: String },

    description2: { type: String },

    is_lifetime: { type: Boolean, default: false },

    is_active: { type: Boolean, default: true },
  },
  {
    timestamps: {
      createdAt: "created_at",
      updatedAt: false,
    },
  },
);

const MemberCategory = mongoose.model("MemberCategory", MemberCategorySchema);

export default MemberCategory;
