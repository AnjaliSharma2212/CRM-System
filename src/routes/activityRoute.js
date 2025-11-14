import express from "express";
import { PrismaClient } from "@prisma/client";
import { authenticate } from "../middleware/authMiddleware.js";
import { io } from "../server.js";

const router = express.Router();
const prisma = new PrismaClient();

// Create activity
router.post("/", authenticate, async (req, res) => {
  try {
    const { leadId, type, note, when } = req.body;

    const activity = await prisma.activity.create({
      data: {
        leadId,
        type,
        note,
        when,
        createdBy: req.user.id,
        userId: req.user.id
      }
    });

    // Emit REALTIME activity update to assigned user
    io.to(req.user.id).emit("activityCreated", {
      message: "New activity added",
      activity
    });

    res.status(201).json(activity);
  } catch (err) {
    res.status(500).json({ message: "Failed to create activity" });
  }
});

// Fetch activity for a lead
router.get("/:leadId", authenticate, async (req, res) => {
  try {
    const activities = await prisma.activity.findMany({
      where: { leadId: req.params.leadId },
      orderBy: { createdAt: "desc" }
    });

    res.json(activities);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch activities" });
  }
});


io.on("some-event", (data) => {
  console.log(data);
});

export default router;
