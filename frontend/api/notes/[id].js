const connectToDatabase = require('../_db');
const { Note } = require('../_models');

module.exports = async (req, res) => {
  await connectToDatabase();
  const { id } = req.query;

  if (req.method === 'PUT') {
    try {
      const { text, category, ownerId } = req.body;
      const note = await Note.findById(id);
      if (!note) return res.status(404).json({ error: 'Not found' });
      if (note.owner.toString() !== ownerId) return res.status(403).json({ error: 'Unauthorized' });
      
      note.text = text;
      note.category = category;
      await note.save();
      await note.populate('owner', 'username');
      return res.status(200).json(note);
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }
  
  if (req.method === 'DELETE') {
    try {
      const { ownerId } = req.query;
      const note = await Note.findById(id);
      if (!note) return res.status(404).json({ error: 'Not found' });
      if (note.owner.toString() !== ownerId) return res.status(403).json({ error: 'Unauthorized' });
      
      await note.deleteOne();
      return res.status(200).json({ success: true });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }
  
  return res.status(404).json({ error: 'Not found' });
};
