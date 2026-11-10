
const express = require("express");
const Appointment = require("../models/Appointment");
const { authMiddleware } = require("../middleware/authMiddleware");
const {
  getPakistanDateString,
  getPakistanDayRange
} = require("../utils/pakistanDate");

const router = express.Router();

router.get("/doctor/:doctorId/date/:date", async (req, res) => {
  try {
    const { doctorId, date } = req.params;

    const { startOfDay, endOfDay } =
  getPakistanDayRange(date);

    const appointments = await Appointment.find({
      doctor: doctorId,
      appointmentDate: {
        $gte: startOfDay,
        $lte: endOfDay
      },
      status: {
        $nin: ["cancelled", "no-show"]
      }
    }).sort({ tokenNumber: 1 });

    const currentAppointment = appointments.find(
      (appointment) => appointment.status === "called"
    );

    const nowServing = currentAppointment
      ? currentAppointment.tokenNumber
      : 0;

    const queue = appointments.map((appointment) => ({
      tokenNumber: appointment.tokenNumber,
      patient: appointment.patient,
      status: appointment.status
    }));

    res.json({
      nowServing,
      queue
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to get queue"
    });
  }
});

// patient queue status
router.get("/patient/:appointmentId", authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== "patient") {
      return res.status(403).json({
        message: "Patient access required"
      });
    }

    const appointment = await Appointment.findById(
      req.params.appointmentId
    );

    if (!appointment) {
      return res.status(404).json({
        message: "Appointment not found"
      });
    }

    if (appointment.patient.toString() !== req.user.id) {
      return res.status(403).json({
        message: "You can only access your own appointment"
      });
    }

    const pakistanDateString = getPakistanDateString(
  appointment.appointmentDate
);

const { startOfDay, endOfDay } =
  getPakistanDayRange(pakistanDateString);

    const appointmentsBefore = await Appointment.countDocuments({
      doctor: appointment.doctor,
      appointmentDate: {
        $gte: startOfDay,
        $lte: endOfDay
      },
      tokenNumber: {
        $lt: appointment.tokenNumber
      },
      status: {
        $nin: ["completed", "cancelled", "no-show"]
      }
    });

    const currentAppointment = await Appointment.findOne({
      doctor: appointment.doctor,
      appointmentDate: {
        $gte: startOfDay,
        $lte: endOfDay
      },
      status: "called"
    }).sort({ tokenNumber: -1 });

    const nowServing = currentAppointment
      ? currentAppointment.tokenNumber
      : 0;

    res.json({
      yourToken: appointment.tokenNumber,
      nowServing,
      patientsBeforeYou: appointmentsBefore,
      status: appointment.status
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to get patient queue status"
    });
  }
});

module.exports = router;
