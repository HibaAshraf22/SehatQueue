
const express = require("express");
const Doctor = require("../models/Doctor");

const router = express.Router();

const validDays = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday"
];

// create doctor
router.post("/", async (req, res) => {
  try {
    const doctor = await Doctor.create(req.body);

    res.status(201).json({
      message: "Doctor created successfully",
      doctor
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to create doctor"
    });
  }
});

// get doctors by hospital
router.get("/hospital/:hospitalId", async (req, res) => {
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
});

// get doctors by department
router.get("/department/:departmentId", async (req, res) => {
  try {
    const doctors = await Doctor.find({
      department: req.params.departmentId
    }).populate("department", "name");

    res.json(doctors);
  } catch (error) {
    res.status(500).json({
      message: "Failed to get doctors"
    });
  }
});

// update doctor availability
router.patch("/:id/availability", async (req, res) => {
  try {
    const doctor = await Doctor.findByIdAndUpdate(
      req.params.id,
      {
        isAvailable: req.body.isAvailable
      },
      { new: true, runValidators: true }
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
      message: "Failed to update availability"
    });
  }
});

// update doctor working schedule
router.patch("/:id/schedule", async (req, res) => {
  try {
    const { workingDays, consultationStart, consultationEnd } = req.body;

    if (
      !Array.isArray(workingDays) ||
      workingDays.some(day => !validDays.includes(day))
    ) {
      return res.status(400).json({
        message: "Please provide valid working days"
      });
    }

    const doctor = await Doctor.findByIdAndUpdate(
      req.params.id,
      {
        workingDays,
        consultationStart,
        consultationEnd
      },
      {
        new: true,
        runValidators: true
      }
    );

    if (!doctor) {
      return res.status(404).json({
        message: "Doctor not found"
      });
    }

    res.json({
      message: "Doctor schedule updated successfully",
      doctor
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to update doctor schedule"
    });
  }
});

module.exports = router;
