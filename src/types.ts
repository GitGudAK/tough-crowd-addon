export interface Persona {
    id: string;
    name: string;
    handle: string;
    avatarSeed: string; // Used for generic avatar generation
    trait: string; // e.g., "Skeptical", "Fanboy", "Expert"
    bio: string;
}

export interface Comment {
    id: string;
    persona: Persona;
    text: string;
    timestamp: string; // e.g., "2 minutes ago"
    likes: number;
    isGenerated?: boolean; // True if from Gemini, False if fallback
}

export interface ViralityMetrics {
    score: number; // 0-100
    hookScore: number; // 0-10
    pacingScore: number; // 0-10
    visualScore: number; // 0-10
    audioScore: number; // 0-10
    feedback: string;
}

export interface VideoAnalysis {
    summary: string;
    tone: string;
    suggestedPersonas: string[]; // Raw strings describing types of personas needed
    virality: ViralityMetrics;
}

export enum ProcessingState {
    IDLE = 'IDLE',
    EXTRACTING_FRAMES = 'EXTRACTING_FRAMES',
    ANALYZING_VIDEO = 'ANALYZING_VIDEO',
    RETRIEVING_PERSONAS = 'RETRIEVING_PERSONAS',
    GENERATING_COMMENTS = 'GENERATING_COMMENTS',
    COMPLETE = 'COMPLETE',
    ERROR = 'ERROR'
}

export interface LogEntry {
    id: string;
    step: string;
    message: string;
    timestamp: number;
}

export type SimulationMode = 'standard' | 'troll';
