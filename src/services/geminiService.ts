import { GoogleGenAI, Type, Schema, HarmCategory, HarmBlockThreshold, GenerateContentResponse } from "@google/genai";
import { Persona, VideoAnalysis, SimulationMode } from "../types";

// Primary model for high reasoning
const PRIMARY_MODEL = 'gemini-3-pro-preview';
// Fallback model for stability (User requested NO lower versions, so we stick to 3.0 or similar high reasoning)
const FALLBACK_MODEL = 'gemini-3-pro-preview';

// Global registry to track used fallback comments and prevent duplicates
const usedFallbackTexts = new Set<string>();

export const resetFallbackHistory = () => {
    usedFallbackTexts.clear();
};

const POSITIVE_FALLBACKS = [
    "I really appreciate how you focused on the lighting setup here. The way the rim light separates the subject from the background is subtle but adds so much production value. It's those small details that make the difference.",
    "This is a great breakdown, but I think you could have spent a bit more time explaining the 'why' behind step 3. It's the most complex part and felt a bit rushed visually, though the end result is undeniable.",
    "The pacing here is spot on. I love that you let the shot linger on the final result so we could actually appreciate the texture. Most creators cut away too fast, but you gave the visuals room to breathe.",
    "Interesting choice to use a wide angle for the close-ups. It gives it a very dynamic feel, though the edges look a bit distorted. Have you considered an 85mm for those shots to flatten the perspective slightly?",
    "Super helpful tip about the workflow! I've been struggling with that specific bottleneck for months. Seeing you execute it in real-time clarified so much for me. I'm definitely subscribing for more deep dives like this.",
    "The sound design adds so much immersion here. The subtle foley work when you pick up the items makes it feel very tactile. It's something a lot of people overlook, but you nailed it.",
    "I love the color palette you went with. The teal and orange look is popular for a reason, but you managed to keep the skin tones looking natural, which is really hard to pull off.",
    "Your delivery is incredibly clear and concise. You cut out all the fluff and got straight to the value, which I respect. Too many videos drag on for 10 minutes for a 2-minute point.",
    "The use of b-roll here is excellent. It perfectly illustrates the concepts you're talking about without being distracting. Where do you source your stock footage, or did you shoot it all yourself?",
    "I was skeptical when I saw the thumbnail, but the depth of analysis here is surprising. You actually understand the underlying mechanics rather than just repeating what everyone else says.",
    "The typography you used for the chapter titles is so clean. It integrates perfectly with the environment tracking. How long did it take to motion track those labels?",
    "I've watched three other tutorials on this topic, but this is the first one that actually showed the mistake recovery process. Seeing how you fixed the error was more valuable than the perfect run.",
    "The audio mixing balance is perfect. Usually, the background music overpowers the voiceover in these types of videos, but you found the perfect pocket for the dialogue.",
    "That transition at 0:45 where you matched the movement of the camera to the object was seamless. It kept the energy flowing perfectly into the next segment.",
    "I appreciate that you didn't oversaturate the final image. A lot of people crank the vibrance way too high, but this looks cinematic and grounded in reality.",
    "The narrative arc you built into this review was unexpected. Starting with the conclusion and then working backwards really hooked me from the first frame.",
    "Can we talk about the set design? The depth of field you achieved really highlights the subject, but the background elements are interesting enough to add character without being distracting.",
    "The practical effects were a nice touch. CGI would have looked cheaper, but building the actual model gives it a tangible weight that translates well on screen.",
    "Your explanation of the theory behind this technique was excellent. It's rare to find content that balances high-level concepts with practical application so well.",
    "The 60fps frame rate really shines here during the fast-motion segments. It keeps the action readable where 24fps would have turned into a blur."
];

