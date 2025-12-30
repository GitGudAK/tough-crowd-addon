import React from 'react';
import { ViralityMetrics } from '../types';

interface ViralityScorecardProps {
    metrics: ViralityMetrics;
}

export const ViralityScorecard: React.FC<ViralityScorecardProps> = ({ metrics }) => {
    const getScoreColor = (score: number) => {
        if (score >= 80) return 'text-green-400';
        if (score >= 60) return 'text-yellow-400';
        return 'text-red-400';
    };

    const getBarColor = (score: number) => {
        if (score >= 8) return 'bg-green-500';
        if (score >= 6) return 'bg-yellow-500';
        return 'bg-red-500';
    };

    // Circumference for r=52 (2 * pi * 52 ≈ 327)
    const CIRCUMFERENCE = 327;

    return (
        <div className="w-full bg-gray-900/90 backdrop-blur-md border border-gray-800 rounded-xl p-5 shadow-xl animate-in slide-in-from-right-8 fade-in duration-700">
            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4 border-b border-gray-800 pb-2">
                Virality Intelligence
            </h3>

            <div className="flex flex-col gap-6 items-center">

                {/* Main Score Gauge */}
                <div className="relative flex flex-col items-center justify-center py-2">
                    {/* Added viewBox and overflow-visible to prevent clipping */}
                    <svg
                        className="w-32 h-32 transform -rotate-90 filter drop-shadow-[0_0_10px_rgba(0,0,0,0.5)] overflow-visible"
                        viewBox="0 0 128 128"
                    >
                        {/* Background Track */}
                        <circle
                            className="text-gray-800"
                            strokeWidth="10"
                            stroke="currentColor"
                            fill="transparent"
                            r="52"
                            cx="64"
                            cy="64"
                        />
                        {/* Value Arc */}
                        <circle
                            className={`${getScoreColor(metrics.score)} transition-all duration-1000 ease-out`}
                            strokeWidth="10"
                            strokeDasharray={CIRCUMFERENCE}
                            strokeDashoffset={CIRCUMFERENCE - (CIRCUMFERENCE * metrics.score) / 100}
                            strokeLinecap="round"
                            stroke="currentColor"
                            fill="transparent"
                            r="52"
                            cx="64"
                            cy="64"
                        />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className={`text-5xl font-black ${getScoreColor(metrics.score)} drop-shadow-md`}>
                            {metrics.score}
                        </span>
                        <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mt-1">Score</span>
                    </div>
                </div>

                {/* Detailed Metrics */}
                <div className="w-full space-y-3">
                    <MetricBar label="Hook Strength" score={metrics.hookScore} color={getBarColor(metrics.hookScore)} />
                    <MetricBar label="Pacing" score={metrics.pacingScore} color={getBarColor(metrics.pacingScore)} />
                    <MetricBar label="Visual Appeal" score={metrics.visualScore} color={getBarColor(metrics.visualScore)} />
                    <MetricBar label="Audio Potential" score={metrics.audioScore} color={getBarColor(metrics.audioScore)} />
                </div>

                <div className="w-full bg-gray-950/50 rounded-lg p-3 border border-gray-800/50">
                    <div className="flex items-center gap-2 mb-1">
                        <svg className="w-3 h-3 text-brand-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="text-xs font-bold text-brand-400 uppercase">Analysis</span>
                    </div>
                    <p className="text-xs text-gray-300 leading-relaxed">
                        {metrics.feedback}
                    </p>
                </div>

            </div>
        </div>
    );
};

const MetricBar = ({ label, score, color }: { label: string, score: number, color: string }) => (
    <div className="flex flex-col gap-1.5">
        <div className="flex justify-between text-[11px] uppercase tracking-wider font-semibold">
            <span className="text-gray-500">{label}</span>
            <span className="text-gray-300">{score}/10</span>
        </div>
        <div className="h-1.5 w-full bg-gray-800 rounded-full overflow-hidden">
            <div
                className={`h-full ${color} transition-all duration-1000 shadow-[0_0_10px_currentColor]`}
                style={{ width: `${(score / 10) * 100}%` }}
            />
        </div>
    </div>
);
