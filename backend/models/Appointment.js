const mongoose = require("mongoose");

const appointmentSchema = new mongoose.Schema(
  {
    patient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    hospital: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Hospital",
      required: true
    },
    department: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Department",
      required: true
    },
    doctor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Doctor",
      required: true
    },
    appointmentDate: {
      type: Date,
      required: true
    },
    tokenNumber: {
      type: Number,
      required: true
    },
    source: {
      type: String,
      enum: ["online", "walk-in"],
      default: "online"
    },
    status: {
      type: String,
      enum: ["waiting", "called", "completed", "no-show", "cancelled"],
      default: "waiting"
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model("Appointment", appointmentSchema);