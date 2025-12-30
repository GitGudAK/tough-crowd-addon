import React, { useState, useRef, useEffect } from 'react';
import { ProcessingState } from '../types';

interface VideoPlayerProps {
    videoFile: File | null;
    processingState: ProcessingState;
    onSelectFromCanvas: () => void;
    onUpload: (file: File) => void;
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({ videoFile, processingState, onSelectFromCanvas, onUpload }) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [videoUrl, setVideoUrl] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (videoFile) {
            const url = URL.createObjectURL(videoFile);
            setVideoUrl(url);
            return () => URL.revokeObjectURL(url);
        } else {
            setVideoUrl(null);
        }
    }, [videoFile]);

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) onUpload(file);
    };

    const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
        event.preventDefault();
        const file = event.dataTransfer.files?.[0];
        if (file) onUpload(file);
    };

    const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
        event.preventDefault();
    };

    return (
        <div className="w-full bg-gray-900 rounded-xl overflow-hidden border border-gray-800 shadow-2xl relative group">

            {/* Main Content Area */}
            <div
                className="relative aspect-video bg-black/50 flex items-center justify-center"
                onDrop={handleDrop}
                onDragOver={handleDragOver}
            >
                {videoUrl ? (
                    <video
                        ref={videoRef}
                        src={videoUrl}
                        className="w-full h-full object-contain"
                        controls
                        playsInline
                    />
                ) : (
                    <div className="text-center p-8 space-y-6">
                        <div className="flex flex-col items-center gap-4">
                            <div className="w-16 h-16 mx-auto bg-gray-800 rounded-full flex items-center justify-center border border-gray-700 shadow-inner">
                                <svg className="w-8 h-8 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                </svg>
                            </div>
                            <div className="space-y-1">
                                <h3 className="text-lg font-medium text-white">No Content Selected</h3>
                                <p className="text-sm text-gray-400 max-w-xs mx-auto">
                                    Select from canvas OR upload a file manually.
                                </p>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex flex-col gap-3 w-full max-w-xs mx-auto">
                            {/* Primary: Canvas Selection */}
                            <button
                                onClick={onSelectFromCanvas}
                                disabled={processingState !== ProcessingState.IDLE && processingState !== ProcessingState.COMPLETE && processingState !== ProcessingState.ERROR}
                                className="w-full inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-brand-600 hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                            >
                                <svg className="-ml-1 mr-2 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                </svg>
                                Select from Canvas
                            </button>

                            {/* Separator */}
                            <div className="relative">
                                <div className="absolute inset-0 flex items-center" aria-hidden="true">
                                    <div className="w-full border-t border-gray-700"></div>
                                </div>
                                <div className="relative flex justify-center">
                                    <span className="px-2 bg-gray-900/50 text-xs text-gray-500 uppercase">Or</span>
                                </div>
                            </div>

                            {/* Fallback: File Upload */}
                            <div className="w-full">
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    onChange={handleFileChange}
                                    className="hidden"
                                    accept="video/*"
                                />
                                <button
                                    onClick={() => fileInputRef.current?.click()}
                                    disabled={processingState !== ProcessingState.IDLE && processingState !== ProcessingState.COMPLETE && processingState !== ProcessingState.ERROR}
                                    className="w-full inline-flex items-center justify-center px-4 py-2 border border-gray-700 text-sm font-medium rounded-md text-gray-300 bg-gray-800 hover:bg-gray-700 hover:text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-all border-dashed"
                                >
                                    <svg className="-ml-1 mr-2 h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                    </svg>
                                    Upload Video File
                                </button>
                                <p className="text-[10px] text-gray-500 mt-2 text-center">
                                    Drag & Drop supported
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Processing Overlay */}
                {processingState !== ProcessingState.IDLE && processingState !== ProcessingState.COMPLETE && processingState !== ProcessingState.ERROR && (
                    <div className="absolute inset-0 bg-black/80 backdrop-blur-sm z-10 flex flex-col items-center justify-center space-y-4">
                        <div className="relative">
                            <div className="w-16 h-16 border-4 border-brand-900 rounded-full"></div>
                            <div className="absolute inset-0 w-16 h-16 border-4 border-brand-500 rounded-full border-t-transparent animate-spin"></div>
                        </div>
                        <div className="text-center">
                            <p className="text-white font-medium text-lg animate-pulse">Processing Video...</p>
                            <p className="text-brand-400 text-xs font-mono mt-1 uppercase tracking-wider">
                                {processingState.replace(/_/g, ' ')}
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
