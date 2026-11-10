
const express = require("express");
const Appointment = require("../models/Appointment");
const Notification = require("../models/Notification");
const Doctor = require("../models/Doctor");
const User = require("../models/User");
const {
  authMiddleware,
  adminMiddleware
} = require("../middleware/authMiddleware");
const {
  getPakistanDateString,
  getPakistanWeekday,
  getPakistanDayRange
} = require("../utils/pakistanDate");

const router = express.Router();

// create notification
const createNotification = async (title, message, type, hospital, appointment) => {
  await Notification.create({
    title,
    message,
    type,
    hospital,
    appointment
  });
};

// get current Pakistan time in minutes
const getPakistanTimeMinutes = () => {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Karachi",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23"
  }).formatToParts(new Date());

  const hour = Number(parts.find(part => part.type === "hour").value);
  const minute = Number(parts.find(part => part.type === "minute").value);

  return hour * 60 + minute;
};

// convert doctor time into minutes
const getTimeMinutes = (time) => {
  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(time)) {
    return null;
  }

  const [hour, minute] = time.split(":").map(Number);
  return hour * 60 + minute;
};

// check duplicate appointment
const findDuplicateAppointment = async (
  patient,
  doctor,
  startOfDay,
  endOfDay
) => {
  return await Appointment.findOne({
    patient,
    doctor,
    appointmentDate: {
      $gte: startOfDay,
      $lte: endOfDay
    },
    status: { $ne: "cancelled" }
  });
};

// online appointment
router.post("/", async (req, res) => {
  try {
    const {
      patient,
      hospital,
      department,
      doctor,
      appointmentDate
    } = req.body;

    if (!patient || !hospital || !department || !doctor || !appointmentDate) {
      return res.status(400).json({
        message: "All appointment fields are required"
      });
    }

    const date = new Date(appointmentDate);

    if (isNaN(date.getTime())) {
      return res.status(400).json({
        message: "Invalid appointment date"
      });
    }

    const pakistanDateString = getPakistanDateString(date);
    const todayString = getPakistanDateString(new Date());

    // allow same-day appointments only
    if (pakistanDateString !== todayString) {
      return res.status(400).json({
        message: "Only same-day appointments can be booked"
      });
    }

    const selectedDay = getPakistanWeekday(date);

    const { startOfDay, endOfDay } =
      getPakistanDayRange(pakistanDateString);

    const doctorData = await Doctor.findById(doctor);

    if (!doctorData) {
      return res.status(404).json({
        message: "Doctor not found"
      });
    }

    if (!doctorData.isAvailable) {
      return res.status(400).json({
        message: "This doctor is currently unavailable"
      });
    }

    if (!doctorData.workingDays.includes(selectedDay)) {
      return res.status(400).json({
        message: `Doctor is not available on ${selectedDay}`
      });
    }

    if (
      doctorData.hospital.toString() !== hospital ||
      doctorData.department.toString() !== department
    ) {
      return res.status(400).json({
        message: "Invalid doctor, hospital or department selection"
      });
    }

    // check online booking time
    const consultationStart = getTimeMinutes(
      doctorData.consultationStart
    );

    const consultationEnd = getTimeMinutes(
      doctorData.consultationEnd
    );

    if (
      consultationStart === null ||
      consultationEnd === null ||
      consultationEnd <= consultationStart
    ) {
      return res.status(400).json({
        message: "Doctor consultation timings are invalid"
      });
    }

    const bookingOpenTime = 10 * 60;
    const bookingCloseTime = Math.min(
      consultationStart + 60,
      consultationEnd
    );

    const currentTime = getPakistanTimeMinutes();

    if (currentTime < bookingOpenTime) {
      return res.status(400).json({
        message: "Online booking opens at 10:00 AM"
      });
    }

    if (currentTime >= bookingCloseTime) {
      return res.status(400).json({
        message: "Online booking time has closed for today"
      });
    }

    // check maximum 25 online tokens
    const onlineTokenCount = await Appointment.countDocuments({
      doctor,
      appointmentDate: {
        $gte: startOfDay,
        $lte: endOfDay
      },
      source: "online"
    });

    if (onlineTokenCount >= 25) {
      return res.status(400).json({
        message: "Maximum 25 online tokens have already been issued for this doctor today"
      });
    }

    const duplicateAppointment = await findDuplicateAppointment(
      patient,
      doctor,
      startOfDay,
      endOfDay
    );

    if (duplicateAppointment) {
      return res.status(409).json({
        message: "You already have an appointment with this doctor on this date."
      });
    }

    // get next shared token number
    const lastAppointment = await Appointment.findOne({
      doctor,
      appointmentDate: {
        $gte: startOfDay,
        $lte: endOfDay
      }
    }).sort({ tokenNumber: -1 });

    const tokenNumber = lastAppointment
      ? lastAppointment.tokenNumber + 1
      : 1;

    const appointment = await Appointment.create({
      patient,
      hospital,
      department,
      doctor,
      appointmentDate: date,
      tokenNumber,
      source: "online"
    });

    await createNotification(
      "New Appointment",
      `A new online appointment has been booked. Token number: ${tokenNumber}`,
      "new-appointment",
      hospital,
      appointment._id
    );

    res.status(201).json({
      message: "Appointment booked successfully",
      appointment
    });

  } catch (error) {
    console.log(error);

    res.status(500).json({
      message: "Failed to book appointment"
    });
  }
});

