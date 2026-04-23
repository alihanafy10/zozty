const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const User = require('./models/User');
const Note = require('./models/Note');
const Message = require('./models/Message');

const app = express();

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

app.post('/api/messages', async (req, res) => {
  try {
    const msg = new Message({ text: req.body.text, sender: req.body.senderId });
    await msg.save();
    await msg.populate('sender', 'username');
    res.status(201).json(msg);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

module.exports = app;
