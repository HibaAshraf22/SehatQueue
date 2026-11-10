const express = require("express");
const Department = require("../models/Department");

const router = express.Router();

router.post("/", async (req, res) => {
  try {
    const department = await Department.create(req.body);

    res.status(201).json({
      message: "Department created successfully",
      department
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to create department"
    });
  }
});

router.get("/hospital/:hospitalId", async (req, res) => {
  try {
    const departments = await Department.find({
      hospital: req.params.hospitalId,
      isActive: true
    });

    res.json(departments);
  } catch (error) {
    res.status(500).json({
      message: "Failed to get departments"
    });
  }
});

module.exports = router;