// get patient appointments
router.get("/patient/:patientId", async (req, res) => {
  try {
    const appointments = await Appointment.find({
      patient: req.params.patientId
    })
      .populate("hospital", "name")
      .populate("department", "name")
      .populate("doctor", "name specialization")
      .sort({ appointmentDate: -1 });

    res.json(appointments);
  } catch (error) {
    res.status(500).json({
      message: "Failed to get patient appointments"
    });
  }
});

// get doctor appointments
router.get("/doctor/:doctorId", async (req, res) => {
  try {
    const appointments = await Appointment.find({
      doctor: req.params.doctorId
    })
      .populate("patient", "name email")
      .populate("doctor", "name specialization")
      .populate("department", "name")
      .populate("hospital", "name")
      .sort({ appointmentDate: 1, tokenNumber: 1 });

    res.json(appointments);
  } catch (error) {
    res.status(500).json({
      message: "Failed to get doctor queue"
    });
  }
});

// patient cancel appointment
router.patch("/:id/cancel", authMiddleware, async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id);

    if (!appointment) {
      return res.status(404).json({
        message: "Appointment not found"
      });
    }

    if (appointment.patient.toString() !== req.user.id) {
      return res.status(403).json({
        message: "You are not allowed to cancel this appointment"
      });
    }

    if (appointment.status !== "waiting") {
      return res.status(400).json({
        message: "Only waiting appointments can be cancelled"
      });
    }

    appointment.status = "cancelled";
    await appointment.save();

    await createNotification(
      "Appointment Cancelled",
      `Patient cancelled token ${appointment.tokenNumber}.`,
      "appointment-status",
      appointment.hospital,
      appointment._id
    );

    res.json({
      message: "Appointment cancelled successfully",
      appointment
    });

  } catch (error) {
    console.log(error);

    res.status(500).json({
      message: "Failed to cancel appointment"
    });
  }
});

// update appointment status
router.patch("/:id/status", async (req, res) => {
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
        message: "Invalid status"
      });
    }

    const appointment = await Appointment.findById(req.params.id);

    if (!appointment) {
      return res.status(404).json({
        message: "Appointment not found"
      });
    }

    const previousStatus = appointment.status;
    appointment.status = status;
    await appointment.save();

    if (previousStatus !== status) {
      await createNotification(
        "Appointment Status Updated",
        `Token ${appointment.tokenNumber} status changed from ${previousStatus} to ${status}.`,
        "appointment-status",
        appointment.hospital,
        appointment._id
      );
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
});

// create walk-in appointment
router.post(
  "/walk-in",
  authMiddleware,
  adminMiddleware,
  async (req, res) => {
    let createdPatient = null;

    try {
      const {
        name,
        phone,
        hospital,
        department,
        doctor,
        appointmentDate
      } = req.body;

      if (!name || !hospital || !department || !doctor || !appointmentDate) {
        return res.status(400).json({
          message: "Patient name and appointment details are required"
        });
      }

      const date = new Date(appointmentDate);

      if (isNaN(date.getTime())) {
        return res.status(400).json({
          message: "Invalid appointment date"
        });
      }

      const pakistanDateString = getPakistanDateString(date);
      const todayString = getPakistanDateString(new Date());

      // allow same-day walk-in appointments only
      if (pakistanDateString !== todayString) {
        return res.status(400).json({
          message: "Walk-in appointments can only be created for today"
        });
      }

      const doctorData = await Doctor.findById(doctor);

      if (!doctorData || !doctorData.isAvailable) {
        return res.status(400).json({
          message: "Doctor not found or currently unavailable"
        });
      }

      if (
        doctorData.hospital.toString() !== hospital ||
        doctorData.department.toString() !== department
      ) {
        return res.status(400).json({
          message: "Invalid doctor, hospital or department selection"
        });
      }

      const selectedDay = getPakistanWeekday(date);

      if (!doctorData.workingDays.includes(selectedDay)) {
        return res.status(400).json({
          message: `Doctor is not available on ${selectedDay}`
        });
      }

      const { startOfDay, endOfDay } =
        getPakistanDayRange(pakistanDateString);

      // create walk-in patient record
      createdPatient = await User.create({
        name: name.trim(),
        phone: phone ? phone.trim() : "",
        role: "patient",
        isWalkIn: true
      });

      // get next shared token number
      const lastAppointment = await Appointment.findOne({
        doctor,
        appointmentDate: {
          $gte: startOfDay,
          $lte: endOfDay
        }
      }).sort({ tokenNumber: -1 });

      const tokenNumber = lastAppointment
        ? lastAppointment.tokenNumber + 1
        : 1;

      const appointment = await Appointment.create({
        patient: createdPatient._id,
        hospital,
        department,
        doctor,
        appointmentDate: date,
        tokenNumber,
        source: "walk-in",
        status: "waiting"
      });

      await createNotification(
        "New Walk-in Patient",
        `Walk-in patient ${name} has been added. Token number: ${tokenNumber}`,
        "walk-in",
        hospital,
        appointment._id
      );

      res.status(201).json({
        message: "Walk-in appointment created successfully",
        patient: {
          id: createdPatient._id,
          name: createdPatient.name,
          phone: createdPatient.phone
        },
        appointment
      });

    } catch (error) {
      if (createdPatient) {
        await User.deleteOne({ _id: createdPatient._id }).catch(() => {});
      }

      console.log(error);

      res.status(500).json({
        message: "Failed to create walk-in appointment"
      });
    }
  }
);

module.exports = router;
