
const mongoose = require("mongoose");

const doctorSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true
    },
    specialization: {
      type: String,
      required: true
    },
    department: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Department",
      required: true
    },
    hospital: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Hospital",
      required: true
    },
    isAvailable: {
      type: Boolean,
      default: true
    },
    consultationStart: {
      type: String,
      required: true
    },
    consultationEnd: {
      type: String,
      required: true
    },
    workingDays: {
      type: [{
        type: String,
        enum: [
          "Monday",
          "Tuesday",
          "Wednesday",
          "Thursday",
          "Friday",
          "Saturday",
          "Sunday"
        ]
      }],
      default: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model("Doctor", doctorSchema);
