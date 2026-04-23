const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const User = require('./models/User');
const Note = require('./models/Note');
const Message = require('./models/Message');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE']
  }
});

app.use(cors());
app.use(express.json());

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('MongoDB Connected'))
  .catch(err => console.log('MongoDB connection error:', err));

// Routes

// 1. Auth/Login
app.post('/api/auth/login', async (req, res) => {
  const { username, pin } = req.body;
  if (!username || !pin) return res.status(400).json({ error: 'Username and PIN requried' });

  try {
    let user = await User.findOne({ username });
    if (!user) {
      // For this 2-user test app, auto-create if not exists
      user = new User({ username, pin });
      await user.save();
    } else if (user.pin !== pin) {
      return res.status(401).json({ error: 'Invalid PIN' });
    }
    res.json({ id: user._id, username: user.username });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

app.get('/api/users', async (req, res) => {
  try {
    const users = await User.find({}, '-pin');
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// 2. Notes
app.get('/api/notes', async (req, res) => {
  try {
    const notes = await Note.find().populate('owner', 'username');
    res.json(notes);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

app.post('/api/notes', async (req, res) => {
  const { text, category, ownerId } = req.body;
  try {
    const note = new Note({ text, category, owner: ownerId });
    await note.save();
    await note.populate('owner', 'username');
    io.emit('note_updated', note); // Notify all clients
    res.status(201).json(note);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

app.put('/api/notes/:id', async (req, res) => {
  const { text, category, ownerId } = req.body;
  try {
    const note = await Note.findById(req.params.id);
    if (!note) return res.status(404).json({ error: 'Not found' });
    if (note.owner.toString() !== ownerId) return res.status(403).json({ error: 'Unauthorized' });
    
    note.text = text;
    note.category = category;
    await note.save();
    await note.populate('owner', 'username');
    io.emit('note_updated', note);
    res.json(note);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

app.delete('/api/notes/:id', async (req, res) => {
  const { ownerId } = req.query;
  try {
    const note = await Note.findById(req.params.id);
    if (!note) return res.status(404).json({ error: 'Not found' });
    if (note.owner.toString() !== ownerId) return res.status(403).json({ error: 'Unauthorized' });

    await note.deleteOne();
    io.emit('note_deleted', req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// 3. Chat Messages (Initial Load)
app.get('/api/messages', async (req, res) => {
  try {
    const messages = await Message.find().sort('createdAt').populate('sender', 'username');
    res.json(messages);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Socket.io Config
io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);

  socket.on('send_message', async (data) => {
    try {
      const msg = new Message({ text: data.text, sender: data.senderId });
      await msg.save();
      await msg.populate('sender', 'username');
      io.emit('receive_message', msg);
    } catch (error) {
      console.error('Message save error:', error);
    }
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
