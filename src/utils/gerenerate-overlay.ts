import { toast } from "@/hooks/use-toast";

// Helper function to interpolate between colors
function interpolateColor(
    val: number,
    colors: [number, number, number][]
): [number, number, number] {
    if (val <= 0) return colors[0];
    if (val >= 1) return colors[colors.length - 1];

    const idx = (colors.length - 1) * val;
    const lowerIdx = Math.floor(idx);
    const upperIdx = Math.ceil(idx);
    const t = idx - lowerIdx;

    const c1 = colors[lowerIdx];
    const c2 = colors[upperIdx];

    return [
        Math.round(c1[0] * (1 - t) + c2[0] * t),
        Math.round(c1[1] * (1 - t) + c2[1] * t),
        Math.round(c1[2] * (1 - t) + c2[2] * t),
    ];
}

export const generateHeatmapOverlay = async (
    heatmap: number[][],
    originalImage: HTMLImageElement,
    alpha: number = 0.5 // Blend factor between original image and heatmap
) => {
    const canvas = document.createElement("canvas");
    canvas.width = originalImage.width;
    canvas.height = originalImage.height;
    const ctx = canvas.getContext("2d");

    if (!ctx) {
        toast({
            description: "Could not get canvas context.",
            variant: "destructive",
        });
        return;
    }

    // Draw original image
    ctx.drawImage(originalImage, 0, 0, canvas.width, canvas.height);

    // Create heatmap overlay
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;

    // Define color gradient (from blue to red, similar to OpenCV's COLORMAP_JET)
    const colors: [number, number, number][] = [
        [0, 0, 255], // Blue
        [0, 255, 255], // Cyan
        [0, 255, 0], // Green
        [255, 255, 0], // Yellow
        [255, 0, 0], // Red
    ];

    // Scale heatmap to image dimensions
    const scaleX = canvas.width / heatmap[0].length;
    const scaleY = canvas.height / heatmap.length;

    for (let y = 0; y < canvas.height; y++) {
        for (let x = 0; x < canvas.width; x++) {
            const heatmapX = Math.floor(x / scaleX);
            const heatmapY = Math.floor(y / scaleY);
            const value = heatmap[heatmapY][heatmapX];

            // Get interpolated color for heatmap value
            const [r, g, b] = interpolateColor(value, colors);

            // Calculate pixel position in imageData array
            const pos = (y * canvas.width + x) * 4;

            // Blend original image with heatmap color
            data[pos] = Math.round(data[pos] * (1 - alpha) + r * alpha); // R
            data[pos + 1] = Math.round(data[pos + 1] * (1 - alpha) + g * alpha); // G
            data[pos + 2] = Math.round(data[pos + 2] * (1 - alpha) + b * alpha); // B
            // Alpha channel remains unchanged
        }
    }

    ctx.putImageData(imageData, 0, 0);
    return canvas.toDataURL();
};
