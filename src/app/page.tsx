"use client";
import { useModel } from "@/context/model-context";
import { useRef, useState } from "react";

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

const MangoClassifier = () => {
    const { isLoading, isAnalyzing, prediction, setIsAnalyzing, predict } = useModel();
    const [error, setError] = useState<string | null>(null);
    const [isImageLoading, setIsImageLoading] = useState<boolean>(false);
    const imageRef = useRef<HTMLImageElement | null>(null);
    const fileInputRef = useRef<HTMLInputElement | null>(null);
    const canvasRef = useRef<HTMLCanvasElement | null>(null);


    const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            setIsImageLoading(true);
            const reader = new FileReader();
            reader.onload = (e) => {
                const img = new Image();
                img.src = e.target?.result as string;
                img.onload = () => {
                    if (imageRef.current) {
                        imageRef.current.src = img.src;
                    }
                    setIsImageLoading(false);
                };
            };
            reader.readAsDataURL(file);
        }
    };

    const makePrediction = async () => {
        setIsAnalyzing(true)
        try {

            if (!imageRef.current) {
                throw new Error("No image selected");
            }

            await predict(imageRef.current)
           
        } catch (err) {
            setError(
                `Prediction failed: ${
                    err instanceof Error ? err.message : "Unknown error"
                }`
            );
        }
    };
    
    if (isLoading) {
        return <div>Loading Mango Disease Classification model...</div>;
    }
    if (error) {
        return <div>Error: {error}</div>;
    }

    return (
        <div className="max-w-7xl mx-auto p-4">
            <h2 className="text-2xl font-bold mb-4">
                Mango Disease Classifier
            </h2>
            <div className="mb-4">
                <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    ref={fileInputRef}
                    className="mb-2 block w-full text-sm"
                />
            </div>
        
            <div className="mb-4 relative">
                {isImageLoading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-gray-200 bg-opacity-75 rounded-lg">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
                    </div>
                )}
                <img
                    ref={imageRef}
                    alt="Upload preview"
                    className="max-w-sm mx-auto rounded-lg shadow-lg"
                    style={{
                        display: imageRef.current ? "block" : "none",
                        maxHeight: "300px",
                        objectFit: "contain",
                    }}
                />
                <canvas ref={canvasRef} style={{ display: "none" }} />
            </div>

            <button
                onClick={makePrediction}
                disabled={!imageRef.current || isImageLoading || isAnalyzing}
                className="w-full px-4 py-2 bg-blue-500 text-white rounded-lg   "
            >
                {isAnalyzing
                    ? "Analyzing..."
                    : "Analyze Image"}
            </button>

            {isAnalyzing && (
                <div className="mt-4 flex justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                </div>
            )}
            {prediction && (
                <div className="mt-6 bg-white p-6 rounded-lg shadow-md">
                    <h3 className="text-xl font-bold mb-4">
                        Diagnosis Results
                    </h3>

                    <div className="mb-4">
                        <div className="text-lg">
                            Primary Diagnosis:
                            <span
                                className={`font-bold ml-2 ${
                                    prediction.className === "Healthy"
                                        ? "text-green-600"
                                        : "text-red-600"
                                }`}
                            >
                                {prediction.className}
                            </span>
                        </div>
                        <div className="text-gray-600">
                            Confidence:{" "}
                            {(prediction.probability * 100).toFixed(1)}%
                        </div>
                    </div>

                    {prediction.heatmapUrl? (
                        <div className="mb-6">
                            <h4 className="font-semibold text-gray-700 mb-2">
                                Heatmap Visualization:
                            </h4>
                            <img
                                src={
                                    prediction.heatmapUrl || "/placeholder.svg"
                                }
                                alt="Heatmap visualization"
                                className="max-w-sm mx-auto rounded-lg shadow-lg h-80 w-80 aspect-square"
                            />
                            <p className="text-sm text-gray-600 mt-2">
                                The heatmap shows areas of the image that
                                influenced the classification decision. Each
                                color represents a unique importance level, with
                                a smooth transition across the spectrum. This
                                detailed visualization highlights even subtle
                                differences in the model's focus areas.
                            </p>
                        </div>
                    ):(
                        <div className="h-80 w-80 aspect-square animate-pulse">

                        </div>
                    )}

                    <div className="space-y-3">
                        <h4 className="font-semibold text-gray-700">
                            Detailed Analysis:
                        </h4>
                        <div className="grid grid-cols-3 gap-2">
                        {prediction.probabilities.map(
                            ({ className, probability }) => (
                                <div key={className} className="space-y-1 p-4 border rounded-lg shadow">
                                    <div className="flex justify-between text-sm">
                                        <span>{className}</span>
                                        <span>
                                            {(probability * 100).toFixed(1)}%
                                        </span>
                                    </div>
                                    <div className="w-full bg-gray-200 rounded-full h-2">
                                        <div
                                            className={`h-2 rounded-full ${
                                                className === "Healthy"
                                                    ? "bg-green-500"
                                                    : "bg-blue-500"
                                            }`}
                                            style={{
                                                width: `${probability * 100}%`,
                                            }}
                                        />
                                    </div>
                                </div>
                            )
                        )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MangoClassifier;
