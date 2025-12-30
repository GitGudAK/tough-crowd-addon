import React, { useState } from 'react';
import logo from '../logo.jpg';

interface SettingsProps {
    onSave: (key: string) => void;
}

export const Settings: React.FC<SettingsProps> = ({ onSave }) => {
    const [key, setKey] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        console.log("Settings: Submit clicked", key);
        if (key.trim()) {
            console.log("Settings: Calling onSave");
            onSave(key.trim());
        } else {
            console.warn("Settings: Key is empty");
        }
    };

    return (
        <div className="flex flex-col items-center justify-center h-full p-8 bg-gray-950 text-gray-100">
            <div className="max-w-md w-full space-y-8">
                <div className="text-center">
                    <div className="mx-auto mb-6">
                        <img src={logo} alt="Tough Crowd Logo" className="h-24 mx-auto rounded-xl shadow-2xl shadow-brand-500/20" />
                    </div>
                    <h2 className="text-3xl font-extrabold text-white">Setup Gemini API</h2>
                </div>

                <div className="bg-gray-900 border border-gray-800 rounded-xl p-8 shadow-2xl max-w-md w-full animate-in fade-in slide-in-from-bottom-8 duration-700">
                    <p className="text-gray-400 text-sm mb-6 text-center leading-relaxed">
                        Tough Crowd requires a Google Gemini API Key to function.
                        Your key is stored locally in your browser.
                    </p>
                </div>

                <div className="mt-8 space-y-6">
                    <div className="rounded-md shadow-sm -space-y-px">
                        <div>
                            <label htmlFor="api-key" className="sr-only">API Key</label>
                            <input
                                id="api-key"
                                name="apiKey"
                                type="password"
                                required
                                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-700 placeholder-gray-500 text-white bg-gray-900 rounded-t-md focus:outline-none focus:ring-brand-500 focus:border-brand-500 focus:z-10 sm:text-sm"
                                placeholder="Paste your Gemini API Key here"
                                value={key}
                                onChange={(e) => setKey(e.target.value)}
                            />
                        </div>
                    </div>

                    <div>
                        <button
                            type="button"
                            onClick={(e) => handleSubmit(e as any)}
                            disabled={!key}
                            className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-brand-600 hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                        >
                            <span className="absolute left-0 inset-y-0 flex items-center pl-3">
                                <svg className="h-5 w-5 text-brand-500 group-hover:text-brand-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                                    <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                                </svg>
                            </span>
                            Save Key & Continue
                        </button>
                    </div>
                </div>

                <div className="text-center text-xs text-gray-500">
                    <p>
                        Don't have a key? <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="font-medium text-brand-400 hover:text-brand-300">Get one from Google AI Studio</a>
                    </p>
                </div>
            </div>
        </div>
    );
};
