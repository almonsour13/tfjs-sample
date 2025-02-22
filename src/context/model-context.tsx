"use client";
import { useToast } from "@/hooks/use-toast";
import { generateHeatmapOverlay } from "@/utils/gerenerate-overlay";
import { gradClassActivationMap } from "@/utils/grad-cam";
import * as tf from "@tensorflow/tfjs";
import React, { createContext, ReactNode, useCallback, useEffect, useState } from "react";

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
    probabilities: Array<{
        className: string;
        probability: number;
    }>;
    imageRmvBg?: string;
    heatmapUrl?: string;
}
// Define the type for the context
interface ModelContextType {
    model: tf.LayersModel | null;
    isLoading: boolean;
    isAnalyzing: boolean;
    setIsAnalyzing: React.Dispatch<React.SetStateAction<boolean>>;
    error: string | null;
    setError: React.Dispatch<React.SetStateAction<string | null>>;
    showGradCam: boolean;
    setShowGradCam: React.Dispatch<React.SetStateAction<boolean>>;
    prediction: PredictionResult | null;
    setPrediction: React.Dispatch<React.SetStateAction<PredictionResult | null>>;
    predict: (image: string) => void;
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
    const [showGradCam, setShowGradCam] = useState(false);
    const { toast } = useToast();
  
    // Load the TensorFlow.js model
    const loadModel = useCallback(async () => {
        try {
            const loadedModel = await tf.loadLayersModel("/model/model.json");
            setModel(loadedModel);
            setIsLoading(false);
            console.log("Model is loaded")
        } catch (err) {
            toast({
                description: `Prediction failed: ${
                    err instanceof Error ? err.message : "Unknown error"
                }`,
                variant:"destructive"
              })
            setIsLoading(false);
        }
    },[toast]);

    // Optionally, load the model on mount
    useEffect(() => {
        loadModel();
    }, [loadModel]);

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
    const predict = async (image: string) => {
        setIsAnalyzing(true);
        setPrediction(null);

        try {
            if (!model) {
                return console.log("Model not loaded");
            }

            const img = new Image();
            img.src = image;
            // const imageRmvBg = await removeBg(img);
            // if(imageRmvBg){
            //     setPrediction((prev) => ({
            //         ...prev!,
            //         imageRmvBg: imageRmvBg as string,
            //     }));
            // }
            const inputTensor = await preprocessImage(img);
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

            predictionWithClasses.sort((a, b) => b.probability - a.probability);
            // .filter((a) => a.probability * 100 > 0);

            const initialPrediction = {
                probabilities: predictionWithClasses,
            };

            setPrediction(initialPrediction);
            if (showGradCam) {
                const heatmaps = await gradClassActivationMap(
                    model,
                    inputTensor,
                    [predictedClassIndex]
                );
                const heatmapUrl = await generateHeatmapOverlay(
                    heatmaps[0],
                    img
                );

                setPrediction((prev) => ({
                    ...prev!,
                    heatmapUrl: heatmapUrl || undefined,
                }));
            }
            tf.dispose([inputTensor, predictionTensor]);
        } catch (err) {
            console.log(err);
            toast({
                description: `Prediction failed: ${
                    err instanceof Error ? err.message : "Unknown error"
                }`,
                variant:"destructive"
              })
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
                error,
                setError,
                setIsAnalyzing,
                showGradCam,
                setShowGradCam,
                prediction,
                setPrediction,
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
