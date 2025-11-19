import { useState, useEffect } from 'react';
import api from '../api';
import { Plus, Calendar as CalendarIcon } from 'lucide-react';

interface Meeting {
    _id?: string;
    title: string;
    date: string;
    notes?: string;
}

export default function CalendarView() {
    const [meetings, setMeetings] = useState<Meeting[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [newMeeting, setNewMeeting] = useState({ title: '', date: new Date().toISOString().split('T')[0], notes: '' });

    useEffect(() => {
        fetchMeetings();
    }, []);

    const fetchMeetings = async () => {
        try {
            const res = await api.get('/calendar');
            setMeetings(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    const handleCreate = async () => {
        try {
            await api.post('/calendar', newMeeting);
            setIsModalOpen(false);
            fetchMeetings();
        } catch (err) {
            alert('Failed to create meeting');
        }
    };

    const today = new Date().toISOString().split('T')[0];

    return (
        <div>
            <div className="flex justify-between items-center mb-8">
                <h2 className="text-3xl font-bold">Calendar</h2>
                <button onClick={() => setIsModalOpen(true)} className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg flex items-center gap-2">
                    <Plus size={20} /> Add Meeting
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {meetings.map((meeting) => (
                    <div key={meeting._id} className={`p-6 rounded-xl border ${meeting.date === today ? 'bg-red-900/20 border-red-500' : 'bg-gray-800 border-gray-700'}`}>
                        <div className="flex items-center gap-2 mb-2 text-gray-400 text-sm">
                            <CalendarIcon size={16} />
                            {new Date(meeting.date).toLocaleDateString()}
                        </div>
                        <h3 className="text-xl font-bold mb-2">{meeting.title}</h3>
                        <p className="text-gray-400 text-sm">{meeting.notes}</p>
                    </div>
                ))}
            </div>

            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-gray-800 p-8 rounded-xl w-96 border border-gray-700">
                        <h3 className="text-xl font-bold mb-4">New Meeting</h3>
                        <input
                            className="w-full bg-gray-900 border border-gray-700 rounded p-2 mb-4 text-white"
                            placeholder="Title"
                            value={newMeeting.title}
                            onChange={e => setNewMeeting({ ...newMeeting, title: e.target.value })}
                        />
                        <input
                            type="date"
                            className="w-full bg-gray-900 border border-gray-700 rounded p-2 mb-4 text-white"
                            value={newMeeting.date}
                            onChange={e => setNewMeeting({ ...newMeeting, date: e.target.value })}
                        />
                        <textarea
                            className="w-full bg-gray-900 border border-gray-700 rounded p-2 mb-4 text-white"
                            placeholder="Notes"
                            value={newMeeting.notes}
                            onChange={e => setNewMeeting({ ...newMeeting, notes: e.target.value })}
                        />
                        <div className="flex justify-end gap-2">
                            <button onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-gray-400">Cancel</button>
                            <button onClick={handleCreate} className="px-4 py-2 bg-red-600 text-white rounded">Create</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
