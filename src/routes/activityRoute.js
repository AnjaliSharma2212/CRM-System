import express from "express";
import { PrismaClient } from "@prisma/client";
import { authenticate } from "../middleware/authMiddleware.js";

const prisma = new PrismaClient();

export default function activityRoutes(io) {
  const router = express.Router();

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
          userId: req.user.id,
        },
      });

      // Emit REALTIME update to the user's room
      io.to(req.user.id).emit("activityCreated", { message: "New activity added", activity });

      res.status(201).json(activity);
    } catch (err) {
      console.error("Activity creation error:", err);
      res.status(500).json({ message: "Failed to create activity", error: err.message });
    }
  });

  // Fetch activity for a lead
  router.get("/:leadId", authenticate, async (req, res) => {
    try {
      const activities = await prisma.activity.findMany({
        where: { leadId: req.params.leadId },
        orderBy: { createdAt: "desc" },
      });
      res.json(activities);
    } catch (err) {
      console.error("Fetch activity error:", err);
      res.status(500).json({ message: "Failed to fetch activities", error: err.message });
    }
  });

  return router;
}
