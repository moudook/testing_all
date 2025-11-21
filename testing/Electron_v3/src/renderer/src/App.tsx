import { useState } from 'react';
import {
  LayoutDashboard,
  Video,
  Calendar as CalendarIcon,
  Search,
  Share2,
  Bell,
  User,
  CheckCircle2,
  Grip
} from 'lucide-react';
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
    <div className="flex flex-col h-screen bg-gray-50 text-gray-900 font-sans">
      {/* Top Header */}
      <header className="h-16 bg-white border-b border-gray-200 flex items-center px-4 justify-between shrink-0 z-20">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-blue-600">
            <Grip size={24} />
            <span className="text-xl font-bold text-gray-900 tracking-tight">Deal Flow</span>
          </div>
          <div className="flex items-center bg-gray-100 rounded-lg p-1 ml-4">
            <button className="px-3 py-1.5 bg-white shadow-sm rounded-md text-sm font-medium text-gray-900">Sheet View</button>
            <button className="px-3 py-1.5 text-sm font-medium text-gray-500 hover:text-gray-900">Board View</button>
          </div>
        </div>

        <div className="flex-1 max-w-xl px-8">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Search anywhere..."
              className="w-full bg-gray-100 border-none rounded-full py-2 pl-10 pr-4 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-green-50 text-green-700 rounded-full text-sm font-medium">
            <CheckCircle2 size={14} className="fill-green-500 text-green-500" />
            Connected
          </div>
          <button className="p-2 text-gray-500 hover:bg-gray-100 rounded-full">
            <Bell size={20} />
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-full text-sm font-medium hover:bg-gray-800">
            <Share2 size={16} />
            Share
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Navigation Rail */}
        <nav className="w-16 bg-white border-r border-gray-200 flex flex-col items-center py-6 gap-6 shrink-0 z-10">
          <button
            onClick={() => { setView('dashboard'); setIsCreating(false); setEditingStartup(null); }}
            className={`p-3 rounded-xl transition-all ${view === 'dashboard' ? 'bg-blue-50 text-blue-600' : 'text-gray-400 hover:bg-gray-50 hover:text-gray-600'}`}
            title="Dashboard"
          >
            <LayoutDashboard size={24} />
          </button>
          <button
            onClick={() => setView('recorder')}
            className={`p-3 rounded-xl transition-all ${view === 'recorder' ? 'bg-blue-50 text-blue-600' : 'text-gray-400 hover:bg-gray-50 hover:text-gray-600'}`}
            title="Recorder"
          >
            <Video size={24} />
          </button>
          <button
            onClick={() => setView('calendar')}
            className={`p-3 rounded-xl transition-all ${view === 'calendar' ? 'bg-blue-50 text-blue-600' : 'text-gray-400 hover:bg-gray-50 hover:text-gray-600'}`}
            title="Calendar"
          >
            <CalendarIcon size={24} />
          </button>
        </nav>

        {/* Main Content */}
        <main className="flex-1 overflow-hidden relative bg-gray-50">
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
        </main>
      </div>
    </div>
  );
}

export default App;
