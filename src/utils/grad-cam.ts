"use client"
import * as tf from '@tensorflow/tfjs';

export async function gradClassActivationMap(
    model: tf.LayersModel,
    inputImage: tf.Tensor,
    classIndexes: number[],
): Promise<number[][][]> {
    return tf.tidy(() => {
        const gradientFunction = tf.grad((x: tf.Tensor) => {
            const predictions = model.predict(x) as tf.Tensor;
            const predShape = predictions.shape[1] as number
            const selectedClassLogits = tf.sum(
                tf.mul(predictions, tf.oneHot(classIndexes, predShape))
            );
            return selectedClassLogits;
        });

        const gradients = gradientFunction(inputImage);
        
        const absoluteGradients = tf.abs(gradients);
        const heatmap = tf.mean(absoluteGradients, -1);
        const maxValue = tf.max(heatmap).dataSync()[0];
        const normalizedHeatmap = tf.div(heatmap, maxValue);

        const heatmapArray = normalizedHeatmap.arraySync() as number[][][];

        return heatmapArray;
    });
}