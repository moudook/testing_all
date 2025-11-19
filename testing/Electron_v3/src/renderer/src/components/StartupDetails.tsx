import { useState } from 'react';
import { Startup } from '../store/useStartupStore';
import api from '../api';
import { ArrowLeft, Upload, X } from 'lucide-react';

interface Props {
    startup?: Startup;
    onBack: () => void;
}

export default function StartupDetails({ startup, onBack }: Props) {
    const [formData, setFormData] = useState<Partial<Startup>>(startup || {
        name: '',
        description: '',
        fundingStage: 'Seed',
        website: '',
        teamInfo: '',
        marketCategory: '',
        vcNotes: '',
        status: 'researching',
        pdfs: [],
        logo: ''
    });

    const handleSave = async () => {
        if (!formData.name) return alert('Name is required');
        try {
            if (startup && startup.id) {
                await api.put(`/startups/${startup.id}`, formData);
            } else {
                await api.post('/startups', formData);
            }
            onBack();
        } catch (err) {
            alert('Failed to save');
            console.error(err);
        }
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, type: 'pdf' | 'logo') => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (type === 'pdf') {
            if (file.type !== 'application/pdf') return alert('Only PDF allowed');
            // In real app, upload to backend. Here we fake it.
            setFormData(prev => ({
                ...prev,
                pdfs: [...(prev.pdfs || []), { name: file.name, path: (file as any).path }]
            }));
        } else if (type === 'logo') {
            if (!file.type.startsWith('image/')) return alert('Only images allowed');
            const reader = new FileReader();
            reader.onload = () => {
                setFormData(prev => ({ ...prev, logo: reader.result as string }));
            };
            reader.readAsDataURL(file);
        }
    };

    return (
        <div className="max-w-4xl mx-auto">
            <button onClick={onBack} className="flex items-center gap-2 text-gray-400 hover:text-white mb-6">
                <ArrowLeft size={20} /> Back
            </button>
            <h2 className="text-3xl font-bold mb-8">{startup ? 'Edit Startup' : 'New Startup'}</h2>

            <div className="grid grid-cols-2 gap-8">
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm text-gray-400 mb-1">Name</label>
                        <input
                            className="w-full bg-gray-800 border border-gray-700 rounded p-2 text-white focus:border-red-500 outline-none"
                            value={formData.name}
                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                        />
                    </div>
                    <div>
                        <label className="block text-sm text-gray-400 mb-1">Description</label>
                        <textarea
                            className="w-full bg-gray-800 border border-gray-700 rounded p-2 text-white focus:border-red-500 outline-none h-32"
                            value={formData.description}
                            onChange={e => setFormData({ ...formData, description: e.target.value })}
                        />
                    </div>
                    <div>
                        <label className="block text-sm text-gray-400 mb-1">Website</label>
                        <input
                            className="w-full bg-gray-800 border border-gray-700 rounded p-2 text-white focus:border-red-500 outline-none"
                            value={formData.website}
                            onChange={e => setFormData({ ...formData, website: e.target.value })}
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm text-gray-400 mb-1">Funding Stage</label>
                            <select
                                className="w-full bg-gray-800 border border-gray-700 rounded p-2 text-white focus:border-red-500 outline-none"
                                value={formData.fundingStage}
                                onChange={e => setFormData({ ...formData, fundingStage: e.target.value })}
                            >
                                <option>Pre-Seed</option>
                                <option>Seed</option>
                                <option>Series A</option>
                                <option>Series B+</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm text-gray-400 mb-1">Status</label>
                            <select
                                className="w-full bg-gray-800 border border-gray-700 rounded p-2 text-white focus:border-red-500 outline-none"
                                value={formData.status}
                                onChange={e => setFormData({ ...formData, status: e.target.value as any })}
                            >
                                <option value="researching">Researching</option>
                                <option value="pipeline">Pipeline</option>
                                <option value="passed">Passed</option>
                                <option value="invested">Invested</option>
                            </select>
                        </div>
                    </div>
                </div>

                <div className="space-y-4">
                    <div>
                        <label className="block text-sm text-gray-400 mb-1">Logo</label>
                        <div className="flex items-center gap-4">
                            {formData.logo && <img src={formData.logo} className="w-16 h-16 rounded-full object-cover" />}
                            <label className="cursor-pointer bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded text-sm">
                                Upload Image
                                <input type="file" className="hidden" accept="image/*" onChange={e => handleFileUpload(e, 'logo')} />
                            </label>
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm text-gray-400 mb-1">Pitch Deck (PDF)</label>
                        <div className="space-y-2 mb-2">
                            {formData.pdfs?.map((pdf, i) => (
                                <div key={i} className="flex items-center justify-between bg-gray-800 p-2 rounded border border-gray-700">
                                    <span className="text-sm truncate">{pdf.name}</span>
                                    <button onClick={() => setFormData(prev => ({ ...prev, pdfs: prev.pdfs?.filter((_, idx) => idx !== i) }))} className="text-red-500 hover:text-red-400"><X size={16} /></button>
                                </div>
                            ))}
                        </div>
                        <label className="cursor-pointer bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded text-sm inline-flex items-center gap-2">
                            <Upload size={16} /> Upload PDF
                            <input type="file" className="hidden" accept="application/pdf" onChange={e => handleFileUpload(e, 'pdf')} />
                        </label>
                    </div>
                    <div>
                        <label className="block text-sm text-gray-400 mb-1">VC Notes</label>
                        <textarea
                            className="w-full bg-gray-800 border border-gray-700 rounded p-2 text-white focus:border-red-500 outline-none h-32"
                            value={formData.vcNotes}
                            onChange={e => setFormData({ ...formData, vcNotes: e.target.value })}
                        />
                    </div>
                </div>
            </div>

            <div className="mt-8 flex justify-end gap-4">
                <button onClick={onBack} className="px-6 py-2 rounded text-gray-300 hover:bg-gray-800">Cancel</button>
                <button onClick={handleSave} className="px-6 py-2 rounded bg-red-600 hover:bg-red-700 text-white font-bold">Save Startup</button>
            </div>
        </div>
    );
}
