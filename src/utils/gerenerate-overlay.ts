"use client"
import * as tf from "@tensorflow/tfjs";
import { useRef } from "react";

export const generateHeatmapOverlay = async (
    heatmap: number[][],
    originalImage: HTMLImageElement
) => {
    const canvas = document.createElement('canvas');
    canvas.width = originalImage.width;
    canvas.height = originalImage.height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    // Set canvas size to match the original image

    // Draw original image
    ctx.drawImage(originalImage, 0, 0, canvas.width, canvas.height);

    // Create heatmap overlay
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;

    // Scale heatmap to match canvas dimensions
    const scaledHeatmap = tf.tidy(() => {
        const heatmapTensor = tf.tensor3d(
            heatmap.map((row) => row.map((val) => [val])),
            [heatmap.length, heatmap[0].length, 1]
        );
        return tf.image.resizeBilinear(heatmapTensor, [
            canvas.height,
            canvas.width,
        ]);
    });

    const heatmapData = await scaledHeatmap.data();
    scaledHeatmap.dispose();

    // Function to generate a unique color for each value
    const generateUniqueColor = (
        value: number
    ): [number, number, number] => {
        const hue = value * 360; // Map value (0-1) to hue (0-360)
        const saturation = 100; // Full saturation
        const lightness = 50; // Medium lightness

        // Convert HSL to RGB
        const c =
            ((1 - Math.abs((2 * lightness) / 100 - 1)) * saturation) / 100;
        const x = c * (1 - Math.abs(((hue / 60) % 2) - 1));
        const m = lightness / 100 - c / 2;

        let r, g, b;
        if (hue < 60) {
            [r, g, b] = [c, x, 0];
        } else if (hue < 120) {
            [r, g, b] = [x, c, 0];
        } else if (hue < 180) {
            [r, g, b] = [0, c, x];
        } else if (hue < 240) {
            [r, g, b] = [0, x, c];
        } else if (hue < 300) {
            [r, g, b] = [x, 0, c];
        } else {
            [r, g, b] = [c, 0, x];
        }

        return [
            Math.round((r + m) * 255),
            Math.round((g + m) * 255),
            Math.round((b + m) * 255),
        ];
    };

    // Overlay heatmap
    for (let i = 0; i < data.length; i += 4) {
        const heatValue = heatmapData[Math.floor(i / 4)];
        const [r, g, b] = generateUniqueColor(heatValue);

        // Apply color with alpha blending
        const alpha = 0.7; // Adjust for desired opacity
        data[i] = Math.round(data[i] * (1 - alpha) + r * alpha);
        data[i + 1] = Math.round(data[i + 1] * (1 - alpha) + g * alpha);
        data[i + 2] = Math.round(data[i + 2] * (1 - alpha) + b * alpha);
        data[i + 3] = 255; // Alpha channel
    }

    ctx.putImageData(imageData, 0, 0);
    return canvas.toDataURL();
};