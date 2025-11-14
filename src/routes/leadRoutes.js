import express from "express";
import { PrismaClient } from "@prisma/client";
import { authenticate, authorizeRoles } from "../middleware/authMiddleware.js";
import { io } from "../server.js";
import { sendEmail } from "../utils/email.js";
const router = express.Router();
const prisma = new PrismaClient();

/**
 * 🧩 Create a new lead (Sales, Manager, Admin)
 */
router.post(
  "/",
  authenticate,
  authorizeRoles("SALES", "MANAGER", "ADMIN"),
  async (req, res) => {
    try {
      const { name, email, phone, company, source } = req.body;
      const ownerId = req.user.id;

      const lead = await prisma.lead.create({
        data: {
          name,
          email,
          phone,
          company,
          source,
          ownerId,
        },
      });

      // Add history log
      await prisma.leadHistory.create({
        data: {
          leadId: lead.id,
          action: "created",
          meta: { ownerId },
          actorId: req.user.id,
        },
      });

      // Send WebSocket notification to Admin & Manager
      io.emit("newLead", {
        message: `New lead created by ${req.user.name}`,
        leadId: lead.id,
      });

      res.status(201).json(lead);
    } catch (error) {
      console.error("Lead Create Error:", error);
      res.status(500).json({ message: "Failed to create lead" });
    }
  }
);

/**
 * 🧾 Get All Leads
 * Admin → All Leads
 * Others → Only Assigned / Owned
 */
router.get("/", authenticate, async (req, res) => {
  try {
    const isAdmin = req.user.role === "ADMIN";

    const where = isAdmin
      ? { deleted: false }
      : { ownerId: req.user.id, deleted: false };

    const leads = await prisma.lead.findMany({
      where,
      include: {
        owner: { select: { id: true, name: true, email: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    res.json(leads);
  } catch (error) {
    console.error("Fetch Leads Error:", error);
    res.status(500).json({ message: "Failed to fetch leads" });
  }
});

/**
 * 📄 Get Single Lead
 */
router.get("/:id", authenticate, async (req, res) => {
  try {
    const { id } = req.params;

    const lead = await prisma.lead.findUnique({
      where: { id },
      include: {
        owner: true,
        history: { orderBy: { createdAt: "desc" } },
      },
    });

    if (!lead || lead.deleted)
      return res.status(404).json({ message: "Lead not found" });

    // Only admin or owner can view
    if (req.user.role !== "ADMIN" && lead.ownerId !== req.user.id)
      return res.status(403).json({ message: "Not allowed" });

    res.json(lead);
  } catch (error) {
    console.error("Get Lead Error:", error);
    res.status(500).json({ message: "Failed to fetch lead" });
  }
});

/**
 * ✏️ Update Lead
 */
router.put(
  "/:id",
  authenticate,
  authorizeRoles("SALES", "MANAGER", "ADMIN"),
  async (req, res) => {
    try {
      const { id } = req.params;
      const { name, email, phone, company, status, ownerId } = req.body;

      const existing = await prisma.lead.findUnique({ where: { id } });

      if (!existing || existing.deleted)
        return res.status(404).json({ message: "Lead not found" });

      if (req.user.role !== "ADMIN" && existing.ownerId !== req.user.id)
        return res.status(403).json({ message: "Unauthorized" });

      const updated = await prisma.lead.update({
        where: { id },
        data: { name, email, phone, company, status, ownerId },
      });

      // Add history entry
      await prisma.leadHistory.create({
        data: {
          leadId: updated.id,
          action: "updated",
          meta: { name, email, phone, company, status },
          actorId: req.user.id,
        },
      });

      // Notify assigned user (via socket)
      if (ownerId) {
        io.to(ownerId).emit("leadAssigned", {
          message: "A lead was assigned to you",
          leadId: updated.id,
        });
      }

      res.json(updated);
    } catch (error) {
      console.error("Update Lead Error:", error);
      res.status(500).json({ message: "Failed to update lead" });
    }
  }
);

/**
 * 🗑 Soft Delete Lead
 */
router.delete("/:id",
  authenticate,
  authorizeRoles("SALES", "MANAGER", "ADMIN"),
  async (req, res) => {
    try {
      const { id } = req.params;

      const existing = await prisma.lead.findUnique({ where: { id } });

      if (!existing)
        return res.status(404).json({ message: "Lead not found" });

      if (req.user.role !== "ADMIN" && existing.ownerId !== req.user.id)
        return res.status(403).json({ message: "Unauthorized" });

      await prisma.lead.update({
        where: { id },
        data: { deleted: true },
      });

      await prisma.leadHistory.create({
        data: {
          leadId: id,
          action: "deleted",
          actorId: req.user.id,
        },
      });

      res.json({ message: "Lead deleted" });
    } catch (error) {
      console.error("Delete Lead Error:", error);
      res.status(500).json({ message: "Failed to delete lead" });
    }
  }
);


export default router;
