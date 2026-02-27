"use server";

export async function generateVideo(options: {
    prompt: string;
    aspectRatio?: string;
    model?: string;
    duration?: string;
    image?: string;
}) {
    const { prompt, aspectRatio = "16:9", model = "wan2.2-t2v-14b", duration = "5s", image } = options;
    const apiKey = process.env.PACKET_AI_API_KEY;

    if (!apiKey) {
        throw new Error("PACKET_AI_API_KEY is not configured");
    }

    // Determine resolution class based on model
    const is480p = model.includes("480p") || model.includes("wan2.1-t2v");

    // Map aspect ratio to dimensions
    let size = "1024x1024";

    if (is480p) {
        if (aspectRatio === "16:9") size = "832x480";
        else if (aspectRatio === "9:16") size = "480x832";
        else if (aspectRatio === "1:1") size = "480x480";
        else if (aspectRatio === "21:9") size = "832x352";
    } else {
        if (aspectRatio === "16:9") size = "1280x720";
        else if (aspectRatio === "9:16") size = "720x1280";
        else if (aspectRatio === "1:1") size = "720x720";
        else if (aspectRatio === "21:9") size = "1280x544";
    }

    // CogVideoX specific resolution handle if needed
    if (model.includes("cogvideox")) {
        if (aspectRatio === "16:9") size = "1360x768";
        else if (aspectRatio === "9:16") size = "768x1360";
    }

    // Map duration to frames (assuming 16 fps)
    const num_frames = duration === "10s" ? 161 : 81;

    try {
        const response = await fetch("https://packet.ai/api/v1/images/generations", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${apiKey}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                model: model,
                prompt: prompt,
                size: size,
                response_format: "b64_json",
                num_frames: num_frames,
                fps: 16,
                ...(image && { image })
            }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error?.message || "Failed to generate video");
        }

        const result = await response.json();

        // The response contains an array of data objects
        // For video, it's typically one item
        if (result.data && result.data.length > 0) {
            const b64Data = result.data[0].b64_json;
            return {
                success: true,
                videoData: `data:video/mp4;base64,${b64Data}`
            };
        }

        throw new Error("No video data received from API");
    } catch (error: any) {
        console.error("Video generation error:", error);
        return {
            success: false,
            error: error.message || "An unexpected error occurred"
        };
    }
}
