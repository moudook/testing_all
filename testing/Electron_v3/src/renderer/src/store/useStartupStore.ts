import { create } from 'zustand';

export interface Startup {
  id: string;
  name: string;
  logo: string; // Data URL or path
  description: string;
  fundingStage: string;
  website: string;
  pdfs: { name: string; path: string }[]; // In real app, path would be handled securely
  teamInfo: string;
  marketCategory: string;
  vcNotes: string;
  status: 'researching' | 'pipeline' | 'passed' | 'invested';
}

interface StartupStore {
  startups: Startup[];
  addStartup: (startup: Omit<Startup, 'id'>) => void;
  updateStartup: (id: string, startup: Partial<Startup>) => void;
  deleteStartup: (id: string) => void;
}

export const useStartupStore = create<StartupStore>((set) => ({
  startups: [
    {
      id: '1',
      name: 'TechNova',
      logo: '',
      description: 'AI-driven logistics platform.',
      fundingStage: 'Seed',
      website: 'https://technova.example.com',
      pdfs: [],
      teamInfo: 'Ex-Amazon logistics team',
      marketCategory: 'Logistics',
      vcNotes: 'Promising tech, high valuation.',
      status: 'pipeline'
    }
  ],
  addStartup: (startup) => set((state) => ({
    startups: [...state.startups, { ...startup, id: crypto.randomUUID() }]
  })),
  updateStartup: (id, updated) => set((state) => ({
    startups: state.startups.map((s) => (s.id === id ? { ...s, ...updated } : s))
  })),
  deleteStartup: (id) => set((state) => ({
    startups: state.startups.filter((s) => s.id !== id)
  })),
}));