const NEGATIVE_FALLBACKS = [
    "I'm looking at the lighting in the intro and honestly, it's washing out all the detail. You need to diffuse that key light better because right now it looks amateur.",
    "I'm struggling to see the point of the edit at the 10-second mark. It cuts away way too fast before we can actually see the product details. It feels like you're hiding imperfections.",
    "The audio mixing is all over the place here. The background track completely overpowers the voiceover during the demo section. You need to sidechain that compression.",
    "Honestly, the color grading looks completely unnatural. The saturation on the greens is blown out, making it look radioactive rather than vibrant. Dial it back.",
    "This technique is technically incorrect. You're holding the tool wrong, which sets a dangerous example for beginners who might actually try this. Please do better research.",
    "Why is the pacing so frantic? I can't even process what's happening on screen because of the jump cuts every two seconds. It gives me a headache instead of information.",
    "The typography choice for the lower thirds is barely readable against that background. You need a drop shadow or a semi-transparent box behind the text if you want people to actually read it.",
    "Is the camera focus hunting in the second clip? It looks like you left autofocus on and it keeps pulsing. Very distracting for a 'professional' tutorial.",
    "The transition effects are incredibly dated. The star wipe and the slide-in animation scream 'Windows Movie Maker 2005'. Keep it simple with hard cuts or dissolves.",
    "I don't think you actually verified these facts. The statistics you mentioned at the start are from a study that was debunked three years ago. Do better due diligence.",
    "The narrative structure here is completely backwards. You gave away the reveal in the first 5 seconds, ruining the retention curve. Basic storytelling 101.",
    "Please stop using this shaky-cam handheld style for static product shots. Buy a cheap tripod. It's making the video unwatchable and nauseating.",
    "The background clutter is incredibly distracting. I spent half the video trying to figure out what that mess on the shelf was instead of listening to you. Clean your set.",
    "Your audio levels are clipping red constantly. It’s distorted and painful to listen to on headphones. Learn to use a limiter properly.",
    "Using a 24fps timeline for a gaming tutorial is a terrible choice. The motion blur destroys all the gameplay detail. This needs to be 60fps minimum.",
    "This feels overly scripted and robotic. You're clearly reading off a teleprompter and your eyes aren't even looking at the lens. It feels completely inauthentic.",
    "The text overlay obscures the actual action you're trying to demonstrate. Why would you put a giant subscribe button right over the focal point?",
    "Your white balance is shifting between cuts. One shot is warm, the next is cool. It looks like you left it on auto. Consistency is key for professional work.",
    "The 'humorous' skits in the middle add nothing and just pad the runtime. This could have been a 30-second short, but you dragged it out for ad revenue.",
    "I checked the timestamp, and you spent 4 minutes on the intro before actually starting the tutorial. That is disrespectful to the viewer's time.",
    "The resolution on the B-roll looks like 720p upscaled. If you're going to review 4K gear, you need to upload in 4K. It defeats the purpose.",
    "You completely skipped over the most important step in the process. You went from step A to C and assumed we'd figure out B. Not helpful for beginners.",
    "The music choice is totally inappropriate for the mood of the video. It's way too upbeat for a serious analysis video and creates a weird tonal clash.",
    "Why are you shouting? The gain on your microphone is fine, you don't need to project like you're in a crowded stadium. It's exhausting to listen to."
];

// Helper for delays
const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const getAIClient = (apiKey: string) => {
    return new GoogleGenAI({ apiKey: apiKey });
}

// Centralized Retry Wrapper for all API Calls
const generateContentWithRetry = async (apiKey: string, model: string, params: any, retries: number = 3): Promise<GenerateContentResponse> => {
    const ai = getAIClient(apiKey);
    try {
        return await ai.models.generateContent({
            model: model,
            ...params
        });
    } catch (err: any) {
        // Detect Retryable Errors: 429 (Rate Limit), 503 (Overloaded)
        const status = err.status || 0;
        const msg = err.message || '';
        const isRetryable = status === 429 || status === 503 || msg.includes('429') || msg.includes('503') || msg.includes('overloaded');

        if (retries > 0 && isRetryable) {
            const delay = 2000 + Math.random() * 2000; // Jittered backoff (2-4s)
            console.warn(`Gemini API Error (${status || msg}). Retrying in ${Math.round(delay)}ms...`);
            await wait(delay);
            return generateContentWithRetry(apiKey, model, params, retries - 1);
        }
        throw err;
    }
};

/**
 * Step A: Analyze Video Frames
 * Uses VLM capabilities to understand the video context and predict virality.
 */
