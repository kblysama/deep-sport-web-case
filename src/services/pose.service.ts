import * as pose from '@mediapipe/pose';

// MediaPipe Pose uses its own WASM backend, so TensorFlow.js backend is not needed

export interface PoseResult {
    keypoints: pose.NormalizedLandmark[];
    score: number;
}

export class PoseService {
    private pose: pose.Pose | null = null;
    private isLoaded: boolean = false;
    private isLoading: boolean = false;
    private loadPromise: Promise<void> | null = null;

    constructor() {
        // Initialize will be called explicitly or lazily
        // Don't await in constructor, let it load in background
        this.loadPromise = this.initialize().catch(error => {
            console.error('Pose service initialization error:', error);
            this.isLoading = false;
            return Promise.reject(error);
        });
    }

    private async initialize(): Promise<void> {
        if (this.isLoaded) {
            return;
        }

        if (this.isLoading) {
            // Wait for existing initialization
            return this.loadPromise || Promise.resolve();
        }

        this.isLoading = true;

        try {
            // MediaPipe Pose initializes its own backend, no TensorFlow.js needed
            this.pose = new pose.Pose({
                locateFile: (file) => {
                    return `/mediapipe/pose/${file}`;
                }
            });

            this.pose.setOptions({
                modelComplexity: 1,
                smoothLandmarks: true,
                enableSegmentation: false,
                smoothSegmentation: false,
                minDetectionConfidence: 0.5,
                minTrackingConfidence: 0.5,
                selfieMode: false
            });

            this.isLoaded = true;
            console.log('Pose model loaded successfully');
        } catch (error) {
            console.error('Error loading pose model:', error);
            this.isLoading = false;
            throw error;
        } finally {
            this.isLoading = false;
        }
    }

    /**
     * Ensures the pose model is loaded before proceeding.
     */
    async ensureLoaded(): Promise<void> {
        if (!this.isLoaded && !this.isLoading) {
            this.loadPromise = this.initialize();
        }
        await this.loadPromise;
    }

    /**
     * Detects pose in the given video element.
     * Note: MediaPipe's send() is async but void. We need to hook into onResults to get data.
     * For simplicity in this service, we'll set up a one-time listener or just expose the callback registration.
     */
    async detect(videoElement: HTMLVideoElement, onResult: (results: pose.Results) => void): Promise<void> {
        // Ensure model is loaded before detecting
        await this.ensureLoaded();

        if (!this.pose) {
            console.error('Pose model failed to load');
            return;
        }

        // Update the callback to the one provided by the caller
        this.pose.onResults(onResult);

        await this.pose.send({ image: videoElement });
    }

    close() {
        if (this.pose) {
            this.pose.close();
            this.pose = null;
        }
        this.isLoaded = false;
        this.isLoading = false;
        this.loadPromise = null;
    }
}

export const poseService = new PoseService();
