const express = require("express");
const Notification = require("../models/Notification");
const { authMiddleware, adminMiddleware } = require("../middleware/authMiddleware");

const router = express.Router();

// get all notifications
router.get("/", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const notifications = await Notification.find()
      .populate("appointment")
      .sort({ createdAt: -1 });

    res.json(notifications);
  } catch (error) {
    res.status(500).json({
      message: "Failed to get notifications"
    });
  }
});

// get unread notification count
router.get("/unread-count", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const count = await Notification.countDocuments({
      isRead: false
    });

    res.json({ count });
  } catch (error) {
    res.status(500).json({
      message: "Failed to get unread count"
    });
  }
});

// mark notification as read
router.patch("/:id/read", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const notification = await Notification.findByIdAndUpdate(
      req.params.id,
      { isRead: true },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({
        message: "Notification not found"
      });
    }

    res.json({
      message: "Notification marked as read",
      notification
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to update notification"
    });
  }
});

// mark all notifications as read
router.patch("/read-all", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    await Notification.updateMany(
      { isRead: false },
      { isRead: true }
    );

    res.json({
      message: "All notifications marked as read"
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to update notifications"
    });
  }
});

// delete notification
router.delete("/:id", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const notification = await Notification.findByIdAndDelete(req.params.id);

    if (!notification) {
      return res.status(404).json({
        message: "Notification not found"
      });
    }

    res.json({
      message: "Notification deleted successfully"
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to delete notification"
    });
  }
});

module.exports = router;