export const analyzeVideoFrames = async (apiKey: string, base64Frames: string[]): Promise<VideoAnalysis> => {
    if (!apiKey) throw new Error("API Key missing");

    // Prepare contents: Text prompt + Image Parts
    const parts = base64Frames.map(frame => ({
        inlineData: {
            mimeType: 'image/jpeg',
            data: frame.split(',')[1] // Remove 'data:image/jpeg;base64,' prefix
        }
    }));

    const prompt = `
    Analyze these ${base64Frames.length} video frames to provide a deep content summary and a "Virality Prediction".
    
    1. Summarize the event/topic, identifying specific objects, actions, and the visual tone.
    2. Suggest 5 specific viewer personas who would care about this.
    3. Analyze "Virality Mechanics":
       - Score the "Hook" (0-10): How grabbing are the first few frames?
       - Score the "Pacing" (0-10): visual variety and speed.
       - Score the "Visuals" (0-10): clarity and aesthetic.
       - Score the "Audio" potential (0-10): implied audio interest based on visuals.
       - Calculate a Total Virality Score (0-100).
       - Provide 1 sentence of CONSTRUCTIVE feedback. It should be specific, actionable, and framed as a helpful suggestion for improvement rather than negative criticism.
  `;

    // Define schema for structured output
    const responseSchema: Schema = {
        type: Type.OBJECT,
        properties: {
            summary: { type: Type.STRING },
            tone: { type: Type.STRING },
            suggestedPersonas: {
                type: Type.ARRAY,
                items: { type: Type.STRING }
            },
            virality: {
                type: Type.OBJECT,
                properties: {
                    score: { type: Type.NUMBER },
                    hookScore: { type: Type.NUMBER },
                    pacingScore: { type: Type.NUMBER },
                    visualScore: { type: Type.NUMBER },
                    audioScore: { type: Type.NUMBER },
                    feedback: { type: Type.STRING }
                },
                required: ['score', 'hookScore', 'pacingScore', 'visualScore', 'audioScore', 'feedback']
            }
        },
        required: ['summary', 'tone', 'suggestedPersonas', 'virality']
    };

    const attemptAnalysis = async (model: string): Promise<VideoAnalysis> => {
        const response = await generateContentWithRetry(apiKey, model, {
            contents: {
                parts: [...parts, { text: prompt }]
            },
            config: {
                responseMimeType: 'application/json',
                responseSchema: responseSchema,
                temperature: 0.4
            }
        });

        if (response.text) {
            return JSON.parse(response.text) as VideoAnalysis;
        }
        throw new Error("No response text from Gemini");
    };

    try {
        // 1. Try Primary Model (Gemini 3.0 Pro)
        return await attemptAnalysis(PRIMARY_MODEL);
    } catch (error) {
        console.warn(`Analysis failed with ${PRIMARY_MODEL}. Fallback to ${FALLBACK_MODEL}.`, error);
        try {
            // 2. Try Fallback Model (Gemini 2.5 Flash)
            return await attemptAnalysis(FALLBACK_MODEL);
        } catch (fallbackError) {
            console.error("Analysis failed on both models", fallbackError);
            throw fallbackError;
        }
    }
};

/**
 * Step A2: Deep Analyze Full Video (Temporal)
 * Sends the full video blob to Gemini for native temporal understanding.
 */
export const analyzeFullVideo = async (apiKey: string, videoFile: File): Promise<VideoAnalysis> => {
    if (!apiKey) throw new Error("API Key missing");

    // Convert File to Base64
    const base64Data = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(videoFile);
        reader.onload = () => {
            const result = reader.result as string;
            // Remove prefix (e.g. "data:video/mp4;base64,")
            resolve(result.split(',')[1]);
        };
        reader.onerror = reject;
    });

    // Reuse the same prompt logic but emphasized for full video
    const prompt = `
    Analyze this full video to provide a deep content summary and a "Virality Prediction".
    
    1. Summarize the event/topic, identifying specific objects, actions, and the visual tone.
    2. Suggest 5 specific viewer personas who would care about this.
    3. Analyze "Virality Mechanics":
       - Score the "Hook" (0-10): How grabbing are the first few seconds?
       - Score the "Pacing" (0-10): visual variety and speed over time.
       - Score the "Visuals" (0-10): clarity and aesthetic.
       - Score the "Audio" potential (0-10): implied audio interest.
       - Calculate a Total Virality Score (0-100).
       - Provide 1 sentence of CONSTRUCTIVE feedback.
  `;

    // Define schema for structured output (Same as frames)
    const responseSchema: Schema = {
        type: Type.OBJECT,
        properties: {
            summary: { type: Type.STRING },
            tone: { type: Type.STRING },
            suggestedPersonas: {
                type: Type.ARRAY,
                items: { type: Type.STRING }
            },
            virality: {
                type: Type.OBJECT,
                properties: {
                    score: { type: Type.NUMBER },
                    hookScore: { type: Type.NUMBER },
                    pacingScore: { type: Type.NUMBER },
                    visualScore: { type: Type.NUMBER },
                    audioScore: { type: Type.NUMBER },
                    feedback: { type: Type.STRING }
                },
                required: ['score', 'hookScore', 'pacingScore', 'visualScore', 'audioScore', 'feedback']
            }
        },
        required: ['summary', 'tone', 'suggestedPersonas', 'virality']
    };

    const attemptAnalysis = async (model: string): Promise<VideoAnalysis> => {
        const response = await generateContentWithRetry(apiKey, model, {
            contents: {
                parts: [
                    {
                        inlineData: {
                            mimeType: videoFile.type || 'video/mp4',
                            data: base64Data
                        }
                    },
                    { text: prompt }
                ]
            },
            config: {
                responseMimeType: 'application/json',
                responseSchema: responseSchema,
                temperature: 0.4
            }
        });

        if (response.text) {
            return JSON.parse(response.text) as VideoAnalysis;
        }
        throw new Error("No response text from Gemini");
    };

    try {
        return await attemptAnalysis(PRIMARY_MODEL);
    } catch (error) {
        // Fallback or rethrow
        console.warn("Deep analysis failed.", error);
        throw error;
    }
};

