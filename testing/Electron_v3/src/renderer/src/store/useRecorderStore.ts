import { create } from 'zustand';

interface RecorderStore {
  isRecording: boolean;
  setIsRecording: (isRecording: boolean) => void;
}

export const useRecorderStore = create<RecorderStore>((set) => ({
  isRecording: false,
  setIsRecording: (isRecording) => set({ isRecording }),
}));
