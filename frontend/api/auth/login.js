const connectToDatabase = require('../_db');
const { User } = require('../_models');

module.exports = async (req, res) => {
  await connectToDatabase();
  
  if (req.method === 'POST') {
    const { username, pin } = req.body;
    if (!username || !pin) return res.status(400).json({ error: 'Username and PIN requried' });
    
    try {
      let user = await User.findOne({ username });
      if (!user) {
        user = new User({ username, pin });
        await user.save();
      } else if (user.pin !== pin) {
        return res.status(401).json({ error: 'Invalid PIN' });
      }
      return res.status(200).json({ id: user._id, username: user.username });
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }
  
  return res.status(404).json({ error: 'Not found' });
};
