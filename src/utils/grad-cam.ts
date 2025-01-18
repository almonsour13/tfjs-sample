import * as tf from '@tensorflow/tfjs';

export async function gradClassActivationMap(
    model: tf.LayersModel,
    inputImage: tf.Tensor,
    classIndexes: number[],
): Promise<number[][][]> {
    return tf.tidy(() => {
        // Get the gradients of the output with respect to the input
        const gradientFunction = tf.grad((x: tf.Tensor) => {
            const predictions = model.predict(x) as tf.Tensor;
            const predShape = predictions.shape[1] as number
            const selectedClassLogits = tf.sum(
                tf.mul(predictions, tf.oneHot(classIndexes, predShape))
            );
            return selectedClassLogits;
        });

        // Calculate gradients with respect to input
        const gradients = gradientFunction(inputImage);
        
        // Take the absolute value of gradients to show importance
        const absoluteGradients = tf.abs(gradients);

        // Calculate mean across channels if it's an RGB image
        const heatmap = tf.mean(absoluteGradients, -1);

        // Normalize the heatmap
        const maxValue = tf.max(heatmap).dataSync()[0];
        const normalizedHeatmap = tf.div(heatmap, maxValue);

        // Convert to array
        const heatmapArray = normalizedHeatmap.arraySync() as number[][][];

        return heatmapArray;
    });
}