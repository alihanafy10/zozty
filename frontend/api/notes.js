const connectToDatabase = require('./_db');
const { Note } = require('./_models');

module.exports = async (req, res) => {
  await connectToDatabase();
  
  if (req.method === 'GET') {
    try {
      const notes = await Note.find().populate('owner', 'username');
      return res.status(200).json(notes);
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }
  
  if (req.method === 'POST') {
    try {
      const { text, category, ownerId } = req.body;
      const note = new Note({ text, category, owner: ownerId });
      await note.save();
      await note.populate('owner', 'username');
      return res.status(201).json(note);
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }
  
  return res.status(404).json({ error: 'Not found' });
};
