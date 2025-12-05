import React, { useEffect, useRef, useState } from 'react';
import { Camera } from 'lucide-react';
import logo from '../assets/logo.png';
import calibrationGuide from '../assets/calibration-guide.png';
import { useLanguage } from '../contexts/LanguageContext';
import { cameraService } from '../services/camera.service';
import { poseService } from '../services/pose.service';
import { gestureService } from '../services/gesture.service';
import * as pose from '@mediapipe/pose';

interface IntroCalibrationScreenProps {
    onComplete: () => void;
}

const translations = {
    tr: {
        title: 'Ekran Görüntüsü Almak için El Hareketi',
        subtitle: "Ekran görüntüsü almak için elinizi ekranın %75'i boyunca nasıl hareket ettireceğinizi öğrenin.",
        howItWorks: 'Nasıl Çalışır?',
        step1: 'Kalibrasyonu başlatmak için kameranıza izin verin.',
        step2: 'Elinizi kameranın görebileceği bir alanda konumlandırın.',
        step3: 'Elinizi ekranın bir ucundan diğerine doğru kaydırın.',
        calibration: 'Kalibrasyon',
        cameraStarting: 'Kamera Başlatılıyor...',
        cameraError: 'Kamera Hatası',
        retry: 'Tekrar Dene',
        handPosition: 'El Pozisyonu',
        thresholdExceeded: '✅ Eşik aşıldı! Ekran görüntüsü alınabilir.',
        thresholdNeeded: (val: number) => `Eşiğe ulaşmak için %${val} gerekiyor`,
        showHand: 'Elinizi kameraya gösterin',
        thresholdValue: (val: number) => `Eşik Değeri: %${val}`,
        thresholdDesc: (val: number) => `Eliniz ekranın %${val}'ini geçtiğinde ekran görüntüsü alınır`,
        continue: 'Devam Et',
        errors: {
            accessDenied: "Kameraya erişilemedi. Lütfen izinleri kontrol edin."
        }
    },
    en: {
        title: 'Hand Gesture for Screenshot',
        howItWorks: 'How It Works?',
        step1: 'Allow camera access to start calibration.',
        step2: 'Position your hand within the camera view.',
        step3: 'Swipe your hand from one side of the screen to the other.',
        calibration: 'Calibration',
        cameraStarting: 'Starting Camera...',
        cameraError: 'Camera Error',
        retry: 'Try Again',
        handPosition: 'Hand Position',
        thresholdExceeded: '✅ Threshold exceeded! Screenshot can be taken.',
        thresholdNeeded: (val: number) => `Need %${val} to reach threshold`,
        showHand: 'Show your hand to the camera',
        thresholdValue: (val: number) => `Threshold Value: %${val}`,
        thresholdDesc: (val: number) => `Screenshot is taken when your hand crosses %${val} of the screen`,
        continue: 'Continue',
        errors: {
            accessDenied: "Camera access failed. Please check permissions."
        }
    }
};

