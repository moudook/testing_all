import { useState, useRef, useEffect, useCallback } from 'react';
import { MessageSquare, X, Minus, Send } from 'lucide-react';

export default function Chatbot() {
    const [isOpen, setIsOpen] = useState(true);
    const [isMinimized, setIsMinimized] = useState(false);
    const [messages, setMessages] = useState<{ role: 'user' | 'ai', text: string }[]>([
        { role: 'ai', text: 'I am listening to the meeting. Ask me anything.' }
    ]);
    const [input, setInput] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Draggable state
    const [position, setPosition] = useState({ x: window.innerWidth - 340, y: window.innerHeight - 400 });
    const [isDragging, setIsDragging] = useState(false);
    const dragStartRef = useRef({ x: 0, y: 0 });

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(scrollToBottom, [messages]);

    const handleMouseDown = (e: React.MouseEvent) => {
        setIsDragging(true);
        dragStartRef.current = {
            x: e.clientX - position.x,
            y: e.clientY - position.y
        };
    };

    const handleMouseMove = useCallback((e: MouseEvent) => {
        if (isDragging) {
            setPosition({
                x: e.clientX - dragStartRef.current.x,
                y: e.clientY - dragStartRef.current.y
            });
        }
    }, [isDragging]);

    const handleMouseUp = useCallback(() => {
        setIsDragging(false);
    }, []);

    useEffect(() => {
        if (isDragging) {
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
        } else {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        }
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isDragging, handleMouseMove, handleMouseUp]);

    const handleSend = () => {
        if (!input.trim()) return;
        setMessages(prev => [...prev, { role: 'user', text: input }]);
        setInput('');
        // Simulate AI response
        setTimeout(() => {
            setMessages(prev => [...prev, { role: 'ai', text: 'I noted that down.' }]);
        }, 1000);
    };

    if (!isOpen) return null;

    return (
        <div
            style={{ left: position.x, top: position.y }}
            className={`fixed w-80 bg-gray-800/90 backdrop-blur-sm border border-gray-700 rounded-lg shadow-2xl flex flex-col transition-height duration-300 z-50 ${isMinimized ? 'h-12' : 'h-96'}`}
        >
            {/* Header */}
            <div
                onMouseDown={handleMouseDown}
                className="flex items-center justify-between p-3 bg-gray-900/90 rounded-t-lg cursor-move border-b border-gray-700 select-none"
            >
                <div className="flex items-center gap-2 text-sm font-bold text-gray-200">
                    <MessageSquare size={16} className="text-red-500" />
                    VC Assistant
                </div>
                <div className="flex items-center gap-2">
                    <button onClick={() => setIsMinimized(!isMinimized)} className="text-gray-400 hover:text-white">
                        <Minus size={16} />
                    </button>
                    <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-white">
                        <X size={16} />
                    </button>
                </div>
            </div>

            {/* Body */}
            {!isMinimized && (
                <>
                    <div className="flex-1 overflow-y-auto p-4 space-y-4">
                        {messages.map((msg, i) => (
                            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[80%] p-2 rounded-lg text-sm ${msg.role === 'user' ? 'bg-red-600 text-white' : 'bg-gray-700 text-gray-200'}`}>
                                    {msg.text}
                                </div>
                            </div>
                        ))}
                        <div ref={messagesEndRef} />
                    </div>
                    <div className="p-3 border-t border-gray-700 flex gap-2">
                        <input
                            className="flex-1 bg-gray-900/80 border border-gray-700 rounded px-2 py-1 text-sm text-white focus:border-red-500 outline-none"
                            placeholder="Ask AI..."
                            value={input}
                            onChange={e => setInput(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && handleSend()}
                        />
                        <button onClick={handleSend} className="bg-red-600 hover:bg-red-700 text-white p-1.5 rounded">
                            <Send size={16} />
                        </button>
                    </div>
                </>
            )}
        </div>
    );
}
