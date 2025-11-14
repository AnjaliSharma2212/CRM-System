import express from "express";
import { PrismaClient } from "@prisma/client";
import { authenticate, authorizeRoles } from "../middleware/authMiddleware.js";

const router = express.Router();
const prisma = new PrismaClient();

/**
 * 👑 Admin: Get all users
 */
router.get(
  "/all",
  authenticate,
  authorizeRoles("ADMIN"),
  async (req, res) => {
    try {
      const users = await prisma.user.findMany({
        select: { id: true, name: true, email: true, role: true },
      });
      res.json(users);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  }
);

/**
 * 👩‍💼 Manager & Admin: View specific user details
 */
router.get(
  "/:id",
  authenticate,
  authorizeRoles("ADMIN", "MANAGER"),
  async (req, res) => {
    try {
      const user = await prisma.user.findUnique({
        where: { id: parseInt(req.params.id) },
        select: { id: true, name: true, email: true, role: true },
      });
      if (!user) return res.status(404).json({ message: "User not found" });
      res.json(user);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Error fetching user" });
    }
  }
);

/**
 * 🧑‍💼 Sales Executive: View own profile
 */
router.get(
  "/me",
  authenticate,
  authorizeRoles("SALES", "MANAGER", "ADMIN"),
  async (req, res) => {
    try {
      const user = await prisma.user.findUnique({
        where: { id: req.user.id },
        select: { id: true, name: true, email: true, role: true },
      });
      res.json(user);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Error fetching profile" });
    }
  }
);

export default router;
