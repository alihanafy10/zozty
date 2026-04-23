const mongoose = require('mongoose');

let isConnected = false;

async function connectToDatabase() {
  if (isConnected) return;
  if (!process.env.MONGODB_URI) {
    throw new Error('Please define the MONGODB_URI environment variable inside Vercel');
  }
  await mongoose.connect(process.env.MONGODB_URI);
  isConnected = true;
}

module.exports = connectToDatabase;
