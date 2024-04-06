import express from 'express';
import http from 'http';
import socketio from 'socket.io';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import cors from 'cors';
import bodyParser from 'body-parser';
const userRoutes = require('./routes/userRoutes');

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new socketio.Server(server); // Instantiate socket.io server

const port = process.env.PORT || 3000;
const MONGODB_URI = process.env.MONGODB_URI;

// Middlewares
app.use(cors());
app.use(express.json()); // Handles JSON requests effectively
app.use(bodyParser.urlencoded({extended:true}));
// Routes
app.use("/api", userRoutes);

(async () => {
  try {
    await mongoose.connect(MONGODB_URI!);
    console.log(`Connected to MongoDB database`);

    // Start server only after successful connection
    server.listen(port, () => {
      console.log(`Server is listening on port ${port}`);
    });

    io.on('connection', (socket) => {
      console.log('New connection');

      socket.on('disconnect', () => {
        console.log('User disconnected');
      });
    });
  } catch (error) {
    console.error('Error connecting to MongoDB or starting server:', error);
    process.exit(1); 
  }
})();
