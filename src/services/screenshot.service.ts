export class ScreenshotService {
    private canvas: HTMLCanvasElement;
    constructor() {
        this.canvas = document.createElement('canvas');
    }

    /**
     * Captures the current frame from the video or canvas element.
     * @param source The video or canvas element to capture from.
     * @returns The data URL of the captured image (image/png).
     */
    capture(source: HTMLVideoElement | HTMLCanvasElement): string {
        let width, height;

        if (source instanceof HTMLVideoElement) {
            width = source.videoWidth;
            height = source.videoHeight;
        } else {
            width = source.width;
            height = source.height;
        }

        this.canvas.width = width;
        this.canvas.height = height;

        const ctx = this.canvas.getContext('2d');
        if (!ctx) {
            throw new Error('Could not get canvas context');
        }

        // Draw the source frame
        ctx.drawImage(source, 0, 0, width, height);

        return this.canvas.toDataURL('image/png');
    }

    /**
     * Triggers a download of the image.
     * @param dataUrl The image data URL.
     * @param filename The filename to save as.
     */
    download(dataUrl: string, filename: string = 'screenshot.png') {
        const link = document.createElement('a');
        link.href = dataUrl;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    /**
     * Plays a shutter sound effect.
     */
    playShutterSound() {
        // beep logic using AudioContext to avoid external assets
        try {
            const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
            if (AudioContext) {
                const ctx = new AudioContext();
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();

                osc.connect(gain);
                gain.connect(ctx.destination);

                osc.type = 'sine';
                osc.frequency.setValueAtTime(800, ctx.currentTime);
                gain.gain.setValueAtTime(0.1, ctx.currentTime);

                osc.start();
                gain.gain.exponentialRampToValueAtTime(0.00001, ctx.currentTime + 0.1);
                osc.stop(ctx.currentTime + 0.1);
            }
        } catch (e) {
            console.error('Audio play failed', e);
        }
    }
}

export const screenshotService = new ScreenshotService();
