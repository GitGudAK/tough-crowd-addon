import React, { useState } from 'react';

interface SettingsProps {
    onSave: (key: string) => void;
}

export const Settings: React.FC<SettingsProps> = ({ onSave }) => {
    const [key, setKey] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (key.trim()) {
            onSave(key.trim());
        }
    };

    return (
        <div className="flex flex-col items-center justify-center h-full p-8 bg-gray-950 text-gray-100">
            <div className="max-w-md w-full space-y-8">
                <div className="text-center">
                    <div className="mx-auto h-12 w-12 bg-brand-500 rounded-xl flex items-center justify-center shadow-lg shadow-brand-500/20 mb-4">
                        <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11.536 11l-3.233 3.233a1 1 0 01-1.414 0l-1.414-1.414a1 1 0 010-1.414L8.707 7.293 15 7z" />
                        </svg>
                    </div>
                    <h2 className="text-3xl font-extrabold text-white">Setup Gemini API</h2>
                    <p className="mt-2 text-sm text-gray-400">
                        Synthevals requires a Google Gemini API Key to function.
                        Your key is stored locally in your browser.
                    </p>
                </div>

                <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
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
                            type="submit"
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
                </form>

                <div className="text-center text-xs text-gray-500">
                    <p>
                        Don't have a key? <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="font-medium text-brand-400 hover:text-brand-300">Get one from Google AI Studio</a>
                    </p>
                </div>
            </div>
        </div>
    );
};
