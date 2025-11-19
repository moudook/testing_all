import { useState, useEffect } from 'react';
import { Startup } from '../store/useStartupStore';
import api from '../api';
import { Plus } from 'lucide-react';

interface Props {
    onEdit: (startup: Startup) => void;
    onCreate: () => void;
}

export default function Dashboard({ onEdit, onCreate }: Props) {
    const [startups, setStartups] = useState<Startup[]>([]);

    useEffect(() => {
        api.get('/startups').then(res => setStartups(res.data)).catch(console.error);
    }, []);

    return (
        <div>
            <div className="flex justify-between items-center mb-8">
                <h2 className="text-3xl font-bold">Startups</h2>
                <button
                    onClick={onCreate}
                    className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
                >
                    <Plus size={20} />
                    Add Startup
                </button>
            </div>

            <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-gray-900 text-gray-400 text-sm uppercase">
                        <tr>
                            <th className="p-4">Startup</th>
                            <th className="p-4">Stage</th>
                            <th className="p-4">Category</th>
                            <th className="p-4">Website</th>
                            <th className="p-4">Status</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-700">
                        {startups.map((startup) => (
                            <tr key={startup.id} onClick={() => onEdit(startup)} className="hover:bg-gray-700 cursor-pointer transition-colors">
                                <td className="p-4 font-bold text-white">{startup.name}</td>
                                <td className="p-4 text-gray-300">{startup.fundingStage}</td>
                                <td className="p-4 text-gray-300">{startup.marketCategory}</td>
                                <td className="p-4 text-blue-400 hover:underline" onClick={e => e.stopPropagation()}>
                                    <a href={startup.website} target="_blank" rel="noreferrer">{startup.website}</a>
                                </td>
                                <td className="p-4">
                                    <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${startup.status === 'invested' ? 'bg-green-900 text-green-300' :
                                            startup.status === 'passed' ? 'bg-red-900 text-red-300' :
                                                'bg-blue-900 text-blue-300'
                                        }`}>
                                        {startup.status}
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
