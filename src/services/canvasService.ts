import { AddOnSDKAPI } from "https://new.express.adobe.com/static/add-on-sdk/sdk.js";

export const getSelectedVideo = async (addOnUISdk: AddOnSDKAPI): Promise<{ blob: Blob, type: 'video' | 'image' } | null> => {
    try {
        try {
            // 0. Priority: specific SELECTION (User selected video)
            // This often bypasses page-level rendering issues
            const output = await addOnUISdk.app.document.createRenditions({
                range: "selection",
                format: "mp4"
            } as any);

            if (output && output.length > 0) {
                console.log("Exported from Selection (MP4)");
                return { blob: output[0].blob, type: 'video' };
            }
        } catch (selectionError) {
            console.log("Selection export failed/empty, trying Page...", selectionError);
        }

        try {
            // 1. Fallback: Entire Current Page (MP4)
            const output = await addOnUISdk.app.document.createRenditions({
                range: "currentPage",
                format: "mp4"
            } as any);

            if (output && output.length > 0) {
                return { blob: output[0].blob, type: 'video' };
            }
        } catch (mp4Error: any) {
            console.warn("Page MP4 export failed, falling back to PNG:", mp4Error.message);

            // 2. Fallback to PNG (Snapshot)
            try {
                const output = await addOnUISdk.app.document.createRenditions({
                    range: "currentPage",
                    format: "png"
                } as any);

                if (output && output.length > 0) {
                    return { blob: output[0].blob, type: 'image' };
                }
            } catch (pngError: any) {
                console.warn("PNG export failed, falling back to JPG:", pngError.message);

                // 3. Last Resort: JPG
                try {
                    const output = await addOnUISdk.app.document.createRenditions({
                        range: "currentPage",
                        format: "jpg"
                    } as any);

                    if (output && output.length > 0) {
                        return { blob: output[0].blob, type: 'image' };
                    }
                } catch (jpgError: any) {
                    console.error("All export attempts failed.");
                    console.error("Last error (JPG):", jpgError);
                    // Throw the most recent error to be surfaced in the UI
                    throw new Error(`Export failed. Last error: ${jpgError.message || JSON.stringify(jpgError)}`);
                }
            }
        }

        return null;

    } catch (error: any) {
        console.error("CRITICAL CANVAS ERROR:", error);
        if (typeof error === 'object') {
            console.error("Error details:", JSON.stringify(error, Object.getOwnPropertyNames(error)));
        }
        throw error;
    }
};
