import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server } from 'socket.io';
import dotenv from 'dotenv';
import geoRoutes from './routes/geoRoutes';
import voteRoutes from './routes/voteRoutes';

dotenv.config();

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: '*',
  },
});

app.use(cors());
app.use(express.json());

// Routes
app.use('/api/geo', geoRoutes);
app.use('/api/votes', voteRoutes(io));

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// WebSocket connection
io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 3001;

httpServer.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
