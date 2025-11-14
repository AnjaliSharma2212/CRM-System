import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import http from "http";
import { Server } from "socket.io";
import activityRoutes from "./routes/activityRoute.js";
import authRoutes from "./routes/authRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import leadRoutes from "./routes/leadRoutes.js";
import dashboardRoutes from "./routes/dashboardRoutes.js";

dotenv.config();

const app = express();
const server = http.createServer(app);

// CORS setup
const allowedOrigins = [
  "http://localhost:5173",
  process.env.FRONTEND_URL, // must be set on Render
];

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) return callback(null, true);
      if (!allowedOrigins.includes(origin)) {
        return callback(new Error("CORS not allowed"), false);
      }
      return callback(null, true);
    },
    credentials: true,
  })
);

app.use(express.json());

// SOCKET.IO setup
export const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST"],
    credentials: true,
  },
});

io.on("connection", (socket) => {
  console.log("Socket connected:", socket.id);

  // Join a private room for the user
  socket.on("join", (userId) => {
    console.log("User joined room:", userId);
    socket.join(userId);
  });

  socket.on("disconnect", () => {
    console.log("Client disconnected:", socket.id);
  });
});

// ROUTES
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/leads", leadRoutes);
app.use("/api/activities", activityRoutes(io)); // pass io here
app.use("/api/dashboard", dashboardRoutes);

app.get("/", (req, res) => {
  res.send("CRM Backend running 🚀");
});

// START SERVER
const PORT = process.env.PORT || 4000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
