import { useState, useEffect, useRef } from 'react';
import { Mic, Monitor, Volume2, Square, Circle, Video } from 'lucide-react';
import { useRecorderStore } from '../store/useRecorderStore';

export default function Recorder() {
    const { isRecording, setIsRecording } = useRecorderStore();
    const [sources, setSources] = useState<{ id: string; name: string; thumbnail: string }[]>([]);
    const [selectedSourceId, setSelectedSourceId] = useState<string>('');

    const screenStreamRef = useRef<MediaStream | null>(null);
    const micStreamRef = useRef<MediaStream | null>(null);
    const systemStreamRef = useRef<MediaStream | null>(null);

    const screenRecorderRef = useRef<MediaRecorder | null>(null);
    const micRecorderRef = useRef<MediaRecorder | null>(null);
    const systemRecorderRef = useRef<MediaRecorder | null>(null);

    useEffect(() => {
        // Load sources on mount
        window.mediaAPI.getScreenSources().then((srcs) => {
            setSources(srcs);
            if (srcs.length > 0) setSelectedSourceId(srcs[0].id);
        });
    }, []);

    const startRecording = async () => {
        if (!selectedSourceId) return alert('Select a screen source first');

        try {
            // Notify backend to connect WebSockets
            window.mediaAPI.startStream();

            // 1. Screen Stream
            const screenStream = await navigator.mediaDevices.getUserMedia({
                audio: false,
                video: {
                    mandatory: {
                        chromeMediaSource: 'desktop',
                        chromeMediaSourceId: selectedSourceId,
                    }
                } as any
            });
            screenStreamRef.current = screenStream;

            // 2. System Audio Stream (Loopback)
            const systemStream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    mandatory: {
                        chromeMediaSource: 'desktop',
                        chromeMediaSourceId: selectedSourceId
                    }
                } as any,
                video: {
                    mandatory: {
                        chromeMediaSource: 'desktop',
                        chromeMediaSourceId: selectedSourceId,
                        maxWidth: 1,
                        maxHeight: 1
                    }
                } as any
            });
            const systemAudioTrack = systemStream.getAudioTracks()[0];
            const systemAudioStreamOnly = new MediaStream([systemAudioTrack]);
            systemStreamRef.current = systemAudioStreamOnly;


            // 3. Mic Stream
            const micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
            micStreamRef.current = micStream;

            // Start Recorders
            const options = { mimeType: 'video/webm; codecs=vp9' };
            const audioOptions = { mimeType: 'audio/webm; codecs=opus' };

            // Screen Recorder
            const screenRecorder = new MediaRecorder(screenStream, options);
            screenRecorder.ondataavailable = (e) => {
                if (e.data.size > 0) {
                    e.data.arrayBuffer().then(buffer => window.mediaAPI.sendScreenChunk(buffer));
                }
            };
            screenRecorder.start(1000); // 1 second chunks
            screenRecorderRef.current = screenRecorder;

            // Mic Recorder
            const micRecorder = new MediaRecorder(micStream, audioOptions);
            micRecorder.ondataavailable = (e) => {
                if (e.data.size > 0) {
                    e.data.arrayBuffer().then(buffer => window.mediaAPI.sendMicChunk(buffer));
                }
            };
            micRecorder.start(1000);
            micRecorderRef.current = micRecorder;

            // System Audio Recorder
            const systemRecorder = new MediaRecorder(systemAudioStreamOnly, audioOptions);
            systemRecorder.ondataavailable = (e) => {
                if (e.data.size > 0) {
                    e.data.arrayBuffer().then(buffer => window.mediaAPI.sendSystemChunk(buffer));
                }
            };
            systemRecorder.start(1000);
            systemRecorderRef.current = systemRecorder;

            setIsRecording(true);

        } catch (err) {
            console.error("Error starting recording:", err);
            alert("Failed to start recording: " + err);
        }
    };

    const stopRecording = () => {
        // Stop Recorders
        if (screenRecorderRef.current && screenRecorderRef.current.state !== 'inactive') screenRecorderRef.current.stop();
        if (micRecorderRef.current && micRecorderRef.current.state !== 'inactive') micRecorderRef.current.stop();
        if (systemRecorderRef.current && systemRecorderRef.current.state !== 'inactive') systemRecorderRef.current.stop();

        // Stop Tracks
        screenStreamRef.current?.getTracks().forEach(t => t.stop());
        micStreamRef.current?.getTracks().forEach(t => t.stop());
        systemStreamRef.current?.getTracks().forEach(t => t.stop());

        // Notify backend to disconnect WebSockets
        window.mediaAPI.stopStream();

        setIsRecording(false);
    };

    return (
        <div className="flex flex-col items-center justify-center h-full">
            <div className="bg-gray-800 p-8 rounded-2xl border border-gray-700 text-center max-w-md w-full">
                <div className="mb-8 relative">
                    <div className={`w-24 h-24 rounded-full flex items-center justify-center mx-auto ${isRecording ? 'bg-red-500/20 animate-pulse' : 'bg-gray-700'}`}>
                        {isRecording ? <div className="w-4 h-4 bg-red-500 rounded-full animate-ping" /> : <Video size={40} className="text-gray-400" />}
                    </div>
                    {isRecording && <span className="absolute -top-2 right-1/2 translate-x-1/2 bg-red-600 text-white text-xs px-2 py-0.5 rounded font-bold">LIVE</span>}
                </div>

                <h2 className="text-2xl font-bold mb-2">{isRecording ? 'Recording in Progress' : 'Ready to Record'}</h2>
                <p className="text-gray-400 mb-8">Streaming screen, system audio, and microphone to backend.</p>

                {!isRecording && (
                    <div className="mb-6 text-left">
                        <label className="block text-sm text-gray-400 mb-2">Select Screen Source</label>
                        <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto p-2 bg-gray-900 rounded border border-gray-700">
                            {sources.map(src => (
                                <div
                                    key={src.id}
                                    onClick={() => setSelectedSourceId(src.id)}
                                    className={`p-2 rounded cursor-pointer border-2 ${selectedSourceId === src.id ? 'border-red-500 bg-red-500/10' : 'border-transparent hover:bg-gray-800'}`}
                                >
                                    <img src={src.thumbnail} className="w-full h-auto mb-1 rounded" />
                                    <p className="text-xs truncate">{src.name}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                <button
                    onClick={isRecording ? stopRecording : startRecording}
                    className={`w-full py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-3 transition-all ${isRecording
                        ? 'bg-gray-700 hover:bg-gray-600 text-white'
                        : 'bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-900/20'
                        }`}
                >
                    {isRecording ? <><Square fill="currentColor" size={20} /> Stop Recording</> : <><Circle fill="currentColor" size={20} /> Start Recording</>}
                </button>

                <div className="mt-6 flex justify-center gap-6 text-gray-500 text-sm">
                    <div className="flex items-center gap-2"><Monitor size={16} className={isRecording ? "text-green-500" : ""} /> Screen</div>
                    <div className="flex items-center gap-2"><Volume2 size={16} className={isRecording ? "text-green-500" : ""} /> System</div>
                    <div className="flex items-center gap-2"><Mic size={16} className={isRecording ? "text-green-500" : ""} /> Mic</div>
                </div>
            </div>
        </div>
    );
}
