const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  pin: { type: String, required: true }
}, { timestamps: true });

const noteSchema = new mongoose.Schema({
  text: { type: String, required: true },
  category: { type: String, enum: ['Good', 'Bad'], required: true },
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true });

const messageSchema = new mongoose.Schema({
  text: { type: String, required: true },
  sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true });

const User = mongoose.models.User || mongoose.model('User', userSchema);
const Note = mongoose.models.Note || mongoose.model('Note', noteSchema);
const Message = mongoose.models.Message || mongoose.model('Message', messageSchema);

module.exports = { User, Note, Message };
