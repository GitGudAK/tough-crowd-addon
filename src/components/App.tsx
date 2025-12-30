import React, { useState, useCallback, useEffect } from 'react';
import logo from '../logo.jpg';
import { AddOnSDKAPI } from "https://new.express.adobe.com/static/add-on-sdk/sdk.js";
import { VideoPlayer } from './VideoPlayer';
import { CommentFeed } from './CommentFeed';
import { OrchestratorLog } from './OrchestratorLog';
import { ViralityScorecard } from './ViralityScorecard';
import { PersonaDeck } from './PersonaDeck';
import { Settings } from './Settings';
import { ProcessingState, LogEntry, Comment, VideoAnalysis, Persona, SimulationMode } from '../types';
import { extractFramesFromVideo } from '../services/videoUtils';
import { analyzeVideoFrames, generatePersonas, generateCommentForPersona, resetFallbackHistory } from '../services/geminiService';
import { getSelectedVideo } from '../services/canvasService';
import { Menu, Maximize2, Minimize2, MoreVertical, X, LogOut, Cpu } from 'lucide-react';

const generateId = () => Math.random().toString(36).substr(2, 9);

const App = ({ addOnUISdk }: { addOnUISdk: AddOnSDKAPI }) => {
    const [apiKey, setApiKey] = useState<string>('');
    const [videoFile, setVideoFile] = useState<File | null>(null);
    const [processingState, setProcessingState] = useState<ProcessingState>(ProcessingState.IDLE);
    const [logs, setLogs] = useState<LogEntry[]>([]);
    const [comments, setComments] = useState<Comment[]>([]);
    const [analysis, setAnalysis] = useState<VideoAnalysis | null>(null);
    const [activePersonas, setActivePersonas] = useState<Persona[]>([]);
    const [simulationMode, setSimulationMode] = useState<SimulationMode>('standard');
    const [isInitializing, setIsInitializing] = useState(true);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isFullScreen, setIsFullScreen] = useState(false);

    // Load API Key from LocalStorage on mount
    useEffect(() => {
        const savedKey = localStorage.getItem('gemini_api_key');
        if (savedKey) {
            setApiKey(savedKey);
        }
        setIsInitializing(false);
    }, []);

    const handleSaveKey = (key: string) => {
        console.log("App: handleSaveKey called", key);
        localStorage.setItem('gemini_api_key', key);
        setApiKey(key);
        console.log("App: setApiKey called");
    };

    const addLog = (step: string, message: string) => {
        setLogs(prev => [...prev, {
            id: generateId(),
            step,
            message,
            timestamp: Date.now()
        }]);
    };

    const handleSelectFromCanvas = async () => {
        setProcessingState(ProcessingState.EXTRACTING_FRAMES); // Use a temporary state or add a new one specifically for retrieval
        addLog('INGESTION', 'Attempting to retrieve video from Add-on selection...');

        try {
            const selection = await getSelectedVideo(addOnUISdk);

            if (selection) {
                // If it's a video blob, create a File and process usually
                if (selection.type === 'video') {
                    const file = new File([selection.blob], "canvas_video.mp4", { type: "video/mp4" });
                    addLog('INGESTION', 'Success: Video retrieved from canvas.');
                    handleVideoUpload(file);
                }
                // If it's an image (snapshot fallback), handle it as a single-frame analysis
                else if (selection.type === 'image') {
                    addLog('INGESTION', 'Success: Retrieved current frame (Static Analysis).');
                    handleImageAnalysis(selection.blob);
                }
            } else {
                addLog('ERROR', 'No content found in selection.');
                setProcessingState(ProcessingState.IDLE);
            }
        } catch (error) {
            addLog('ERROR', error instanceof Error ? error.message : 'Canvas retrieval failed');
            setProcessingState(ProcessingState.IDLE);
        }
    };

    const handleImageAnalysis = async (imageBlob: Blob) => {
        if (!apiKey) return;

        setVideoFile(null); // No video file to play
        setComments([]);
        setLogs([]);
        setAnalysis(null);
        setActivePersonas([]);

        // Convert Blob to Base64
        const reader = new FileReader();
        reader.readAsDataURL(imageBlob);
        reader.onloadend = async () => {
            const base64data = reader.result as string;
            // Remove prefix
            const base64Content = base64data.split(',')[1];

            try {
                // Skip extraction, go straight to analysis
                setProcessingState(ProcessingState.ANALYZING_VIDEO);
                addLog('GEMINI_VLM', 'Sending single frame snapshot to Gemini 3.0...');

                // Pass single frame as array
                const videoAnalysis = await analyzeVideoFrames(apiKey, [base64Content]);
                setAnalysis(videoAnalysis);
                addLog('GEMINI_VLM', `Analysis Complete: Detected ${videoAnalysis.tone} tone.`);

                await runSimulation(videoAnalysis, 'standard');
            } catch (error) {
                console.error(error);
                setProcessingState(ProcessingState.ERROR);
                addLog('ERROR', error instanceof Error ? error.message : 'Analysis failed');
            }
        };
    };

    const toggleFullScreen = async () => {
        try {
            if (!document.fullscreenElement) {
                await document.documentElement.requestFullscreen();
                setIsFullScreen(true);
            } else {
                if (document.exitFullscreen) {
                    await document.exitFullscreen();
                    setIsFullScreen(false);
                }
            }
        } catch (err) {
            console.error("Fullscreen error:", err);
            addLog('ERROR', `Fullscreen failed: ${(err as Error).message}`);
        }
    };

    const [analysisMode, setAnalysisMode] = useState<'fast' | 'deep'>('fast');

    const handleVideoUpload = useCallback(async (file: File) => {
        if (!apiKey) return;

        setVideoFile(file);
        setComments([]);
        setLogs([]);
        setAnalysis(null);
        setActivePersonas([]);
        setProcessingState(ProcessingState.EXTRACTING_FRAMES);
        addLog('INGESTION', `Video loaded: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB)`);

        try {
            let videoAnalysis: VideoAnalysis;

            if (analysisMode === 'fast') {
                // 1. FAST MODE: Extract Frames
                addLog('FRAME_EXTRACTOR', 'Fast Mode: Sampling 10 keyframes...');
                const frames = await extractFramesFromVideo(file, 10);
                addLog('FRAME_EXTRACTOR', `Extracted ${frames.length} keyframes.`);

                // 2. Analyze Frames
                setProcessingState(ProcessingState.ANALYZING_VIDEO);
                addLog('GEMINI_VLM', 'Sending frames to Gemini 3.0...');
                videoAnalysis = await analyzeVideoFrames(apiKey, frames);

            } else {
                // 1. DEEP MODE: Full Video
                setProcessingState(ProcessingState.ANALYZING_VIDEO);
                addLog('GEMINI_VLM', 'Deep Mode: Uploading full video to Gemini 3.0...');
                addLog('GEMINI_VLM', 'This may take longer for temporal understanding...');
                // Note: analyzeFullVideo needs to be imported
                const { analyzeFullVideo } = await import('../services/geminiService');
                videoAnalysis = await analyzeFullVideo(apiKey, file);
            }

            setAnalysis(videoAnalysis);
            addLog('GEMINI_VLM', `Analysis Complete: Detected ${videoAnalysis.tone} tone.`);
            addLog('GEMINI_VLM', `Virality Score: ${videoAnalysis.virality.score}/100`);

            // 3. Start Simulation (Standard by default)
            await runSimulation(videoAnalysis, 'standard');

        } catch (error) {
            console.error(error);
            setProcessingState(ProcessingState.ERROR);
            addLog('ERROR', error instanceof Error ? error.message : 'Unknown error occurred');
        }
    }, [apiKey, analysisMode]);

    const runSimulation = async (videoAnalysis: VideoAnalysis, mode: SimulationMode) => {
        try {
            // Reset fallback history so we start with a fresh pool of unique comments
            resetFallbackHistory();

            setProcessingState(ProcessingState.RETRIEVING_PERSONAS);
            addLog('AGENT_ORCHESTRATOR', `Mode: ${mode.toUpperCase()}. Querying Persona Corpus...`);

            const personas = await generatePersonas(apiKey, videoAnalysis, mode);
            setActivePersonas(personas);
            addLog('AGENT_ORCHESTRATOR', `Retrieved ${personas.length} ${mode} personas.`);

            setProcessingState(ProcessingState.GENERATING_COMMENTS);
            addLog('REACTION_ENGINE', `Spinning up ${personas.length} parallel agent threads...`);

            // Clear old comments if restarting simulation
            setComments([]);

            // 1. Parallel Execution with Staggered Start (Throttling)
            const commentPromises = personas.map(async (persona, index) => {
                // Stagger start time by 800ms per persona to avoid hitting 429 Rate Limits
                await new Promise(resolve => setTimeout(resolve, index * 800));

                try {
                    const result = await generateCommentForPersona(apiKey, persona, videoAnalysis, mode);
                    return { persona, ...result, success: true };
                } catch (e) {
                    console.warn(`Failed to generate comment for ${persona.handle}`, e);
                    // Log the failure to the UI so the user knows
                    addLog('ERROR', `Failed to generate comment for @${persona.handle}`);
                    return { persona, text: "", isGenerated: false, success: false };
                }
            });

            // 2. Paced Display Loop: Stagger the comments visually
            for (const promise of commentPromises) {
                // Display delay for UX (independent of generation delay)
                await new Promise(r => setTimeout(r, Math.random() * 800 + 400));

                const result = await promise;

                if (result.success) {
                    // Log before setting state to verify data
                    console.log("Adding comment:", result.text.substring(0, 20) + "...");

                    const newComment: Comment = {
                        id: generateId(),
                        persona: result.persona,
                        text: result.text,
                        timestamp: 'Just now',
                        likes: Math.floor(Math.random() * 100),
                        isGenerated: result.isGenerated
                    };

                    setComments(prev => {
                        const updated = [newComment, ...prev];
                        // console.log("Updated comments count:", updated.length);
                        return updated;
                    });

                    // Log source with specific error if present
                    if (result.isGenerated) {
                        addLog('REACTION_ENGINE', `[GEMINI_API] Success: @${result.persona.handle}`);
                    } else {
                        // If it was a safety/error fallback, log clearly
                        const reason = result.error || "Unknown Error";
                        addLog('REACTION_ENGINE', `[FALLBACK] @${result.persona.handle} (${reason})`);
                    }
                }
            }

            setProcessingState(ProcessingState.COMPLETE);
            addLog('SYSTEM', 'Simulation cycle complete.');
        } catch (error) {
            console.error(error);
            setProcessingState(ProcessingState.ERROR);
            addLog('ERROR', 'Simulation failed.');
        }
    };

    const handleModeChange = (mode: SimulationMode) => {
        if (processingState === ProcessingState.IDLE || !analysis) return;

        setSimulationMode(mode);
        // Re-run simulation with existing analysis
        runSimulation(analysis, mode);
    };

    if (isInitializing) {
        return <div className="flex items-center justify-center h-screen bg-gray-950 text-gray-500">Loading...</div>;
    }

    if (!apiKey) {
        return <Settings onSave={handleSaveKey} />;
    }

    return (
        <div className="flex flex-col h-screen bg-gray-950 overflow-hidden text-gray-100 font-sans">
            {/* Header */}
            <header className="h-14 border-b border-gray-800 bg-gray-900/50 backdrop-blur flex items-center justify-between px-4 z-20 shrink-0 relative">
                <div className="flex items-center gap-3">
                    <img src={logo} alt="Logo" className="w-8 h-8 rounded-lg shadow-lg shadow-brand-500/20" />
                    <h1 className="text-sm font-bold tracking-tight text-white">Tough<span className="text-brand-400">Crowd</span></h1>
                </div>

                <div className="flex items-center gap-2">
                    {/* Full Screen Toggle */}
                    <button
                        onClick={toggleFullScreen}
                        className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
                        title={isFullScreen ? "Exit Full Screen" : "Full Screen"}
                    >
                        {isFullScreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
                    </button>

                    {/* Hamburger Menu */}
                    <div className="relative">
                        <button
                            onClick={() => setIsMenuOpen(!isMenuOpen)}
                            className={`p-2 rounded-lg transition-colors ${isMenuOpen ? 'text-white bg-gray-800' : 'text-gray-400 hover:text-white hover:bg-gray-800'}`}
                        >
                            {isMenuOpen ? <X size={20} /> : <Menu size={20} />}
                        </button>

                        {/* Dropdown Menu */}
                        {isMenuOpen && (
                            <div className="absolute right-0 top-full mt-2 w-56 bg-gray-900 border border-gray-800 rounded-xl shadow-2xl py-2 animate-in fade-in slide-in-from-top-2 z-50">
                                <div className="px-4 py-2 border-b border-gray-800 mb-2">
                                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Model</p>
                                    <div className="flex items-center gap-2 text-brand-400 text-sm font-medium">
                                        <Cpu size={14} />
                                        <span>Gemini 3.0 Pro</span>
                                    </div>
                                </div>
                                <button
                                    onClick={() => {
                                        localStorage.removeItem('gemini_api_key');
                                        setApiKey('');
                                        setIsMenuOpen(false);
                                    }}
                                    className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:text-white hover:bg-gray-800 flex items-center gap-2 transition-colors"
                                >
                                    <LogOut size={16} />
                                    Reset API Key
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </header>

            {/* Main Layout */}
            <main className="flex-1 flex flex-col md:flex-row overflow-hidden relative" onClick={() => isMenuOpen && setIsMenuOpen(false)}>

                {/* Left Zone: Video, Stats, Logs */}
                <div className="flex-1 flex flex-col relative h-full min-w-0">

                    {/* Scrollable Content Area */}
                    <div className="flex-1 overflow-y-auto custom-scrollbar p-4">
                        <div className="max-w-7xl mx-auto h-full flex flex-col gap-6">

                            <div className="flex flex-col gap-6 items-start justify-center">
                                {/* Video Player Container */}
                                <div className="flex-1 w-full flex flex-col">
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="flex bg-gray-900 p-1 rounded-lg border border-gray-800">
                                            <button
                                                onClick={() => setAnalysisMode('fast')}
                                                className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${analysisMode === 'fast'
                                                    ? 'bg-gray-800 text-white shadow-sm'
                                                    : 'text-gray-500 hover:text-gray-300'
                                                    }`}
                                            >
                                                Fast (Frames)
                                            </button>
                                            <button
                                                onClick={() => setAnalysisMode('deep')}
                                                className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${analysisMode === 'deep'
                                                    ? 'bg-brand-900/50 text-brand-400 border border-brand-500/30 shadow-sm'
                                                    : 'text-gray-500 hover:text-gray-300'
                                                    }`}
                                            >
                                                Deep (Video)
                                            </button>
                                        </div>
                                    </div>
                                    <VideoPlayer
                                        videoFile={videoFile}
                                        processingState={processingState}
                                        onSelectFromCanvas={handleSelectFromCanvas}
                                        onUpload={handleVideoUpload}
                                    />
                                    {/* Active Personas Deck */}
                                    {activePersonas.length > 0 && (
                                        <PersonaDeck personas={activePersonas} currentMode={simulationMode} />
                                    )}
                                </div>

                                {/* Right Panel: Virality & Controls (Visible when analysis exists) */}
                                {analysis && (
                                    <div className="w-full shrink-0 space-y-4 animate-in slide-in-from-right-10 fade-in duration-500 delay-100">
                                        <ViralityScorecard metrics={analysis.virality} />

                                        {/* Simulation Controls */}
                                        <div className="bg-gray-900/90 backdrop-blur-md border border-gray-800 rounded-xl p-5 shadow-xl">
                                            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4 border-b border-gray-800 pb-2">
                                                Audience Simulator
                                            </h3>

                                            <div className="space-y-3">
                                                <button
                                                    onClick={() => handleModeChange('standard')}
                                                    disabled={processingState !== ProcessingState.COMPLETE}
                                                    className={`w-full flex items-center justify-between p-3 rounded-lg border transition-all ${simulationMode === 'standard'
                                                        ? 'bg-brand-900/30 border-brand-500 text-white shadow-[0_0_15px_rgba(99,102,241,0.2)]'
                                                        : 'bg-gray-950 border-gray-800 text-gray-400 hover:border-gray-700'
                                                        } disabled:opacity-50 disabled:cursor-not-allowed`}
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <div className={`w-2 h-2 rounded-full ${simulationMode === 'standard' ? 'bg-brand-400 shadow-[0_0_8px_currentColor]' : 'bg-gray-600'}`}></div>
                                                        <span className="font-medium text-sm">Standard Audience</span>
                                                    </div>
                                                </button>

                                                <button
                                                    onClick={() => handleModeChange('troll')}
                                                    disabled={processingState !== ProcessingState.COMPLETE}
                                                    className={`w-full flex items-center justify-between p-3 rounded-lg border transition-all group ${simulationMode === 'troll'
                                                        ? 'bg-red-900/20 border-red-500 text-white shadow-[0_0_15px_rgba(239,68,68,0.2)]'
                                                        : 'bg-gray-950 border-gray-800 text-gray-400 hover:border-red-900/50 hover:text-gray-200'
                                                        } disabled:opacity-50 disabled:cursor-not-allowed`}
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <div className={`w-2 h-2 rounded-full ${simulationMode === 'troll' ? 'bg-red-500 shadow-[0_0_8px_currentColor] animate-pulse' : 'bg-gray-600 group-hover:bg-red-900'}`}></div>
                                                        <span className="font-medium text-sm group-hover:text-red-400 transition-colors">Troll Test (Critical)</span>
                                                    </div>
                                                    {simulationMode === 'troll' && (
                                                        <span className="text-[10px] bg-red-500/20 text-red-400 px-1.5 py-0.5 rounded border border-red-500/30">ACTIVE</span>
                                                    )}
                                                </button>

                                                <p className="text-xs text-gray-500 mt-2 px-1">
                                                    {simulationMode === 'standard'
                                                        ? "Simulates a balanced mix of fans, neutrals, and casual viewers."
                                                        : "Simulates a hostile environment to stress-test content against negative sentiment."}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                        </div>
                    </div>

                    {/* Logs Area (Bottom of left zone) */}
                    <div className="border-t border-gray-800 shrink-0">
                        <OrchestratorLog logs={logs} state={processingState} />
                    </div>
                </div>

                {/* Right Column: Comments (Sidebar) */}
                <div className={`w-full md:w-[350px] lg:w-[400px] border-l border-gray-800 shadow-2xl relative z-20 flex flex-col transition-colors duration-700 ${simulationMode === 'troll' ? 'bg-red-950/5' : 'bg-gray-900'}`}>
                    <div className={`p-4 border-b border-gray-800 z-10 flex justify-between items-center h-14 shrink-0 ${simulationMode === 'troll' ? 'bg-red-900/10' : 'bg-gray-900'}`}>
                        <h2 className="text-sm font-bold text-white flex items-center gap-2 uppercase tracking-wider">
                            {simulationMode === 'troll' ? (
                                <>
                                    <svg className="w-4 h-4 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                    </svg>
                                    <span className="text-red-400">Hostile Feed</span>
                                </>
                            ) : (
                                <>
                                    <svg className="w-4 h-4 text-brand-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
                                    </svg>
                                    <span>Live Comments</span>
                                </>
                            )}
                        </h2>
                        <span className="text-xs bg-gray-800 text-gray-400 px-2 py-0.5 rounded-full border border-gray-700">{comments.length}</span>
                    </div>

                    <div className="flex-1 overflow-hidden relative">
                        <CommentFeed
                            comments={comments}
                            isLoading={processingState === ProcessingState.GENERATING_COMMENTS}
                        />
                        {/* Gradient Overlay at bottom for fade effect */}
                        <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-gray-900 to-transparent pointer-events-none"></div>
                    </div>
                </div>

            </main>
        </div>
    );
};

export default App;
