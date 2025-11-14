

import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import http from "http";              
import { Server } from "socket.io";   
import activityRoutes from "./routes/activityRoute.js";
import authRoutes from "./routes/authRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import leadRoutes from "./routes/leadRoutes.js";
import dashboardRoutes from "./routes/dashboardRoutes.js"


dotenv.config();

const app = express();
// Create HTTP server
const server = http.createServer(app);
// CORS configuration
const allowedOrigins = [
  'http://localhost:5173', // dev frontend
  process.env.FRONTEND_URL  // production frontend
];

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) return callback(null, true); // allow Postman/curl
      if (allowedOrigins.indexOf(origin) === -1) {
        return callback(new Error('CORS not allowed'), false);
      }
      return callback(null, true);
    },
    credentials: true,
  })
);

app.use(express.json());

// Example route
app.post('/api/auth/register', (req, res) => {
  // Your registration logic
  res.json({ message: 'User registered successfully' });
});

// SOCKET.IO SETUP
const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

io.on('connection', (socket) => {
  console.log('New client connected:', socket.id);

  socket.on('message', (data) => {
    console.log('Message received:', data);
    io.emit('message', data); // broadcast to all clients
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});
app.use(express.json());




// SOCKET CONNECT
io.on("connection", (socket) => {
  console.log("Socket connected:", socket.id);

  socket.on("join", (userId) => {
    console.log("User joined room:", userId);
    socket.join(userId);
  });
});

// ROUTES
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/leads", leadRoutes);
app.use("/api/activities", activityRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.get("/", (req, res) => {
  res.send("CRM Backend running 🚀");
});

// START SERVER
const PORT = process.env.PORT || 4000;
server.listen(PORT, () =>
  console.log(`Server running on http://localhost:${PORT}`)
);


