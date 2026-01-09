import * as tf from "@tensorflow/tfjs-core";
import "@tensorflow/tfjs-converter";
import "@tensorflow/tfjs-backend-webgl";
import "@tensorflow/tfjs-backend-cpu";

let initPromise: Promise<void> | null = null;

/**
 * Ensure TensorFlow.js is ready and a backend is selected.
 *
 * We prefer WebGL for performance; fallback to CPU if WebGL is unavailable.
 */
export async function ensureTfjsBackendReady(): Promise<void> {
  if (initPromise) return initPromise;

  initPromise = (async () => {
    await tf.ready();

    // Prefer WebGL; fall back to CPU if switching fails.
    try {
      if (tf.getBackend() !== "webgl") {
        await tf.setBackend("webgl");
        await tf.ready();
      }
    } catch {
      if (tf.getBackend() !== "cpu") {
        await tf.setBackend("cpu");
        await tf.ready();
      }
    }
  })();

  return initPromise;
}