/**
 * Step B: Retrieve/Generate Persona Details
 * "Orchestrator" creating detailed profiles based on the suggested types.
 * Supports "Standard" vs "Troll/Critical" modes.
 */
export const generatePersonas = async (apiKey: string, analysis: VideoAnalysis, mode: SimulationMode = 'standard'): Promise<Persona[]> => {
    let instruction = `
    CONTEXT: Fictional creative writing for audience simulation.
    Based on this video summary: "${analysis.summary}" and tone "${analysis.tone}", generate 6 detailed viewer personas.
  `;

    if (mode === 'troll') {
        instruction += `
        IMPORTANT: This is a "Stress Test" or "Adversarial Simulation". 
        Generate personas that are CRITICAL, HOSTILE, SKEPTICAL, or "TROLLS".
        Include types like "The Hater", "The Nitpicker", "The Politicizer", "The Correctionist".
        The goal is to simulate a worst-case comment section for research.
      `;
    } else {
        instruction += `
        Use these suggested types if relevant: ${JSON.stringify(analysis.suggestedPersonas)}.
        The goal is to simulate a realistic, organic mix of viewers (fans, neutrals, casuals, experts).
      `;
    }

    instruction += `
    Each persona should have:
    - A creative handle (username). Do NOT include the '@' symbol in the JSON string.
    - A realistic display name
    - A short bio explaining their specific perspective, obsession, or area of expertise.
    - A primary "trait" (e.g. "Skeptical", "Fanboy", "Expert", "Colorist").
    - An avatarSeed (random string).
  `;

    const responseSchema: Schema = {
        type: Type.ARRAY,
        items: {
            type: Type.OBJECT,
            properties: {
                id: { type: Type.STRING },
                name: { type: Type.STRING },
                handle: { type: Type.STRING },
                trait: { type: Type.STRING },
                bio: { type: Type.STRING },
                avatarSeed: { type: Type.STRING }
            },
            required: ['id', 'name', 'handle', 'trait', 'avatarSeed', 'bio']
        }
    };

    const attemptPersonas = async (model: string): Promise<Persona[]> => {
        const response = await generateContentWithRetry(apiKey, model, {
            contents: instruction,
            config: {
                responseMimeType: 'application/json',
                responseSchema: responseSchema,
                temperature: mode === 'troll' ? 0.95 : 0.85
            }
        });

        if (response.text) {
            const rawPersonas = JSON.parse(response.text) as Persona[];
            // Sanitize handles to remove '@' if present
            return rawPersonas.map(p => ({
                ...p,
                handle: p.handle.replace(/^@/, '')
            }));
        }
        throw new Error("No response text for personas");
    };

    try {
        // 1. Try Primary Model
        return await attemptPersonas(PRIMARY_MODEL);
    } catch (error) {
        console.warn(`Persona generation failed with ${PRIMARY_MODEL}. Fallback to ${FALLBACK_MODEL}.`, error);
        try {
            // 2. Try Fallback Model
            return await attemptPersonas(FALLBACK_MODEL);
        } catch (fallbackError) {
            console.error("Persona generation failed on both models", fallbackError);
            return []; // Return empty array to avoid crashing, app handles empty state
        }
    }
};

