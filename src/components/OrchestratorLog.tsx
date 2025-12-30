import React, { useEffect, useRef, useState } from 'react';
import { LogEntry, ProcessingState } from '../types';

interface OrchestratorLogProps {
    logs: LogEntry[];
    state: ProcessingState;
}

export const OrchestratorLog: React.FC<OrchestratorLogProps> = ({ logs, state }) => {
    const [isExpanded, setIsExpanded] = useState(true);
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (scrollRef.current && isExpanded) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [logs, isExpanded]);

    const getStateColor = (s: ProcessingState) => {
        switch (s) {
            case ProcessingState.IDLE: return 'text-gray-500';
            case ProcessingState.ERROR: return 'text-red-500';
            case ProcessingState.COMPLETE: return 'text-green-500';
            default: return 'text-brand-400 animate-pulse';
        }
    };

    return (
        <div
            className={`bg-black/90 backdrop-blur-md border-t border-gray-800 md:absolute md:bottom-0 md:left-0 md:right-0 md:w-full z-30 flex flex-col font-mono text-xs shadow-[0_-4px_20px_rgba(0,0,0,0.5)] transition-all duration-300 ease-in-out ${isExpanded ? 'h-64' : 'h-10'}`}
        >
            <div
                className="flex items-center justify-between px-4 py-2 bg-gray-900/80 border-b border-gray-800 cursor-pointer hover:bg-gray-800 transition-colors"
                onClick={() => setIsExpanded(!isExpanded)}
            >
                <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${state === ProcessingState.IDLE ? 'bg-gray-500' : 'bg-green-500 animate-pulse'}`}></div>
                    <span className="font-bold text-gray-300 uppercase tracking-wider">Agent Orchestrator</span>
                </div>

                <div className="flex items-center gap-4">
                    <span className={`font-bold ${getStateColor(state)}`}>
                        [{state}]
                    </span>
                    <button
                        className="text-gray-500 hover:text-white transition-colors focus:outline-none"
                        onClick={(e) => {
                            e.stopPropagation();
                            setIsExpanded(!isExpanded);
                        }}
                    >
                        <svg
                            className={`w-4 h-4 transform transition-transform duration-300 ${isExpanded ? 'rotate-180' : 'rotate-0'}`}
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                        </svg>
                    </button>
                </div>
            </div>

            <div
                ref={scrollRef}
                className={`flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar bg-gray-950/80 transition-opacity duration-300 ${isExpanded ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
            >
                {logs.length === 0 && (
                    <div className="text-gray-600 italic">Waiting for input stream...</div>
                )}
                {logs.map((log) => (
                    <div key={log.id} className="flex gap-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
                        <span className="text-gray-600 whitespace-nowrap">
                            {new Date(log.timestamp).toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                        </span>
                        <div className="flex-1">
                            <span className="text-brand-400 font-semibold mr-2">[{log.step}]</span>
                            <span className="text-gray-300">{log.message}</span>
                        </div>
                    </div>
                ))}
                {state !== ProcessingState.IDLE && state !== ProcessingState.COMPLETE && state !== ProcessingState.ERROR && (
                    <div className="flex gap-3">
                        <span className="text-gray-600">...</span>
                        <span className="text-brand-500 animate-pulse">Processing stream...</span>
                    </div>
                )}
            </div>
        </div>
    );
};
