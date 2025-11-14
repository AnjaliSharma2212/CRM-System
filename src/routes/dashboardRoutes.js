import express from "express";
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();



const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const totalLeads = await prisma.lead.count();
    const totalUsers = await prisma.user.count();
    const totalActivities = await prisma.activity.count();

    const leadsByMonth = await prisma.lead.groupBy({
      by: ["createdAt"],
      _count: { createdAt: true },
    });

    const leadStatus = await prisma.lead.groupBy({
      by: ["status"],
      _count: { status: true },
    });

    const activitiesByType = await prisma.activity.groupBy({
      by: ["type"],
      _count: { type: true },
    });

    res.json({
      success: true,
      data: {
        totals: {
          leads: totalLeads,
          users: totalUsers,
          activities: totalActivities,
        },
        charts: {
          leadsByMonth,
          leadStatus,
          activitiesByType,
        },
      },
    });
  } catch (error) {
    console.error("Dashboard Error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

export default router;
