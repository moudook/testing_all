import { useState, useEffect } from 'react';
import { Startup } from '../store/useStartupStore';
import api from '../api';
import {
    Undo,
    Redo,
    Filter,
    ListFilter,
    FileText,
    Calendar,
    Download,
    Maximize2,
    ChevronDown,
    Plus,
    MessageSquare,
    Circle
} from 'lucide-react';

interface Props {
    onEdit: (startup: Startup) => void;
    onCreate: () => void;
}

export default function Dashboard({ onEdit, onCreate }: Props) {
    const [startups, setStartups] = useState<Startup[]>([]);
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'applications' | 'startups' | 'meetings'>('applications');

    useEffect(() => {
        api.get('/startups').then(res => setStartups(res.data)).catch(console.error);
    }, []);

    const tabs = [
        { label: 'Applications', value: 'applications' },
        { label: 'Startups', value: 'startups' },
        { label: 'Meetings', value: 'meetings' }
    ];

    const meetingSchedule = [
        {
            id: 'meet-1',
            startup: 'Aurora Labs',
            date: 'Nov 25, 2025',
            lead: 'Samantha Lee',
            channel: 'Video',
            status: 'Confirmed'
        },
        {
            id: 'meet-2',
            startup: 'Orbit AI',
            date: 'Nov 27, 2025',
            lead: 'Rahul Singh',
            channel: 'Onsite',
            status: 'Follow-up'
        },
        {
            id: 'meet-3',
            startup: 'Nexa Health',
            date: 'Dec 02, 2025',
            lead: 'Lena Flores',
            channel: 'Phone',
            status: 'Incoming'
        }
    ];

    const applicationRows = startups;
    const startupRows = startups.filter((s) => s.status !== 'passed');
    const activeTabLabel = tabs.find((tab) => tab.value === activeTab)?.label ?? 'Applications';
    const rowsCount =
        activeTab === 'applications'
            ? applicationRows.length
            : activeTab === 'startups'
            ? startupRows.length
            : meetingSchedule.length;

    return (
        <div className="flex flex-col h-full bg-white">
            <div className="px-8 pt-6 pb-2 shrink-0">
                <div className="flex gap-4 mb-8">
                    {tabs.map((tab) => (
                        <button
                            key={tab.value}
                            type="button"
                            onClick={() => setActiveTab(tab.value as 'applications' | 'startups' | 'meetings')}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                                activeTab === tab.value
                                    ? 'bg-blue-600 text-white shadow-sm'
                                    : 'text-gray-500 hover:text-gray-900'
                            }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-lg font-bold text-gray-900">Open opportunities</h2>
                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1 mr-4 border-r border-gray-200 pr-4">
                            <button className="p-1.5 text-gray-300 hover:text-gray-600 cursor-not-allowed"><Undo size={16} /></button>
                            <button className="p-1.5 text-gray-300 hover:text-gray-600 cursor-not-allowed"><Redo size={16} /></button>
                        </div>

                        <button className="px-3 py-1.5 border border-gray-200 rounded-md text-sm flex items-center gap-2 text-gray-600 hover:bg-gray-50">
                            All Status <ChevronDown size={14} />
                        </button>
                        <button className="px-3 py-1.5 border border-gray-200 rounded-md text-sm flex items-center gap-2 text-gray-600 hover:bg-gray-50">
                            <Filter size={14} /> Filter
                        </button>
                        <button className="px-3 py-1.5 border border-gray-200 rounded-md text-sm flex items-center gap-2 text-gray-600 hover:bg-gray-50">
                            <ListFilter size={14} /> Sort
                        </button>
                        <button className="px-3 py-1.5 bg-gray-100 rounded-md text-sm flex items-center gap-2 text-gray-900 font-medium hover:bg-gray-200">
                            <FileText size={14} /> Summary
                        </button>

                        <button onClick={onCreate} className="px-3 py-1.5 bg-blue-600 text-white rounded-md text-sm flex items-center gap-2 font-medium hover:bg-blue-700 ml-2">
                            <Plus size={14} /> Add
                        </button>

                        <div className="flex items-center gap-2 ml-2 text-gray-400">
                            <button className="p-1.5 hover:bg-gray-100 rounded"><Calendar size={16} /></button>
                            <button className="p-1.5 hover:bg-gray-100 rounded"><Download size={16} /></button>
                            <button className="p-1.5 hover:bg-gray-100 rounded"><MessageSquare size={16} /></button>
                            <button className="p-1.5 text-red-500 hover:bg-red-50 rounded"><Circle size={10} fill="currentColor" /></button>
                            <button className="p-1.5 hover:bg-gray-100 rounded"><Maximize2 size={16} /></button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex-1 overflow-auto px-8 pb-8">
                <div className="border border-gray-200 rounded-xl shadow-sm h-full flex flex-col bg-white">
                    <div className="p-6 border-b border-gray-200 bg-white rounded-t-xl shrink-0">
                        <h3 className="text-lg font-semibold text-gray-900">Startup Portfolio</h3>
                        <p className="text-sm text-gray-500 mt-1">Here you will see your startup investments.</p>
                    </div>

                    <div className="flex-1 overflow-auto">
                        {activeTab === 'applications' && (
                            <table className="w-full text-left text-sm min-w-[1000px]">
                                <thead className="bg-gray-50 text-gray-500 font-medium sticky top-0 z-10">
                                    <tr>
                                        <th className="p-4 font-medium whitespace-nowrap">Startup</th>
                                        <th className="p-4 font-medium whitespace-nowrap">Industry</th>
                                        <th className="p-4 font-medium whitespace-nowrap">Status</th>
                                        <th className="p-4 font-medium whitespace-nowrap">Stage</th>
                                        <th className="p-4 font-medium whitespace-nowrap">Deal Lead</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {applicationRows.map((startup) => (
                                        <tr
                                            key={startup.id}
                                            onClick={() => setSelectedId(startup.id)}
                                            onDoubleClick={() => onEdit(startup)}
                                            className={`cursor-pointer transition-colors group ${selectedId === startup.id ? 'bg-blue-50' : 'hover:bg-gray-50'}`}
                                        >
                                            <td className="p-4 font-medium text-gray-900 flex items-center gap-2">
                                                <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-xs text-gray-500">
                                                    {startup.name.substring(0, 2).toUpperCase()}
                                                </div>
                                                {startup.name}
                                            </td>
                                            <td className="p-4 text-gray-600">{startup.marketCategory}</td>
                                            <td className="p-4">
                                                <span className={`px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 w-fit ${startup.status === 'invested' ? 'bg-green-100 text-green-700' : startup.status === 'passed' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'}`}>
                                                    <Circle size={6} fill="currentColor" />
                                                    {startup.status.charAt(0).toUpperCase() + startup.status.slice(1)}
                                                </span>
                                            </td>
                                            <td className="p-4 text-gray-600">{startup.fundingStage}</td>
                                            <td className="p-4 text-gray-600 flex items-center gap-2">
                                                <div className="w-6 h-6 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center text-xs">
                                                    JS
                                                </div>
                                                John Smith
                                            </td>
                                        </tr>
                                    ))}
                                    {applicationRows.length === 0 && (
                                        <tr>
                                            <td colSpan={5} className="p-8 text-center text-gray-400">
                                                No applications available.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        )}
                        {activeTab === 'startups' && (
                            <table className="w-full text-left text-sm min-w-[1000px]">
                                <thead className="bg-gray-50 text-gray-500 font-medium sticky top-0 z-10">
                                    <tr>
                                        <th className="p-4 font-medium whitespace-nowrap">Startup</th>
                                        <th className="p-4 font-medium whitespace-nowrap">Location</th>
                                        <th className="p-4 font-medium whitespace-nowrap">Stage</th>
                                        <th className="p-4 font-medium whitespace-nowrap">Website</th>
                                        <th className="p-4 font-medium whitespace-nowrap">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {startupRows.map((startup) => (
                                        <tr
                                            key={`${startup.id}-startup`}
                                            onClick={() => setSelectedId(startup.id)}
                                            className="hover:bg-gray-50 cursor-pointer"
                                        >
                                            <td className="p-4 font-medium text-gray-900 flex items-center gap-2">
                                                <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-xs text-gray-500">
                                                    {startup.name.substring(0, 2).toUpperCase()}
                                                </div>
                                                {startup.name}
                                            </td>
                                            <td className="p-4 text-gray-600">San Francisco, CA</td>
                                            <td className="p-4 text-gray-600">{startup.fundingStage}</td>
                                            <td className="p-4 text-blue-600 hover:underline">
                                                <a href={startup.website} target="_blank" rel="noreferrer">
                                                    Visit
                                                </a>
                                            </td>
                                            <td className="p-4 text-gray-600">
                                                {startup.status.charAt(0).toUpperCase() + startup.status.slice(1)}
                                            </td>
                                        </tr>
                                    ))}
                                    {startupRows.length === 0 && (
                                        <tr>
                                            <td colSpan={5} className="p-8 text-center text-gray-400">
                                                No startups in this pipeline.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        )}
                        {activeTab === 'meetings' && (
                            <table className="w-full text-left text-sm min-w-[1000px]">
                                <thead className="bg-gray-50 text-gray-500 font-medium sticky top-0 z-10">
                                    <tr>
                                        <th className="p-4 font-medium whitespace-nowrap">Meeting</th>
                                        <th className="p-4 font-medium whitespace-nowrap">Date</th>
                                        <th className="p-4 font-medium whitespace-nowrap">Lead</th>
                                        <th className="p-4 font-medium whitespace-nowrap">Channel</th>
                                        <th className="p-4 font-medium whitespace-nowrap">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {meetingSchedule.map((meeting) => (
                                        <tr key={meeting.id} className="bg-white">
                                            <td className="p-4 text-gray-900 font-medium">{meeting.startup}</td>
                                            <td className="p-4 text-gray-600">{meeting.date}</td>
                                            <td className="p-4 text-gray-600">{meeting.lead}</td>
                                            <td className="p-4 text-gray-600">{meeting.channel}</td>
                                            <td className="p-4 text-gray-600">{meeting.status}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>

                    <div className="p-4 border-t border-gray-200 bg-white text-xs text-gray-500 rounded-b-xl shrink-0">
                        Showing {rowsCount} {activeTabLabel.toLowerCase()} entries
                    </div>
                </div>
            </div>
        </div>
    );
}
