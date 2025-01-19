"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { useModel } from "@/context/model-context";
import { ImagePlus, X } from "lucide-react";
import Image from "next/image";
import { useState } from "react";

const MangoClassifier = () => {
    const {
        isLoading,
        isAnalyzing,
        error,
        setError,
        prediction,
        setIsAnalyzing,
        showGradCam,
        setShowGradCam,
        predict,
        setPrediction,
    } = useModel();
    const [isImageLoading, setIsImageLoading] = useState<boolean>(false);
    const [imageSrc, setImageSrc] = useState<string | null>(null);
    const [dragActive, setDragActive] = useState(false);
    
    const handleDrag = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true);
        } else if (e.type === "dragleave") {
            setDragActive(false);
        }
    };
    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleImageUpload(e.dataTransfer.files[0]);
        }
    };
    const handleImageUpload = (file: File) => {
        setIsImageLoading(true);
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                setImageSrc(e.target?.result as string);
                setIsImageLoading(false);
            };
            reader.readAsDataURL(file);
        }
    };
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            handleImageUpload(e.target.files[0]);
        }
    };
    const handleRemoveImage = () => {
        setImageSrc(null);
        setPrediction(null)
    };

    const makePrediction = async () => {
        setIsAnalyzing(true);
        setPrediction(null)
        try {
            if (!imageSrc) {
                throw new Error("No image selected");
            }
            await predict(imageSrc);
        } catch (err) {
            setError(
                `Prediction failed: ${
                    err instanceof Error ? err.message : "Unknown error"
                }`
            );
        }
    };
    if (isLoading) {
        return <Skeleton className="w-full h-[400px]" />;
    }
    if (error) {
        return <div className="text-red-500">Error: {error}</div>;
    }

    return (
        <Card className="max-w-3xl mx-auto border-0 shadow-none min-h-screen">
            <CardHeader>
                <CardTitle>Mango Disease Classifier</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-6">
                    <div className="relative h-80 p-0 flex items-center justify-center overflow-hidden bg-card border rounded-lg">
                    {imageSrc ? (
                        <div className="h-80 w-auto overflow-hidden flex item-center justify-center relative">
                            <Image
                                src={imageSrc}
                                alt="Uploaded"
                                className="h-80 w-auto object-cover"
                                width={256}
                                height={256}
                            />
                            {isAnalyzing && (
                                <>
                                    <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/80 to-transparent animate-scan" />
                                </>
                            )}
                            {!isAnalyzing && (
                                <div className="absolute top-2 right-2 flex space-x-2">
                                    <Button
                                        onClick={handleRemoveImage}
                                        size="icon"
                                        variant="destructive"
                                        className="rounded-full bg-destructive/80 hover:opacity-100 transition-opacity"
                                    >
                                        <X className="h-4 w-4" />
                                        <span className="sr-only">
                                            Remove image
                                        </span>
                                    </Button>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div
                            className={`flex-1 cursor-pointer flex bg-card hover:bg-muted flex-col items-center justify-center relative h-full w-full rounded-lg ${
                                dragActive ? "bg-muted" : ""
                            }`}
                            onDragEnter={handleDrag}
                            onDragLeave={handleDrag}
                            onDragOver={handleDrag}
                            onDrop={handleDrop}
                            onClick={() =>
                                document.getElementById("input-image")?.click()
                            }
                        >
                            {!dragActive && (
                                <div className="flex flex-col gap-2 text-center">
                                    <div className="flex justify-center text-foreground">
                                        <div className="rounded-full bg-primary p-4">
                                            <ImagePlus className="h-8 w-8 text-white" />
                                        </div>
                                    </div>
                                    <div className="space-y-0">
                                        <p className="text-lg sm:text-xl md:text-2xl font-semibold text-foreground">
                                            Click to add image
                                        </p>
                                        <p className="text-sm text-muted-foreground">
                                            or drag and drop
                                        </p>
                                        <div>
                                            <input
                                                type="file"
                                                accept="image/*"
                                                name="image"
                                                id="input-image"
                                                className="hidden"
                                                onChange={handleFileChange}
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                    </div>
                    <div className="flex items-center space-x-2">
                        <Checkbox
                            id="showGradCam"
                            checked={showGradCam}
                            onCheckedChange={(checked) =>
                                setShowGradCam(checked as boolean)
                            }
                        />
                        <Label htmlFor="showGradCam">
                            Show Heatmap Visualization
                        </Label>
                    </div>

                    <Button
                        onClick={makePrediction}
                        disabled={isImageLoading || isAnalyzing || !imageSrc}
                        className="w-full"
                    >
                        {isAnalyzing ? "Analyzing..." : "Analyze Image"}
                    </Button>

                    {prediction && imageSrc && (
                        <Card className="px-0">
                            <CardHeader>
                                <CardTitle>Diagnosis Results</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-6">
                                    <div>
                                        <h4 className="font-semibold mb-2">
                                            Primary Diagnosis:
                                        </h4>
                                        <div
                                            className={`text-2xl font-bold ${
                                                prediction.className ===
                                                "Healthy"
                                                    ? "text-green-600"
                                                    : "text-red-600"
                                            }`}
                                        >
                                            {prediction.className}
                                        </div>
                                        <div className="text-sm text-muted-foreground">
                                            Confidence:{" "}
                                            {(
                                                prediction.probability * 100
                                            ).toFixed(1)}
                                            %
                                        </div>
                                    </div>

                                    {prediction.heatmapUrl && (
                                        <div>
                                            <h4 className="font-semibold mb-2">
                                                Heatmap Visualization:
                                            </h4>
                                            <div className="relative aspect-square h-80 w-80">
                                                <Image
                                                    src={
                                                        prediction.heatmapUrl ||
                                                        "/placeholder.svg"
                                                    }
                                                    alt="Heatmap visualization"
                                                    fill
                                                    className="object-contain rounded-md h-80 w-80"
                                                />
                                            </div>
                                            <p className="text-sm text-muted-foreground mt-2">
                                                The heatmap shows areas of the
                                                image that influenced the
                                                classification decision.
                                            </p>
                                        </div>
                                    )}

                                    <div>
                                        <h4 className="font-semibold mb-2">
                                            Detailed Analysis:
                                        </h4>
                                        <div className="space-y-2">
                                            {prediction.probabilities.map(
                                                ({
                                                    className,
                                                    probability,
                                                }) => (
                                                    <div key={className}>
                                                        <div className="flex justify-between text-sm mb-1">
                                                            <span>
                                                                {className}
                                                            </span>
                                                            <span>
                                                                {(
                                                                    probability *
                                                                    100
                                                                ).toFixed(1)}
                                                                %
                                                            </span>
                                                        </div>
                                                        <Progress
                                                            value={
                                                                probability *
                                                                100
                                                            }
                                                            className="h-2"
                                                        />
                                                    </div>
                                                )
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </div>
            </CardContent>
        </Card>
    );
};

export default MangoClassifier;
