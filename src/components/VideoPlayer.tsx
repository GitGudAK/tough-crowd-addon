import React, { useRef, useEffect } from 'react';
import { ProcessingState } from '../types';

interface VideoPlayerProps {
    videoFile: File | null;
    onUpload: (file: File) => void;
    processingState: ProcessingState;
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({ videoFile, onUpload, processingState }) => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const videoRef = useRef<HTMLVideoElement>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            onUpload(e.target.files[0]);
        }
    };

    useEffect(() => {
        if (videoFile && videoRef.current) {
            const url = URL.createObjectURL(videoFile);
            videoRef.current.src = url;
            return () => URL.revokeObjectURL(url);
        }
    }, [videoFile]);

    const isProcessing = processingState !== ProcessingState.IDLE && processingState !== ProcessingState.COMPLETE && processingState !== ProcessingState.ERROR;

    return (
        <div className="relative w-full aspect-video bg-black rounded-lg overflow-hidden shadow-2xl ring-1 ring-gray-800 group">
            {!videoFile ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6 bg-gray-900/50 hover:bg-gray-900/40 transition-colors">
                    <div className="w-16 h-16 mb-4 rounded-full bg-gray-800 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                        <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                        </svg>
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">Upload Video</h3>
                    <p className="text-gray-400 mb-6 max-w-sm">
                        Drag and drop or click to upload a video file to start the AI analysis pipeline.
                    </p>
                    <button
                        onClick={() => fileInputRef.current?.click()}
                        className="px-6 py-2.5 bg-brand-600 hover:bg-brand-500 text-white font-medium rounded-lg transition-colors shadow-lg shadow-brand-900/20"
                    >
                        Select Video File
                    </button>
                </div>
            ) : (
                <>
                    <video
                        ref={videoRef}
                        className="w-full h-full object-contain bg-black"
                        controls
                        playsInline
                    />
                    {/* Overlay scanning effect during processing */}
                    {isProcessing && (
                        <div className="absolute inset-0 pointer-events-none z-10 overflow-hidden">
                            <div className="absolute top-0 left-0 w-full h-1 bg-brand-500/80 shadow-[0_0_15px_rgba(99,102,241,0.8)] animate-[scan_2s_linear_infinite]" />
                            <div className="absolute inset-0 bg-brand-900/10 mix-blend-overlay" />
                        </div>
                    )}

                    <button
                        onClick={() => fileInputRef.current?.click()}
                        className="absolute top-4 right-4 p-2 bg-black/60 hover:bg-black/80 backdrop-blur text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Upload new video"
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                        </svg>
                    </button>
                </>
            )}
            <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="video/*"
                className="hidden"
            />
            <style>{`
        @keyframes scan {
          0% { top: 0%; opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { top: 100%; opacity: 0; }
        }
      `}</style>
        </div>
    );
};
