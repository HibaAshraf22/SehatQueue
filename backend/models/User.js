
const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true
    },
    email: {
      type: String,
      unique: true,
      sparse: true,
      default: undefined
    },
    password: {
      type: String,
      default: undefined
    },
    phone: {
      type: String,
      default: ""
    },
    role: {
      type: String,
      enum: ["patient", "admin"],
      default: "patient"
    },
    isWalkIn: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model("User", userSchema);
