"use client";

import { deleteResult, getResult } from "@/store/store";
import { useEffect, useState, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import Image from "next/image";

interface Prediction {
    pred_id: string;
    image_data: string;
    status: number;
    predicted_at: Date;
}

interface DiseaseIdentified {
    diseaseIdentifiedid: string;
    pred_id: string;
    disease_name: string;
    likelihood_score: number;
}

export default function Result() {
    const [res, setRes] = useState<Array<
        Prediction & { diseases: DiseaseIdentified[] }
    > | null>(null);
    const [loading, setLoading] = useState(true);

    const fetchResults = useCallback(async () => {
        try {
            const results = await getResult();
            setRes(results);
        } catch (error) {
            console.error("Failed to fetch results:", error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchResults();
    }, [fetchResults]);

    const handleDelete = async (predId: string) => {
        setRes((prevRes) =>
            prevRes
                ? prevRes.filter((prediction) => prediction.pred_id !== predId)
                : null
        );
        await deleteResult(predId)
    };

    return (
        <div className="flex-1 flex flex-col p-6 space-y-6">
            <div className="space-y-2">
                <h2 className="text-3xl font-bold tracking-tight">Results</h2>
                <p className="text-muted-foreground">
                    View your prediction results below. Each row represents a
                    single prediction.
                </p>
            </div>

            {loading ? (
                <div className="space-y-4">
                    <Skeleton className="h-[100px] w-full" />
                    <Skeleton className="h-[100px] w-full" />
                </div>
            ) : res && res.length > 0 ? (
                <div className="space-y-4">
                    {res.map((pr) => (
                        <Card key={pr.pred_id} className="overflow-hidden">
                            <CardContent className="p-4">
                                <div className="flex items-center space-x-4">
                                    <div className="w-24 h-24 relative flex-shrink-0">
                                        <Image
                                            src={
                                                pr.image_data ||
                                                "/placeholder.svg"
                                            }
                                            alt={`Prediction ${pr.pred_id}`}
                                            className="object-cover rounded-md w-full h-full"
                                        />
                                    </div>
                                    <div className="flex-grow">
                                        <h3 className="font-semibold">
                                            Prediction {pr.pred_id}
                                        </h3>
                                        <p className="text-sm text-muted-foreground">
                                            Predicted at:{" "}
                                            {new Date(
                                                pr.predicted_at
                                            ).toLocaleString()}
                                        </p>
                                        <div className="mt-2">
                                            <h4 className="text-sm font-medium">
                                                Identified Diseases:
                                            </h4>
                                            <ul className="list-disc list-inside">
                                                {pr.diseases.map((disease) => (
                                                    <li
                                                        key={
                                                            disease.diseaseIdentifiedid
                                                        }
                                                        className="text-sm"
                                                    >
                                                        {disease.disease_name} -{" "}
                                                        {(
                                                            disease.likelihood_score *
                                                            100
                                                        ).toFixed(2)}
                                                        %
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    </div>
                                    <Button
                                        variant="destructive"
                                        size="icon"
                                        onClick={() => handleDelete(pr.pred_id)}
                                        className="flex-shrink-0"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                        <span className="sr-only">Delete</span>
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            ) : (
                <Card>
                    <CardContent className="flex items-center justify-center h-40">
                        <p className="text-muted-foreground">
                            No results found.
                        </p>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
