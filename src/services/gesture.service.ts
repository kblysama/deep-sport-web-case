import * as pose from '@mediapipe/pose';

export class GestureService {
    private lastTriggerTime: number = 0;
    private cooldownMs: number = 2000; // 2 seconds cooldown
    private threshold: number = 0.75; // Default threshold %75

    /**
     * Checks if the gesture is detected in the current landmarks.
     * Gesture: Wrist crossing the horizontal threshold (moving to the right).
     * @param landmarks Detected pose landmarks.
     * @returns True if gesture is detected and cooldown has passed.
     */
    detect(landmarks: pose.NormalizedLandmark[]): boolean {
        if (!landmarks) return false;

        const leftWrist = landmarks[15];
        const rightWrist = landmarks[16];

        let triggered = false;

        // For mirrored video (selfieMode: true): Visual Right = Raw Right
        // We check if x is GREATER than threshold.
        const targetX = this.threshold;

        if ((leftWrist && leftWrist.visibility && leftWrist.visibility > 0.5 && leftWrist.x > targetX) ||
            (rightWrist && rightWrist.visibility && rightWrist.visibility > 0.5 && rightWrist.x > targetX)) {
            triggered = true;
        }

        if (triggered) {
            const now = Date.now();
            if (now - this.lastTriggerTime > this.cooldownMs) {
                this.lastTriggerTime = now;
                return true;
            }
        }

        return false;
    }

    /**
     * Gets the current progress percentage (0-100) based on wrist position.
     * Uses the wrist that is more advanced (higher x value).
     * @param landmarks Detected pose landmarks.
     * @returns Progress percentage (0-100), or 0 if no wrist detected.
     */
    getProgress(landmarks: pose.NormalizedLandmark[]): number {
        if (!landmarks) return 0;

        const leftWrist = landmarks[15];
        const rightWrist = landmarks[16];

        let maxX = 0;
        let hasVisibleWrist = false;

        if (leftWrist && leftWrist.visibility && leftWrist.visibility > 0.5) {
            maxX = Math.max(maxX, leftWrist.x);
            hasVisibleWrist = true;
        }

        if (rightWrist && rightWrist.visibility && rightWrist.visibility > 0.5) {
            maxX = Math.max(maxX, rightWrist.x);
            hasVisibleWrist = true;
        }

        if (!hasVisibleWrist) return 0;

        // Convert normalized x position (0-1) to percentage (0-100)
        // Clamp between 0 and 100
        return Math.min(100, Math.max(0, maxX * 100));
    }

    /**
     * Sets the threshold value (0-1 normalized, e.g., 0.75 = 75%).
     * @param value Threshold value between 0.5 and 0.95 (50% to 95%).
     */
    setThreshold(value: number): void {
        // Clamp between 0.5 and 0.95 as per documentation
        this.threshold = Math.max(0.5, Math.min(0.95, value));
    }

    /**
     * Gets the current threshold value.
     * @returns Threshold value (0-1 normalized).
     */
    getThreshold(): number {
        return this.threshold;
    }

    /**
     * Sets the cooldown duration in milliseconds.
     */
    setCooldown(ms: number) {
        this.cooldownMs = ms;
    }
}

export const gestureService = new GestureService();
