import { useState } from 'react';
import { LayoutDashboard, Video, Calendar as CalendarIcon } from 'lucide-react';
import Dashboard from './components/Dashboard';
import Recorder from './components/Recorder';
import StartupDetails from './components/StartupDetails';
import Chatbot from './components/Chatbot';
import CalendarView from './components/CalendarView';
import { Startup } from './store/useStartupStore';
import { useRecorderStore } from './store/useRecorderStore';

function App() {
  const [view, setView] = useState<'dashboard' | 'recorder' | 'calendar'>('dashboard');
  const [editingStartup, setEditingStartup] = useState<Startup | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const { isRecording } = useRecorderStore();

  return (
    <div className="flex h-screen bg-gray-900 text-white font-sans">
      {/* Sidebar */}
      <div className="w-64 bg-gray-800 p-4 flex flex-col border-r border-gray-700">
        <h1 className="text-2xl font-bold mb-8 text-red-500 tracking-tighter">VC INTEL</h1>
        <nav className="space-y-2">
          <button
            onClick={() => { setView('dashboard'); setIsCreating(false); setEditingStartup(null); }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${view === 'dashboard' ? 'bg-red-600 text-white' : 'hover:bg-gray-700 text-gray-300'}`}
          >
            <LayoutDashboard size={20} />
            Dashboard
          </button>
          <button
            onClick={() => setView('recorder')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${view === 'recorder' ? 'bg-red-600 text-white' : 'hover:bg-gray-700 text-gray-300'}`}
          >
            <Video size={20} />
            Recorder
          </button>
          <button
            onClick={() => setView('calendar')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${view === 'calendar' ? 'bg-red-600 text-white' : 'hover:bg-gray-700 text-gray-300'}`}
          >
            <CalendarIcon size={20} />
            Calendar
          </button>
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto p-8 relative">
        {view === 'dashboard' && !isCreating && !editingStartup && (
          <Dashboard
            onEdit={(startup) => setEditingStartup(startup)}
            onCreate={() => setIsCreating(true)}
          />
        )}
        {(isCreating || editingStartup) && (
          <StartupDetails
            startup={editingStartup || undefined}
            onBack={() => { setIsCreating(false); setEditingStartup(null); }}
          />
        )}
        {view === 'recorder' && <Recorder />}
        {view === 'calendar' && <CalendarView />}

        {/* Floating Chatbot */}
        {isRecording && <Chatbot />}
      </div>
    </div>
  );
}

export default App;
