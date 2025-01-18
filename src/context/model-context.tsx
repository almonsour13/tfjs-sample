"use client";
import React, { createContext, useState, useEffect, ReactNode } from "react";
import * as tf from "@tensorflow/tfjs";
import { gradClassActivationMap } from "@/utils/grad-cam";
import { generateHeatmapOverlay } from "@/utils/gerenerate-overlay";

const classes = [
    "Anthracnose",
    "Bacterial Canker",
    "Cutting Weevil",
    "Die Back",
    "Gall Midge",
    "Healthy",
    "Powdery Mildew",
    "Sooty Mould",
];

interface PredictionResult {
    className: string;
    probability: number;
    probabilities: Array<{
        className: string;
        probability: number;
    }>;
    heatmapUrl?: string;
}
// Define the type for the context
interface ModelContextType {
    model: tf.LayersModel | null;
    isLoading: boolean;
    isAnalyzing: boolean;
    setIsAnalyzing: React.Dispatch<React.SetStateAction<boolean>>;
    prediction: PredictionResult | null;
    predict: (image: HTMLImageElement) => void;
}

// Create the context with a default value
const ModelContext = createContext<ModelContextType | undefined>(undefined);

// Create the provider component
export const ModelProvider: React.FC<{ children: ReactNode }> = ({
    children,
}) => {
    const [model, setModel] = useState<tf.LayersModel | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
    const [prediction, setPrediction] = useState<PredictionResult | null>(null);

    // Load the TensorFlow.js model
    const loadModel = async () => {
        try {
            const loadedModel = await tf.loadLayersModel("/model/model.json");
            setModel(loadedModel);
            setIsLoading(false);
        } catch (err) {
            setError(
                `Failed to load model: ${
                    err instanceof Error ? err.message : "Unknown error"
                }`
            );
            setIsLoading(false);
        }
    };

    // Optionally, load the model on mount
    useEffect(() => {
        loadModel();
    }, []);

    const preprocessImage = async (
        imageElement: HTMLImageElement
    ): Promise<tf.Tensor> => {
        return tf.tidy(() => {
            const tensor = tf.browser
                .fromPixels(imageElement)
                .resizeNearestNeighbor([224, 224])
                .expandDims()
                .toFloat()
                .div(255.0);
            return tensor;
        });
    };
    const predict = async (image: HTMLImageElement) => {
        setIsAnalyzing(true);
        setPrediction(null)

        try {
            if (!model) {
                throw new Error("Model not loaded");
            }

            const inputTensor = await preprocessImage(image);
            const predictionTensor = model.predict(inputTensor) as tf.Tensor;
            const predictionArray = await predictionTensor.data();
            const predictedClassIndex = predictionArray.indexOf(
                Math.max(...predictionArray)
            );

            const predictionWithClasses = Array.from(predictionArray).map(
                (prob, idx) => ({
                    className: classes[idx],
                    probability: prob,
                })
            );

            predictionWithClasses
                .sort((a, b) => b.probability - a.probability)
                // .filter((a) => a.probability * 100 > 0);

            

            const initialPrediction = {
                className: predictionWithClasses[0].className,
                probability: predictionWithClasses[0].probability,
                probabilities: predictionWithClasses,
            };

            setPrediction(initialPrediction);
            // const heatmaps = await gradClassActivationMap(model, inputTensor, [
            //     predictedClassIndex,
            // ]);
            // const heatmapUrl = await generateHeatmapOverlay(heatmaps[0], image);

            // setPrediction((prev) => ({
            //     ...prev!,
            //     heatmapUrl: heatmapUrl || undefined,
            // }));
            tf.dispose([inputTensor, predictionTensor]);
        } catch (err) {
            setError(
                `Prediction failed: ${
                    err instanceof Error ? err.message : "Unknown error"
                }`
            );
        } finally {
            setIsAnalyzing(false);
        }
    };

    return (
        <ModelContext.Provider
            value={{
                model,
                isLoading,
                isAnalyzing,
                setIsAnalyzing,
                prediction,
                predict,
            }}
        >
            {children}
        </ModelContext.Provider>
    );
};

export const useModel = () => {
    const context = React.useContext(ModelContext);
    if (!context) {
        throw new Error("useModel must be used within a ModelProvider");
    }
    return context;
};
