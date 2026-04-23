import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Send } from 'lucide-react';
import { API_URL } from '../config';

const ChatBox = ({ currentUser }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const scrollRef = useRef();

  const fetchMessages = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/messages`);
      setMessages(res.data);
    } catch (err) {
      console.error('Error fetching messages', err);
    }
  };

  useEffect(() => {
    fetchMessages();
    const interval = setInterval(fetchMessages, 3000); // Poll every 3 seconds
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    try {
      const msgData = { text: newMessage, senderId: currentUser.id };
      setNewMessage('');
      // Optimistic URL Update or direct fetch
      await axios.post(`${API_URL}/api/messages`, msgData);
      fetchMessages(); // Immediately pull new message
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="flex flex-col h-[500px] bg-white dark:bg-slate-800 rounded-2xl shadow-xl overflow-hidden border border-slate-200 dark:border-slate-700">
      <div className="p-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80">
        <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
          Live Chat (Vercel Polling)
        </h3>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg, idx) => {
          const isMe = msg.sender?._id === currentUser.id;
          return (
            <div key={idx} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
              <span className="text-xs text-slate-500 dark:text-slate-400 mb-1 px-1">
                {msg.sender?.username}
              </span>
              <div 
                className={`max-w-[75%] px-4 py-2 rounded-2xl ${
                  isMe 
                    ? 'bg-brand-600 text-white rounded-tr-sm shadow-md shadow-brand-500/20' 
                    : 'bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-100 rounded-tl-sm shadow-sm'
                }`}
              >
                <p className="text-sm">{msg.text}</p>
              </div>
            </div>
          );
        })}
        <div ref={scrollRef} />
      </div>

      <form onSubmit={handleSend} className="p-4 border-t border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
        <div className="relative flex items-center">
          <input
            type="text"
            className="w-full pl-4 pr-12 py-3 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-full focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm text-slate-900 dark:text-white"
            placeholder="Type a message..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
          />
          <button
            type="submit"
            disabled={!newMessage.trim()}
            className="absolute right-1 p-2 bg-brand-600 hover:bg-brand-700 text-white rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send size={18} />
          </button>
        </div>
      </form>
    </div>
  );
};

export default ChatBox;
