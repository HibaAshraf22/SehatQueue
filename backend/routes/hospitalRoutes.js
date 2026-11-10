const express = require("express");
const Hospital = require("../models/Hospital");

const router = express.Router();

router.post("/", async (req, res) => {
  try {
    const hospital = await Hospital.create(req.body);

    res.status(201).json({
      message: "Hospital created successfully",
      hospital
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to create hospital"
    });
  }
});

router.get("/", async (req, res) => {
  try {
    const hospitals = await Hospital.find({ isActive: true });

    res.json(hospitals);
  } catch (error) {
    res.status(500).json({
      message: "Failed to get hospitals"
    });
  }
});

module.exports = router;