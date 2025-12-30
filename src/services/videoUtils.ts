/**
 * Extracts frames from a video file at specific intervals.
 * Returns an array of base64 strings (image/jpeg).
 */
export const extractFramesFromVideo = async (videoFile: File, frameCount: number = 10): Promise<string[]> => {
    return new Promise((resolve, reject) => {
        const video = document.createElement('video');
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const frames: string[] = [];

        // Create a temporary URL for the file
        const url = URL.createObjectURL(videoFile);

        video.src = url;
        video.muted = true;
        video.playsInline = true;
        video.crossOrigin = 'anonymous';

        // Wait for metadata to load to know duration
        video.onloadedmetadata = async () => {
            canvas.width = 480; // Resize to save tokens/bandwidth
            canvas.height = video.videoHeight * (480 / video.videoWidth);

            const duration = video.duration;
            // Skip the very beginning and end to avoid black frames
            const step = duration / (frameCount + 1);

            try {
                for (let i = 1; i <= frameCount; i++) {
                    const time = step * i;
                    await seekToTime(video, time);

                    if (ctx) {
                        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                        // Get base64 data without prefix for Gemini API compatibility if needed, 
                        // but usually we keep prefix for handling locally, then strip before sending.
                        const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
                        frames.push(dataUrl);
                    }
                }
                URL.revokeObjectURL(url);
                resolve(frames);
            } catch (err) {
                URL.revokeObjectURL(url);
                reject(err);
            }
        };

        video.onerror = (e) => {
            URL.revokeObjectURL(url);
            reject(new Error("Error loading video for processing"));
        };
    });
};

const seekToTime = (video: HTMLVideoElement, time: number): Promise<void> => {
    return new Promise((resolve) => {
        const onSeeked = () => {
            video.removeEventListener('seeked', onSeeked);
            resolve();
        };
        video.addEventListener('seeked', onSeeked);
        video.currentTime = time;
    });
};
