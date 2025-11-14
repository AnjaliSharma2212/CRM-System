import { createServer } from 'http';
import { Server } from 'socket.io';
const httpServer = createServer(app);
const io = new Server(httpServer, { cors: { origin: '*' } });

io.use((socket, next)=> {
  const token = socket.handshake.auth?.token;
  try { socket.user = jwt.verify(token, process.env.JWT_SECRET); next(); }
  catch(e){ next(new Error("auth error")) }
});

io.on("connection", socket=>{
  socket.join(socket.user.id); // personal room
});
httpServer.listen(PORT);