/**
 * Fallback generator in case API blocks "Troll" content or errors out.
 * Ensures the UI always populates with relevant sentiment and guarantees uniqueness.
 */
const getFallbackComment = (persona: Persona, mode: SimulationMode): string => {
    const pool = mode === 'troll' ? NEGATIVE_FALLBACKS : POSITIVE_FALLBACKS;

    // Filter out comments that have already been used in this session
    const available = pool.filter(c => !usedFallbackTexts.has(c));

    // If we've exhausted the pool (unlikely), reset for this specific subset or just pick from full pool
    const candidates = available.length > 0 ? available : pool;

    // Pick a random comment from the available candidates
    const selected = candidates[Math.floor(Math.random() * candidates.length)];

    // Mark as used
    usedFallbackTexts.add(selected);

    return selected;
};

interface CommentResult {
    text: string;
    isGenerated: boolean;
    error?: string;
}

/**
 * Step C: Generate a Comment
 * Simulates the specific persona watching the video.
 */
export const generateCommentForPersona = async (apiKey: string, persona: Persona, analysis: VideoAnalysis, mode: SimulationMode = 'standard'): Promise<CommentResult> => {
    // REFRAMED PROMPT: Avoid "Impersonation" triggers. Use Fictional Story context.
    const prompt = `
    TASK: Write a fictional social media comment for a screenplay scene.
    
    CHARACTER NAME: ${persona.name} (Handle: ${persona.handle})
    CHARACTER TRAIT: ${persona.trait}
    CHARACTER BIO: ${persona.bio}
    
    SCENE CONTEXT (The video they just watched):
    "${analysis.summary}"
    
    INSTRUCTIONS:
    Write a SUBSTANTIAL, NUANCED comment (3-5 sentences) from this character's perspective.
    
    ${mode === 'troll'
            ? `TONE: HYPER-CRITICAL, PEDANTIC, SKEPTICAL.
           - The character should find specific technical flaws (lighting, audio, logic).
           - The character should be ruthlessly logical, explaining WHY it is wrong.
           - Cite visual evidence.`
            : `TONE: CONSTRUCTIVE, ANALYTICAL, EXPERT.
           - The character should appreciate technical details.
           - Offer specific, actionable improvements.`
        }

    CONSTRAINTS:
    - Write ONLY the comment text.
    - Do NOT start with "As a..."
    - Use specific vocabulary matching the trait.
    - Random Seed: ${Math.random()}
  `;

    // Internal function to attempt generation with a specific model using the centralized retry logic
    const attemptGeneration = async (model: string): Promise<string> => {
        const response = await generateContentWithRetry(apiKey, model, {
            contents: prompt, // Send as string to ensure simple structure
            config: {
                temperature: 1.0,
                maxOutputTokens: 2048
            }
        }, 3); // 3 Retries

        if (response.text) {
            return response.text.trim();
        }

        // Check for candidates even if response.text helper didn't return (e.g. slight truncation)
        if (response.candidates && response.candidates.length > 0) {
            const candidate = response.candidates[0];

            // If it was truncated due to max tokens, but we have content, we should use it.
            if (candidate.finishReason === 'MAX_TOKENS') {
                const partsText = candidate.content?.parts?.map(p => p.text).join('') || '';
                if (partsText.trim().length > 0) {
                    return partsText.trim();
                }
            }

            if (candidate.finishReason !== 'STOP') {
                throw new Error(`Model Refusal: ${candidate.finishReason}`);
            }
        }

        throw new Error("Empty response text");
    };

    try {
        // 1. Try Primary Model (Gemini 3.0 Pro)
        const text = await attemptGeneration(PRIMARY_MODEL);
        return { text, isGenerated: true };

    } catch (err: any) {
        console.warn(`Primary model (${PRIMARY_MODEL}) failed: ${err.message}. Attempting fallback to ${FALLBACK_MODEL}...`);

        try {
            // 2. Try Fallback Model (Gemini 2.5 Flash) - More stable/faster
            const text = await attemptGeneration(FALLBACK_MODEL);
            return { text, isGenerated: true };

        } catch (fallbackErr: any) {
            let errorMessage = "API Error";
            if (fallbackErr.message) errorMessage = fallbackErr.message;
            console.error(`All models failed for @${persona.handle}. Reason: ${errorMessage}`);

            // 3. Return Canned Fallback
            return {
                text: getFallbackComment(persona, mode),
                isGenerated: false,
                error: errorMessage
            };
        }
    }
};