const IntroCalibrationScreen: React.FC<IntroCalibrationScreenProps> = ({ onComplete }) => {
    const { language } = useLanguage();
    const t = translations[language];
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const requestRef = useRef<number | null>(null);
    const [cameraActive, setCameraActive] = useState(false);
    const [cameraError, setCameraError] = useState<string | null>(null);
    const [threshold, setThreshold] = useState(75); // Percentage (50-95)
    const [progress, setProgress] = useState(0); // Percentage (0-100)

    useEffect(() => {
        let isMounted = true;

        const initCamera = async () => {
            if (videoRef.current) {
                try {
                    await cameraService.start(videoRef.current);
                    if (isMounted) {
                        setCameraActive(true);
                        setCameraError(null);
                        startDetection();
                    }
                } catch (error) {
                    if (isMounted) {
                        console.error("Failed to start camera in Intro", error);
                        setCameraError(t.errors.accessDenied);
                    }
                }
            }
        };

        initCamera();

        return () => {
            isMounted = false;
            cameraService.stop();
            if (requestRef.current) {
                cancelAnimationFrame(requestRef.current);
                requestRef.current = null;
            }
        };
    }, []);

    // Update gesture service threshold when threshold changes
    useEffect(() => {
        gestureService.setThreshold(threshold / 100); // Convert percentage to 0-1 range
    }, [threshold]);

    const startDetection = () => {
        const detectLoop = async () => {
            if (!videoRef.current || !canvasRef.current) return;

            if (videoRef.current && canvasRef.current) {
                const ctx = canvasRef.current.getContext('2d');
                if (ctx) {
                    // Draw mirrored video for initial frame
                    ctx.save();
                    ctx.scale(-1, 1);
                    ctx.drawImage(videoRef.current, -canvasRef.current.width, 0, canvasRef.current.width, canvasRef.current.height);
                    ctx.restore();
                }

                await poseService.detect(videoRef.current, (results) => {
                    // Mirror landmarks for drawing and logic to match mirrored video
                    let mirroredLandmarks: pose.NormalizedLandmark[] | undefined;

                    if (results.poseLandmarks) {
                        mirroredLandmarks = results.poseLandmarks.map(lm => ({
                            ...lm,
                            x: 1 - lm.x
                        }));
                    }

                    // Draw using mirrored landmarks
                    drawResults(results, mirroredLandmarks);

                    // Calculate and update progress using mirrored landmarks
                    if (mirroredLandmarks) {
                        const currentProgress = gestureService.getProgress(mirroredLandmarks);
                        setProgress(currentProgress);
                    } else {
                        setProgress(0);
                    }
                });

                requestRef.current = requestAnimationFrame(detectLoop);
            }
        };
        if (requestRef.current) cancelAnimationFrame(requestRef.current);
        requestRef.current = requestAnimationFrame(detectLoop);
    };

    const drawResults = (results: pose.Results, landmarks?: pose.NormalizedLandmark[]) => {
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');
        if (!canvas || !ctx) return;

        ctx.save();
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Draw mirrored video
        ctx.save();
        ctx.scale(-1, 1);
        ctx.drawImage(results.image, -canvas.width, 0, canvas.width, canvas.height);
        ctx.restore();

        // Draw Skeleton (Yellow) using mirrored landmarks
        if (landmarks) {
            const connect = (a: number, b: number) => {
                const p1 = landmarks[a];
                const p2 = landmarks[b];
                if (p1 && p2 && p1.visibility && p1.visibility > 0.5 && p2.visibility && p2.visibility > 0.5) {
                    ctx.beginPath();
                    ctx.moveTo(p1.x * canvas.width, p1.y * canvas.height);
                    ctx.lineTo(p2.x * canvas.width, p2.y * canvas.height);
                    ctx.strokeStyle = '#FFFF00'; // Yellow
                    ctx.lineWidth = 3;
                    ctx.stroke();
                }
            };

            // Torso
            connect(11, 12); connect(11, 23); connect(12, 24); connect(23, 24);
            // Arms
            connect(11, 13); connect(13, 15); connect(12, 14); connect(14, 16);
            // Legs
            connect(23, 25); connect(25, 27); connect(24, 26); connect(26, 28);
            // Feet
            connect(27, 29); connect(29, 31); connect(31, 27);
            connect(28, 30); connect(30, 32); connect(32, 28);

            // Draw points
            landmarks.forEach((landmark, index) => {
                if (index > 32) return;
                if (landmark.visibility && landmark.visibility > 0.5) {
                    ctx.beginPath();
                    ctx.arc(landmark.x * canvas.width, landmark.y * canvas.height, 6, 0, 2 * Math.PI);
                    ctx.fillStyle = '#FFFF00';
                    ctx.fill();
                    ctx.strokeStyle = '#000000';
                    ctx.lineWidth = 1;
                    ctx.stroke();
                }
            });
        }
        ctx.restore();
    };

    return (
        <div className="min-h-screen bg-[#0f172a] text-white font-sans flex flex-col">
            {/* Header */}
            <header className="w-full px-6 py-3 border-b border-gray-800">
                <div className="flex items-center space-x-3">
                    <img src={logo} alt="DeepSport Logo" className="h-14 w-auto rounded-lg" />
                    <div className="text-xl font-bold tracking-wide">DeepSport Case</div>
                </div>
            </header>

            {/* Main Content */}
            <main className="flex-grow flex flex-col items-center justify-center p-8">

                {/* Title Section */}
                <div className="text-center mb-12">
                    <h1 className="text-3xl md:text-4xl font-bold mb-3">
                        {t.title}
                    </h1>
                </div>

                {/* Content Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-6xl w-full">

                    {/* Left Column: How it works */}
                    <div className="bg-[#111827] border border-gray-800 rounded-3xl p-8">
                        <h2 className="text-xl font-bold mb-6">{t.howItWorks}</h2>

                        {/* Video/Image Placeholder */}
                        <div className="aspect-video bg-[#d19a78] rounded-xl mb-8 flex items-center justify-center relative overflow-hidden group">
                            <img
                                src={calibrationGuide}
                                alt="Calibration Guide"
                                className="w-full h-full object-cover"
                            />
                        </div>

                        {/* Steps */}
                        <div className="space-y-6">
                            <div className="flex items-start space-x-4">
                                <div className="bg-[#1e293b] text-blue-500 font-bold w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0">1</div>
                                <p className="text-gray-400 text-sm pt-1">{t.step1}</p>
                            </div>
                            <div className="flex items-start space-x-4">
                                <div className="bg-[#1e293b] text-blue-500 font-bold w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0">2</div>
                                <p className="text-gray-400 text-sm pt-1">{t.step2}</p>
                            </div>
                            <div className="flex items-start space-x-4">
                                <div className="bg-[#1e293b] text-blue-500 font-bold w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0">3</div>
                                <p className="text-gray-400 text-sm pt-1">{t.step3}</p>
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Calibration */}
                    <div className="bg-[#111827] border border-gray-800 rounded-3xl p-8 flex flex-col">
                        <h2 className="text-xl font-bold mb-6">{t.calibration}</h2>

                        {/* Camera Area */}
                        <div className="aspect-video bg-black rounded-xl mb-6 relative overflow-hidden border border-gray-800 flex flex-col items-center justify-center">
                            {/* Hidden Video */}
                            <video
                                ref={videoRef}
                                className="absolute opacity-0 pointer-events-none"
                                autoPlay
                                muted
                                playsInline
                            ></video>

                            {/* Canvas */}
                            <canvas
                                ref={canvasRef}
                                width={640}
                                height={360}
                                className="w-full h-full object-cover"
                            ></canvas>

                            {/* Overlays */}
                            {/* Dynamic Threshold Line */}
                            <div
                                className="absolute top-0 bottom-0 w-0.5 border-l-2 border-dashed border-blue-500/50 z-10 pointer-events-none"
                                style={{ right: `${100 - threshold}%` }}
                            ></div>
                            <div
                                className="absolute top-0 bottom-0 bg-blue-900/20 z-0 pointer-events-none"
                                style={{ right: 0, width: `${threshold}%` }}
                            ></div>

                            {!cameraActive && !cameraError && (
                                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 z-20">
                                    <Camera size={48} className="text-white mb-4" />
                                    <p className="text-white font-medium mb-1">{t.cameraStarting}</p>
                                </div>
                            )}

                            {cameraError && (
                                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/90 z-20 p-4 text-center">
                                    <Camera size={48} className="text-red-500 mb-4" />
                                    <p className="text-white font-medium mb-1">{t.cameraError}</p>
                                    <p className="text-gray-400 text-sm mb-4">{cameraError}</p>
                                    <button
                                        onClick={() => {
                                            setCameraError(null);
                                            // Re-trigger effect or call initCamera directly if extracted
                                            window.location.reload(); // Simple retry for now, or extract initCamera
                                        }}
                                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm transition-colors"
                                    >
                                        {t.retry}
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Progress Section */}
                        <div className="mb-6">
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-sm font-medium text-white">{t.handPosition}</span>
                                <span className="text-sm font-medium text-white">{Math.round(progress)}%</span>
                            </div>
                            <div className="w-full bg-gray-700 rounded-full h-2.5 relative mb-2">
                                <div
                                    className="bg-blue-600 h-2.5 rounded-full transition-all duration-300 ease-out"
                                    style={{ width: `${progress}%` }}
                                ></div>
                                {/* Threshold indicator */}
                                <div
                                    className="absolute top-0 bottom-0 w-0.5 bg-yellow-500 opacity-60 pointer-events-none"
                                    style={{ left: `${threshold}%` }}
                                ></div>
                            </div>
                            <p className="text-gray-500 text-xs">
                                {progress >= threshold
                                    ? t.thresholdExceeded
                                    : progress > 0
                                        ? t.thresholdNeeded(threshold)
                                        : t.showHand}
                            </p>
                        </div>

                        {/* Threshold Slider */}
                        <div className="mb-8">
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-sm font-medium text-white">{t.thresholdValue(threshold)}</span>
                            </div>
                            <input
                                type="range"
                                min="50"
                                max="95"
                                value={threshold}
                                onChange={(e) => setThreshold(parseInt(e.target.value))}
                                className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
                            />
                            <p className="text-gray-500 text-xs mt-1">{t.thresholdDesc(threshold)}</p>
                        </div>

                        {/* Actions */}
                        <div className="mt-auto flex items-center space-x-4">
                            <button
                                onClick={onComplete}
                                className="flex-grow bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-xl transition-colors"
                            >
                                {t.continue}
                            </button>

                        </div>
                    </div>

                </div>
            </main>
        </div>
    );
};

export default IntroCalibrationScreen;
