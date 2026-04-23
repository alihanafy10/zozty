import { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus, Trash2, Edit2, Check, X } from 'lucide-react';
import { io } from 'socket.io-client';
import { API_URL } from '../config';

const socket = io(API_URL);

const NotesDashboard = ({ currentUser }) => {
  const [notes, setNotes] = useState([]);
  const [newNote, setNewNote] = useState({ text: '', category: 'Good' });
  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState('');

  const fetchNotes = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/notes`);
      setNotes(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchNotes();

    socket.on('note_updated', (updatedNote) => {
      setNotes((prev) => {
        const exists = prev.find(n => n._id === updatedNote._id);
        if (exists) return prev.map(n => n._id === updatedNote._id ? updatedNote : n);
        return [...prev, updatedNote];
      });
    });

    socket.on('note_deleted', (deletedId) => {
      setNotes((prev) => prev.filter(n => n._id !== deletedId));
    });

    return () => {
      socket.off('note_updated');
      socket.off('note_deleted');
    };
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!newNote.text.trim()) return;
    try {
      await axios.post(`${API_URL}/api/notes`, { ...newNote, ownerId: currentUser.id });
      setNewNote({ text: '', category: 'Good' });
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`${API_URL}/api/notes/${id}?ownerId=${currentUser.id}`);
    } catch (err) {
      console.error(err);
    }
  };

  const handleEditInit = (note) => {
    setEditingId(note._id);
    setEditText(note.text);
  };

  const handleEditSave = async (note) => {
    try {
      await axios.put(`${API_URL}/api/notes/${note._id}`, { text: editText, category: note.category, ownerId: currentUser.id });
      setEditingId(null);
    } catch (err) {
      console.error(err);
    }
  };

  const myNotes = notes.filter(n => n.owner?._id === currentUser.id);
  const partnerNotes = notes.filter(n => n.owner?._id !== currentUser.id);

  const NoteCard = ({ note, isMine }) => (
    <div className={`p-4 rounded-xl border relative group transition-all hover:shadow-md ${
      note.category === 'Good' 
        ? 'bg-emerald-50/50 dark:bg-emerald-900/10 border-emerald-100 dark:border-emerald-800' 
        : 'bg-rose-50/50 dark:bg-rose-900/10 border-rose-100 dark:border-rose-800'
    }`}>
      <div className="flex justify-between items-start mb-2">
        <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
          note.category === 'Good' 
            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-800/80 dark:text-emerald-200' 
            : 'bg-rose-100 text-rose-700 dark:bg-rose-800/80 dark:text-rose-200'
        }`}>
          {note.category}
        </span>
        <span className="text-xs text-slate-400">
          {new Date(note.createdAt).toLocaleDateString()}
        </span>
      </div>

      {editingId === note._id && isMine ? (
        <div className="mt-2">
          <textarea
            className="w-full bg-white dark:bg-slate-800 border-none rounded-lg p-2 text-sm focus:ring-2 focus:ring-brand-500"
            value={editText}
            onChange={(e) => setEditText(e.target.value)}
            rows="3"
            autoFocus
          />
          <div className="flex justify-end gap-2 mt-2">
            <button onClick={() => setEditingId(null)} className="p-1 text-slate-500 hover:text-slate-700"><X size={16}/></button>
            <button onClick={() => handleEditSave(note)} className="p-1 text-emerald-500 hover:text-emerald-700"><Check size={16}/></button>
          </div>
        </div>
      ) : (
        <p className="text-slate-700 dark:text-slate-200 text-sm whitespace-pre-wrap">{note.text}</p>
      )}

      {isMine && editingId !== note._id && (
        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
          <button onClick={() => handleEditInit(note)} className="p-1.5 bg-white dark:bg-slate-800 rounded-lg text-slate-400 hover:text-brand-500 shadow-sm"><Edit2 size={14}/></button>
          <button onClick={() => handleDelete(note._id)} className="p-1.5 bg-white dark:bg-slate-800 rounded-lg text-slate-400 hover:text-rose-500 shadow-sm"><Trash2 size={14}/></button>
        </div>
      )}
    </div>
  );

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 overflow-hidden flex flex-col h-[600px]">
      
      {/* Create Note Section */}
      <div className="p-6 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800">
        <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4">Add New Note</h3>
        <form onSubmit={handleCreate} className="space-y-3">
          <textarea
            className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-sm focus:ring-2 focus:ring-brand-500 focus:border-brand-500 text-slate-900 dark:text-white"
            placeholder="What's on your mind?"
            value={newNote.text}
            onChange={(e) => setNewNote({ ...newNote, text: e.target.value })}
            rows="2"
          />
          <div className="flex justify-between items-center">
            <div className="flex gap-2">
              {['Good', 'Bad'].map((opt) => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => setNewNote({ ...newNote, category: opt })}
                  className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                    newNote.category === opt
                      ? opt === 'Good' 
                        ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/20' 
                        : 'bg-rose-500 text-white shadow-md shadow-rose-500/20'
                      : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
                  }`}
                >
                  {opt}
                </button>
              ))}
            </div>
            <button
              type="submit"
              disabled={!newNote.text.trim()}
              className="flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white px-5 py-2 rounded-full font-medium transition-colors shadow-lg shadow-brand-500/30 disabled:opacity-50"
            >
              <Plus size={16} /> Add Note
            </button>
          </div>
        </form>
      </div>

      {/* Notes Display Area */}
      <div className="flex-1 overflow-y-auto p-6 flex flex-col md:flex-row gap-6">
        
        {/* My Notes Column */}
        <div className="flex-1 space-y-4">
          <h4 className="font-semibold text-slate-700 dark:text-slate-300 flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-2">
            My Notes
            <span className="bg-brand-100 dark:bg-brand-900/50 text-brand-600 dark:text-brand-300 py-0.5 px-2 rounded-full text-xs">
              {myNotes.length}
            </span>
          </h4>
          <div className="space-y-3">
            {myNotes.length === 0 ? (
              <p className="text-sm text-slate-400 italic text-center py-4">No notes yet</p>
            ) : (
              myNotes.map(n => <NoteCard key={n._id} note={n} isMine={true} />)
            )}
          </div>
        </div>

        {/* Partner Notes Column */}
        <div className="flex-1 space-y-4">
          <h4 className="font-semibold text-slate-700 dark:text-slate-300 flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-2">
            Partner's Notes
            <span className="bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 py-0.5 px-2 rounded-full text-xs">
              {partnerNotes.length}
            </span>
          </h4>
          <div className="space-y-3">
            {partnerNotes.length === 0 ? (
              <p className="text-sm text-slate-400 italic text-center py-4">Partner hasn't left notes yet</p>
            ) : (
              partnerNotes.map(n => <NoteCard key={n._id} note={n} isMine={false} />)
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default NotesDashboard;
