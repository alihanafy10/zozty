import { useState } from 'react';
import Login from './components/Login';
import ChatBox from './components/ChatBox';
import NotesDashboard from './components/NotesDashboard';
import ThemeSwitcher from './components/ThemeSwitcher';

function App() {
  const [currentUser, setCurrentUser] = useState(null);

  if (!currentUser) {
    return <Login onLogin={setCurrentUser} />;
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 transition-colors py-6 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header */}
        <header className="flex justify-between items-center bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-brand-100 dark:bg-brand-900 flex items-center justify-center text-brand-600 dark:text-brand-300 font-bold text-lg">
              {currentUser.username[0].toUpperCase()}
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 dark:text-white">Workspace</h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">Logged in as {currentUser.username}</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <ThemeSwitcher />
            <button
              onClick={() => setCurrentUser(null)}
              className="text-sm font-medium text-rose-600 hover:text-rose-700 dark:text-rose-400 dark:hover:text-rose-300 transition-colors"
            >
              Sign Out
            </button>
          </div>
        </header>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Notes Section - Takes up 2 columns on large screens */}
          <div className="lg:col-span-2">
            <NotesDashboard currentUser={currentUser} />
          </div>

          {/* Chat Section - Takes up 1 column on large screens */}
          <div className="lg:col-span-1">
            <ChatBox currentUser={currentUser} />
          </div>

        </div>

      </div>
    </div>
  );
}

export default App;
