const express = require("express");
const Doctor = require("../models/Doctor");
const Appointment = require("../models/Appointment");
const Notification = require("../models/Notification");
const User = require("../models/User");

const {
  authMiddleware,
  adminMiddleware
} = require("../middleware/authMiddleware");

const {
  getPakistanDayRange
} = require("../utils/pakistanDate");

const router = express.Router();

router.get(
  "/doctor/:doctorId/queue",
  authMiddleware,
  adminMiddleware,
  async (req, res) => {
    try {
      const { doctorId } = req.params;
      const { date } = req.query;

      if (!date) {
        return res.status(400).json({
          message: "Date is required. Use ?date=YYYY-MM-DD"
        });
      }

      const { startOfDay, endOfDay } =
        getPakistanDayRange(date);

      const doctor = await Doctor.findById(doctorId)
        .populate("department", "name")
        .populate("hospital", "name");

      if (!doctor) {
        return res.status(404).json({
          message: "Doctor not found"
        });
      }

      const appointments = await Appointment.find({
        doctor: doctorId,
        appointmentDate: {
          $gte: startOfDay,
          $lte: endOfDay
        }
      })
        .populate("patient", "name email")
        .sort({ tokenNumber: 1 });

      const currentAppointment = appointments.find(
        (appointment) => appointment.status === "called"
      );

      res.json({
        date,
        doctor: {
          id: doctor._id,
          name: doctor.name,
          specialization: doctor.specialization,
          department: doctor.department,
          hospital: doctor.hospital,
          isAvailable: doctor.isAvailable
        },
        nowServing: currentAppointment
          ? currentAppointment.tokenNumber
          : 0,
        totalAppointments: appointments.length,
        appointments
      });
    } catch (error) {
      res.status(500).json({
        message: "Failed to get admin queue"
      });
    }
  }
);

router.get(
  "/doctors/hospital/:hospitalId",
  authMiddleware,
  adminMiddleware,
  async (req, res) => {
    try {
      const doctors = await Doctor.find({
        hospital: req.params.hospitalId
      }).populate("department", "name");

      res.json(doctors);
    } catch (error) {
      res.status(500).json({
        message: "Failed to get doctors"
      });
    }
  }
);

router.patch(
  "/doctor/:doctorId/availability",
  authMiddleware,
  adminMiddleware,
  async (req, res) => {
    try {
      const { isAvailable } = req.body;

      if (typeof isAvailable !== "boolean") {
        return res.status(400).json({
          message: "isAvailable must be true or false"
        });
      }

      const doctor = await Doctor.findByIdAndUpdate(
        req.params.doctorId,
        { isAvailable },
        { new: true }
      );

      if (!doctor) {
        return res.status(404).json({
          message: "Doctor not found"
        });
      }

      res.json({
        message: "Doctor availability updated",
        doctor
      });
    } catch (error) {
      res.status(500).json({
        message: "Failed to update doctor availability"
      });
    }
  }
);

router.patch(
  "/appointment/:appointmentId/status",
  authMiddleware,
  adminMiddleware,
  async (req, res) => {
    try {
      const { status } = req.body;

      const allowedStatuses = [
        "waiting",
        "called",
        "completed",
        "no-show",
        "cancelled"
      ];

      if (!allowedStatuses.includes(status)) {
        return res.status(400).json({
          message: "Invalid appointment status"
        });
      }

      const appointment = await Appointment.findByIdAndUpdate(
        req.params.appointmentId,
        { status },
        { new: true }
      ).populate("patient", "name email");

      if (!appointment) {
        return res.status(404).json({
          message: "Appointment not found"
        });
      }

      res.json({
        message: "Appointment status updated",
        appointment
      });
    } catch (error) {
      res.status(500).json({
        message: "Failed to update appointment status"
      });
    }
  }
);

// admin permanently deletes appointment
router.delete(
  "/appointment/:appointmentId",
  authMiddleware,
  adminMiddleware,
  async (req, res) => {
    try {
      const appointment = await Appointment.findById(
        req.params.appointmentId
      );

      if (!appointment) {
        return res.status(404).json({
          message: "Appointment not found"
        });
      }

      await Notification.deleteMany({
        appointment: appointment._id
      });

      await Appointment.findByIdAndDelete(appointment._id);

      res.json({
        message: "Appointment deleted successfully"
      });

    } catch (error) {
      console.log(error);

      res.status(500).json({
        message: "Failed to delete appointment"
      });
    }
  }
);

router.get(
  "/patients",
  authMiddleware,
  adminMiddleware,
  async (req, res) => {
    try {
      const appointments = await Appointment.find()
        .distinct("patient");

      const patients = await User.find({
        _id: { $in: appointments },
        role: "patient"
      }).select("name email role");

      res.json(patients);
    } catch (error) {
      res.status(500).json({
        message: "Failed to get patients"
      });
    }
  }
);

router.get(
  "/appointments",
  authMiddleware,
  adminMiddleware,
  async (req, res) => {
    try {
      const appointments = await Appointment.find()
        .populate("patient", "name email")
        .populate("doctor", "name specialization")
        .populate("department", "name")
        .sort({ appointmentDate: -1 });

      res.json(appointments);
    } catch (error) {
      res.status(500).json({
        message: "Failed to get appointments"
      });
    }
  }
);

module.exports = router;