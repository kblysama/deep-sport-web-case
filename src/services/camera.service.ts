export class CameraService {
    private stream: MediaStream | null = null;

    /**
     * Requests camera access and attaches the stream to the provided video element.
     * @param videoElement The HTMLVideoElement to attach the stream to.
     * @param deviceId Optional device ID to select a specific camera.
     */
    async start(videoElement: HTMLVideoElement, deviceId?: string): Promise<void> {
        if (this.stream) {
            this.stop();
        }

        const constraints: MediaStreamConstraints = {
            video: {
                deviceId: deviceId ? { exact: deviceId } : undefined,
                width: { ideal: 1280 },
                height: { ideal: 720 },
                facingMode: 'user'
            },
            audio: false
        };

        try {
            this.stream = await navigator.mediaDevices.getUserMedia(constraints);
            videoElement.srcObject = this.stream;

            // Wait for the video to be ready with timeout
            // Wait for the video to be ready with timeout
            return new Promise((resolve, reject) => {
                const cleanup = () => {
                    videoElement.onloadedmetadata = null;
                    videoElement.oncanplay = null;
                    clearTimeout(timeoutId);
                };

                const onReady = () => {
                    cleanup();
                    videoElement.play()
                        .then(() => {
                            console.log('Camera started playing successfully');
                            resolve();
                        })
                        .catch((e) => {
                            console.error('Error playing video:', e);
                            reject(e);
                        });
                };

                // If already ready, resolve immediately
                if (videoElement.readyState >= videoElement.HAVE_METADATA) {
                    console.log('Video element already has metadata, starting...');
                    return onReady();
                }

                videoElement.onloadedmetadata = () => {
                    console.log('Video metadata loaded');
                    onReady();
                };

                videoElement.oncanplay = () => {
                    console.log('Video can play');
                    onReady();
                };

                const timeoutId = setTimeout(() => {
                    cleanup();
                    console.error('Camera start timed out after 20s');
                    reject(new Error('Camera start timed out waiting for metadata'));
                }, 20000); // 20 seconds timeout
            });
        } catch (error) {
            console.error('Error accessing camera:', error);
            throw error;
        }
    }

    /**
     * Stops all tracks in the current stream.
     */
    stop(): void {
        if (this.stream) {
            this.stream.getTracks().forEach(track => track.stop());
            this.stream = null;
        }
    }

    /**
     * Returns the current MediaStream.
     */
    getStream(): MediaStream | null {
        return this.stream;
    }

    /**
     * Returns a list of available video input devices.
     */
    /**
     * Returns a list of available video input devices.
     */
    async getDevices(): Promise<MediaDeviceInfo[]> {
        const devices = await navigator.mediaDevices.enumerateDevices();
        return devices.filter(device => device.kind === 'videoinput');
    }
    /**
     * Requests camera permission without attaching to a video element.
     * Useful for the initial permission prompt.
     */
    async requestPermission(): Promise<void> {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
            // Stop immediately, we just wanted the permission
            stream.getTracks().forEach(track => track.stop());
        } catch (error) {
            console.error('Error requesting permission:', error);
            throw error;
        }
    }
}

export const cameraService = new CameraService();
