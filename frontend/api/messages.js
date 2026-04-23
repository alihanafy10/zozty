const connectToDatabase = require('./_db');
const { Message } = require('./_models');

module.exports = async (req, res) => {
  await connectToDatabase();
  
  if (req.method === 'GET') {
    try {
      const messages = await Message.find().sort('createdAt').populate('sender', 'username');
      return res.status(200).json(messages);
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }
  
  if (req.method === 'POST') {
    try {
      const msg = new Message({ text: req.body.text, sender: req.body.senderId });
      await msg.save();
      await msg.populate('sender', 'username');
      return res.status(201).json(msg);
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }
  
  return res.status(404).json({ error: 'Not found' });
};
