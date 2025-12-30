import React, { useState } from 'react';
import { Persona, SimulationMode } from '../types';

interface PersonaDeckProps {
    personas: Persona[];
    currentMode: SimulationMode;
}

export const PersonaDeck: React.FC<PersonaDeckProps> = ({ personas, currentMode }) => {
    const [showLogic, setShowLogic] = useState(false);

    if (personas.length === 0) return null;

    return (
        <div className="w-full mt-8 animate-in slide-in-from-bottom-6 fade-in duration-700">
            <div className="flex items-center justify-between mb-4 border-b border-gray-800 pb-2">
                <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest">
                        Identified Personas
                    </h3>
                    <span className="text-xs bg-brand-900/40 text-brand-300 px-2 py-0.5 rounded border border-brand-500/20">
                        {personas.length} Active
                    </span>
                </div>

                <button
                    onClick={() => setShowLogic(!showLogic)}
                    className="flex items-center gap-2 text-xs font-mono text-gray-500 hover:text-brand-400 transition-colors bg-gray-900 px-3 py-1.5 rounded border border-gray-800 hover:border-gray-700"
                >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                    </svg>
                    {showLogic ? 'Hide Logic' : 'View Logic'}
                </button>
            </div>

            {showLogic && (
                <div className="mb-6 bg-black/50 rounded-lg border border-gray-800 p-4 font-mono text-xs text-gray-400 overflow-x-auto shadow-inner">
                    <div className="flex items-center gap-2 mb-2 text-gray-500 border-b border-gray-800 pb-2">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>
                        <span className="font-bold uppercase">Persona Generation Logic ({currentMode})</span>
                    </div>
                    <pre className="whitespace-pre-wrap leading-relaxed">
                        <span className="text-purple-400">const</span> <span className="text-blue-400">instruction</span> = <span className="text-green-400">`Based on video summary & tone, generate 6 detailed personas.`</span>;

                        <span className="text-purple-400">if</span> (mode === <span className="text-yellow-300">'troll'</span>) {'{'}
                        <span className="text-gray-500">// Inject adversarial constraints</span>
                        <span className="text-blue-400">instruction</span> += <span className="text-red-400">`
                            IMPORTANT: This is a "Stress Test".
                            Generate personas that are CRITICAL, HOSTILE, SKEPTICAL.
                            Include types like "The Hater", "The Nitpicker", "The Politicizer".
                            Goal: Simulate worst-case comment section.`</span>;
                        {'}'} <span className="text-purple-400">else</span> {'{'}
                        <span className="text-blue-400">instruction</span> += <span className="text-green-400">`
                            Goal: Simulate realistic, organic mix of viewers (fans, neutrals, casuals).`</span>;
                        {'}'}

                        <span className="text-purple-400">return</span> <span className="text-yellow-300">gemini.generate</span>(instruction, schema);
                    </pre>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {personas.map((p) => (
                    <div
                        key={p.id}
                        className={`bg-gray-900/40 border rounded-xl p-4 transition-all hover:bg-gray-800/40 group ${currentMode === 'troll' ? 'border-red-900/20 hover:border-red-500/30' : 'border-gray-800 hover:border-gray-700'}`}
                    >
                        <div className="flex items-start gap-3">
                            <img
                                src={`https://api.dicebear.com/9.x/avataaars/svg?seed=${p.avatarSeed}`}
                                alt={p.name}
                                className="w-10 h-10 rounded-full bg-gray-800 shadow-sm"
                            />
                            <div className="min-w-0 flex-1">
                                <div className="flex items-center justify-between mb-0.5">
                                    <div className="flex items-center gap-2 overflow-hidden">
                                        <span className="font-bold text-gray-200 text-sm truncate">{p.name}</span>
                                        <span className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border ${currentMode === 'troll' ? 'text-red-300 bg-red-950 border-red-500/30' : 'text-brand-300 bg-brand-950 border-brand-500/30'}`}>
                                            {p.trait}
                                        </span>
                                    </div>
                                </div>
                                <div className="text-xs text-gray-500 mb-2">@{p.handle}</div>
                                <p className="text-xs text-gray-400 leading-snug line-clamp-2 group-hover:line-clamp-none transition-all">
                                    {p.bio}
                                </p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
