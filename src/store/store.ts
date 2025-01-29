import { supabase } from "@/supabase/supabase";
import { observable } from "@legendapp/state";
import { observablePersistIndexedDB } from "@legendapp/state/persist-plugins/indexeddb";
import { configureSynced } from "@legendapp/state/sync";
import { syncedCrud } from "@legendapp/state/sync-plugins/crud";
import { v4 as uuidv4 } from "uuid";

// Data Models
interface Prediction {
    pred_id: string;
    image_data: string;
    status: number;  // 1: active, 2: deleted
    predicted_at: Date;
    updated_at: Date | null;
}

interface DiseaseIdentified {
    diseaseIdentifiedid: string;
    pred_id: string;
    disease_name: string;
    likelihood_score: number;
}

// Configuration Constants
const DATABASE_NAME = "mango-classifier";
const DATABASE_VERSION = 1;
const TABLE_NAMES = ["prediction", "diseaseIdentified"];
const STATUS = {
    ACTIVE: 1,
    DELETED: 2
};

// Sync Plugin Configuration
const syncPlugin = configureSynced(syncedCrud, {
    persist: {
        plugin: observablePersistIndexedDB({
            databaseName: DATABASE_NAME,
            version: DATABASE_VERSION,
            tableNames: TABLE_NAMES,
        }),
    },
    onError: (error) => {
        console.error('Sync error:', error);
    },
    changesSince: "last-sync",
});

// Predictions Observable
export const prediction$ = observable(syncPlugin({
    list: async () => {
        try {
            const { data, error } = await supabase
                .from("prediction")
                .select("*")
                .eq("status", STATUS.ACTIVE);

            if (error) throw error;
            return data;
        } catch (error) {
            console.error(`Error fetching predictions:`, error);
            throw error;
        }
    },
    create: async (value: Prediction) => {
        try {
            if (!value.pred_id) {
                throw new Error('pred_id is required');
            }

            const { data, error } = await supabase
                .from("prediction")
                .insert([value])
                .select()
                .single();

            if (error) throw error;
            return data;
        } catch (error) {
            console.error(`Error creating prediction:`, error);
            throw error;
        }
    },
    update: async (value) => {
        try {
            if (!value.id) {
                throw new Error('pred_id is required for update');
            }

            const { data, error } = await supabase
                .from("prediction")
                .update({
                    status: value.status,
                    updated_at: new Date()
                })
                .eq('id', value.id)
                .select()
                .single();

            if (error) throw error;
            return data;
        } catch (error) {
            console.error(`Error updating prediction:`, error);
            throw error;
        }
    },
    persist: {
        name: "prediction",
        retrySync: true,
    },
    retry: {
        infinite: true,
    },
    updatePartial: true,
}));

// Disease Identified Observable
export const diseaseIdentified$ = observable(syncPlugin({
    list: async () => {
        try {
            const { data, error } = await supabase
                .from("diseaseIdentified")
                .select("*")
                .order('likelihood_score', { ascending: false });

            if (error) throw error;
            return data;
        } catch (error) {
            console.error(`Error fetching disease identifications:`, error);
            throw error;
        }
    },
    create: async (value: DiseaseIdentified) => {
        try {
            if (!value.diseaseIdentifiedid || !value.pred_id) {
                throw new Error('diseaseIdentifiedid and pred_id are required');
            }

            const { data, error } = await supabase
                .from("diseaseIdentified")
                .insert([value])
                .select()
                .single();

            if (error) throw error;
            return data;
        } catch (error) {
            console.error(`Error creating disease identification:`, error);
            throw error;
        }
    },
    update: async (value) => {
        try {
            if (!value.diseaseIdentifiedid) {
                throw new Error('diseaseIdentifiedid is required for update');
            }

            const { data, error } = await supabase
                .from("diseaseIdentified")
                .update(value)
                .eq('diseaseIdentifiedid', value.diseaseIdentifiedid)
                .select()
                .single();

            if (error) throw error;
            return data;
        } catch (error) {
            console.error(`Error updating disease identification:`, error);
            throw error;
        }
    },
    persist: {
        name: "diseaseIdentified",
        retrySync: true,
    },
    retry: {
        infinite: true,
        backoff: "constant",
    },
    updatePartial: true,
}));

// Utility Functions
export async function getResult() {
    try {
        const predictions = Object.values(prediction$.get() || {});
        const diseaseIdentifications = Object.values(diseaseIdentified$.get() || {});
        console.log(predictions)
        return predictions  
            .filter(pred => pred.status === STATUS.ACTIVE)
            .map(pred => ({
                ...pred,
                diseases: diseaseIdentifications
                    .filter(disease => disease.pred_id === pred.pred_id && disease.likelihood_score > 0.5)
                    .sort((a, b) => b.likelihood_score - a.likelihood_score)
            }))
            .sort((a, b) => new Date(b.predicted_at).getTime() - new Date(a.predicted_at).getTime());
    } catch (error) {
        console.error('Error getting results:', error);
        throw error;
    }
}

export async function deleteResult(pred_id: string) {
    try {
        if (!prediction$[pred_id]) {
            throw new Error(`Prediction with id ${pred_id} not found`);
        }
        prediction$[pred_id]
        .set({
            status: STATUS.DELETED,
            updated_at: new Date()
        });
    } catch (error) {
        console.error('Error deleting result:', error);
        throw error;
    }
}
export function save(val: {
    image_data: string;
    prob: { className: string; probability: number }[];
}) {
    try {
        const pred_id = uuidv4();
        
        // Save prediction
        prediction$[pred_id].set({
            pred_id,
            image_data: val.image_data,
            status: STATUS.ACTIVE,
            predicted_at: new Date(),
            updated_at: null
        });

        // Save disease identifications
        val.prob.forEach(prob => {
            const diseaseIdentifiedId = uuidv4();
            diseaseIdentified$[diseaseIdentifiedId].set({
                diseaseIdentifiedid: diseaseIdentifiedId,
                pred_id,
                disease_name: prob.className,
                likelihood_score: prob.probability
            });
        });

        return pred_id;
    } catch (error) {
        console.error('Error saving data:', error);
        throw error;
    }
}