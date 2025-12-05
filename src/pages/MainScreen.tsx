import React, { useState, useEffect, useRef } from 'react';
import { Settings, HelpCircle, Camera, Video, Activity, CheckCircle, Trash2, Download, Trash } from 'lucide-react';
import logo from '../assets/logo.png';
import { cameraService } from '../services/camera.service';
import { poseService } from '../services/pose.service';
import { gestureService } from '../services/gesture.service';
import { screenshotService } from '../services/screenshot.service';
import * as pose from '@mediapipe/pose';
import { useLanguage } from '../contexts/LanguageContext';

interface ScreenshotData {
    id: string;
    dataUrl: string;
    timestamp: number;
    filename: string;
}



const translations = {
    tr: {
        loading: 'Yükleniyor...',
        poseModelLoading: 'Pose Modeli Yükleniyor...',
        poseModelLoadingDesc: 'İlk yükleme biraz zaman alabilir',
        refreshPage: 'Sayfayı Yenile',
        cameraStarting: 'Kamera Başlatılıyor...',
        cameraError: 'Kamera Hatası',
        statusTitle: 'Durum',
        cameraStatus: 'Kamera Durumu',
        active: 'Aktif',
        passive: 'Pasif',
        motionDetection: 'Hareket Algılama',
        running: 'Çalışıyor',
        waiting: 'Bekleniyor',
        handPosition: 'El Pozisyonu',
        thresholdExceeded: '✅ Eşik aşıldı! Ekran görüntüsü alınabilir.',
        thresholdNeeded: (val: number) => `Eşiğe ulaşmak için %${val} gerekiyor`,
        showHand: 'Elinizi kameraya gösterin',
        settingsTitle: 'Ayarlar',
        cameraSelection: 'Kamera Seçimi',
        cameraNotFound: 'Kamera bulunamadı',
        thresholdValue: (val: number) => `Eşik Değeri: %${val}`,
        thresholdDesc: (val: number) => `Eliniz ekranın %${val}'ini geçtiğinde ekran görüntüsü alınır`,
        delayLabel: (val: number) => `Yakalama Gecikmesi: ${val}sn`,
        autoScreenshot: 'Otomatik Ekran Görüntüsü',
        manualScreenshot: 'Manuel Ekran Görüntüsü Al',
        skeletonView: 'İskelet Görünümü',
        galleryTitle: (count: number) => `Ekran Görüntüleri (${count})`,
        downloadAll: 'Tümünü İndir',
        deleteAll: 'Tümünü Sil',
        noScreenshots: 'Henüz ekran görüntüsü yok.',
        download: 'İndir',
        delete: 'Sil',
        screenshotTaken: 'Ekran görüntüsü alındı!',
        confirmDeleteAll: 'Tüm ekran görüntülerini silmek istediğinize emin misiniz?',
        errors: {
            poseModelFailed: (msg: string) => `Pose modeli yüklenemedi: ${msg}. Sayfayı yenileyin.`,
            cameraFailed: "Kamera başlatılamadı.",
            permissionDenied: "Kamera izni reddedildi. Lütfen tarayıcı ayarlarından izin verin.",
            notFound: "Kamera bulunamadı. Lütfen cihazınızı kontrol edin.",
            inUse: "Kamera başka bir uygulama tarafından kullanılıyor olabilir.",
            generic: (msg: string) => `Kamera hatası: ${msg}`
        }
    },
    en: {
        loading: 'Loading...',
        poseModelLoading: 'Loading Pose Model...',
        poseModelLoadingDesc: 'Initial loading may take some time',
        refreshPage: 'Refresh Page',
        cameraStarting: 'Starting Camera...',
        cameraError: 'Camera Error',
        statusTitle: 'Status',
        cameraStatus: 'Camera Status',
        active: 'Active',
        passive: 'Inactive',
        motionDetection: 'Motion Detection',
        running: 'Running',
        waiting: 'Waiting',
        handPosition: 'Hand Position',
        thresholdExceeded: '✅ Threshold exceeded! Screenshot can be taken.',
        thresholdNeeded: (val: number) => `Need %${val} to reach threshold`,
        showHand: 'Show your hand to the camera',
        settingsTitle: 'Settings',
        cameraSelection: 'Camera Selection',
        cameraNotFound: 'Camera not found',
        thresholdValue: (val: number) => `Threshold Value: %${val}`,
        thresholdDesc: (val: number) => `Screenshot is taken when your hand crosses %${val} of the screen`,
        delayLabel: (val: number) => `Capture Delay: ${val}s`,
        autoScreenshot: 'Auto Screenshot',
        manualScreenshot: 'Take Manual Screenshot',
        skeletonView: 'Skeleton View',
        galleryTitle: (count: number) => `Screenshots (${count})`,
        downloadAll: 'Download All',
        deleteAll: 'Delete All',
        noScreenshots: 'No screenshots yet.',
        download: 'Download',
        delete: 'Delete',
        screenshotTaken: 'Screenshot taken!',
        confirmDeleteAll: 'Are you sure you want to delete all screenshots?',
        errors: {
            poseModelFailed: (msg: string) => `Pose model failed to load: ${msg}. Refresh the page.`,
            cameraFailed: "Failed to start camera.",
            permissionDenied: "Camera permission denied. Please allow access in browser settings.",
            notFound: "Camera not found. Please check your device.",
            inUse: "Camera might be in use by another application.",
            generic: (msg: string) => `Camera error: ${msg}`
        }
    }
};

const MainScreen: React.FC = () => {
    const { language } = useLanguage();
    const t = translations[language];
    const [delay, setDelay] = useState(2);
    const [showSkeleton] = useState(true);
    const [cameraActive, setCameraActive] = useState(false);
    const [isDetecting, setIsDetecting] = useState(false);
    const [screenshots, setScreenshots] = useState<ScreenshotData[]>([]);
    const [lastScreenshotTime, setLastScreenshotTime] = useState<number | null>(null);
    const [cameraError, setCameraError] = useState<string | null>(null);
    const [threshold, setThreshold] = useState(75); // Percentage (50-95)
    const [progress, setProgress] = useState(0); // Percentage (0-100)
    const [autoScreenshot] = useState(true); // Otomatik screenshot aktif/pasif
    const [poseModelLoaded, setPoseModelLoaded] = useState(false);
    const [isInitialized, setIsInitialized] = useState(false);

    const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
    const [selectedDeviceId, setSelectedDeviceId] = useState<string>('');

    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const requestRef = useRef<number | null>(null);

    // Ensure pose model is loaded on mount
    useEffect(() => {
        let isMounted = true;

        const loadPoseModel = async () => {
            try {
                console.log('Starting to load pose model...');
                await poseService.ensureLoaded();
                if (isMounted) {
                    setPoseModelLoaded(true);
                    setIsInitialized(true);
                    console.log('Pose model ready for detection');
                }
            } catch (error: any) {
                console.error('Failed to load pose model:', error);
                if (isMounted) {
                    setCameraError(t.errors.poseModelFailed(error?.message || 'Unknown error'));
                    setPoseModelLoaded(false);
                    setIsInitialized(true); // Still show UI even if model failed
                }
            }
        };

        // Delay loading slightly to ensure DOM is ready
        const timer = setTimeout(() => {
            loadPoseModel();
        }, 100);

        return () => {
            isMounted = false;
            clearTimeout(timer);
        };
    }, []);

    // Fetch devices on mount and auto-start camera
    useEffect(() => {
        let isMounted = true;

        const getDevices = async () => {
            try {
                console.log('Fetching camera devices...');

                // Create a timeout promise
                const timeoutPromise = new Promise<MediaDeviceInfo[]>((_, reject) =>
                    setTimeout(() => reject(new Error('Device fetching timed out')), 3000)
                );

                // Race between getDevices and timeout
                const videoDevices = await Promise.race([
                    cameraService.getDevices(),
                    timeoutPromise
                ]);

                if (!isMounted) return;

                console.log('Devices fetched:', videoDevices);
                setDevices(videoDevices);

                // Auto-start camera logic
                if (videoRef.current) {
                    if (videoDevices.length > 0) {
                        const firstDeviceId = videoDevices[0].deviceId;
                        setSelectedDeviceId(firstDeviceId);
                        await cameraService.start(videoRef.current, firstDeviceId);
                    } else {
                        console.warn('No video devices found. Attempting to start default camera...');
                        await cameraService.start(videoRef.current);
                    }
                } else {
                    console.warn('Video ref is null, cannot start camera');
                }

                // Mark camera as active and start detection
                if (isMounted) {
                    console.log('Camera started successfully (auto-start)');
                    setCameraActive(true);
                    setCameraError(null);
                    startDetection();
                }

            } catch (error: any) {
                console.warn("Error or timeout fetching devices, falling back to default camera:", error);
                // Fallback to default camera on error or timeout
                if (videoRef.current) {
                    try {
                        await cameraService.start(videoRef.current);
                        if (isMounted) {
                            setCameraActive(true);
                            setCameraError(null);
                            startDetection();
                        }
                    } catch (fallbackError: any) {
                        console.error("Failed to start default camera as fallback", fallbackError);
                        let errorMessage = t.errors.cameraFailed;
                        if (fallbackError.name === 'NotAllowedError' || fallbackError.name === 'PermissionDeniedError') {
                            errorMessage = t.errors.permissionDenied;
                        } else if (fallbackError.name === 'NotFoundError' || fallbackError.name === 'DevicesNotFoundError') {
                            errorMessage = t.errors.notFound;
                        } else if (fallbackError.name === 'NotReadableError' || fallbackError.name === 'TrackStartError') {
                            errorMessage = t.errors.inUse;
                        }
                        if (isMounted) setCameraError(errorMessage);
                    }
                }
            }
        };
        getDevices();
    }, []);

    const initCamera = async (deviceId?: string) => {
        if (!videoRef.current) {
            console.warn('initCamera called but videoRef is null');
            return;
        }

        try {
            // Stop existing detection loop before restarting camera
            if (requestRef.current) {
                cancelAnimationFrame(requestRef.current);
                requestRef.current = null;
            }
            setIsDetecting(false);

            console.log(`Initializing camera with deviceId: ${deviceId || 'default'}`);
            await cameraService.start(videoRef.current, deviceId);

            console.log('Camera started successfully');
            setCameraActive(true);
            setCameraError(null);
            startDetection();
        } catch (error: any) {
            console.error("Failed to start camera", error);
            let errorMessage = t.errors.cameraFailed;
            if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
                errorMessage = t.errors.permissionDenied;
            } else if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
                errorMessage = t.errors.notFound;
            } else if (error.name === 'NotReadableError' || error.name === 'TrackStartError') {
                errorMessage = t.errors.inUse;
            } else if (error.message) {
                errorMessage = t.errors.generic(error.message);
            }
            setCameraError(errorMessage);
        }
    };

    // Initialize camera when selectedDeviceId changes (user selection)
    // We use a ref to track if this is the initial mount to avoid double initialization
    const isFirstRun = useRef(true);

    useEffect(() => {
        // Skip the first run as the initial useEffect handles the auto-start
        if (isFirstRun.current) {
            isFirstRun.current = false;
            return;
        }

        if (selectedDeviceId) {
            // Stop previous camera/loop before starting new one
            cameraService.stop();
            if (requestRef.current) {
                cancelAnimationFrame(requestRef.current);
                requestRef.current = null;
            }

            initCamera(selectedDeviceId);
        }

        return () => {
            // Cleanup when unmounting or changing device
            cameraService.stop();
            if (requestRef.current) {
                cancelAnimationFrame(requestRef.current);
                requestRef.current = null;
            }
        };
    }, [selectedDeviceId]);

    // Update gesture service cooldown when delay changes
    useEffect(() => {
        gestureService.setCooldown(delay * 1000);
    }, [delay]);

    // Update gesture service threshold when threshold changes
    useEffect(() => {
        gestureService.setThreshold(threshold / 100); // Convert percentage to 0-1 range
    }, [threshold]);

    const startDetection = () => {
        if (!poseModelLoaded) {
            console.warn('Cannot start detection: pose model not loaded yet');
            return;
        }

        const detectLoop = async () => {
            // Check if component is still mounted and refs are valid
            if (!videoRef.current || !canvasRef.current) {
                // Stop loop if refs are gone (unmounted)
                return;
            }

            if (videoRef.current.readyState === videoRef.current.HAVE_ENOUGH_DATA && poseModelLoaded) {
                try {
                    await poseService.detect(videoRef.current, (results) => {
                        // Double check refs inside callback (async)
                        const canvas = canvasRef.current;
                        const ctx = canvas?.getContext('2d');

                        if (!canvas || !ctx || !videoRef.current) return;

                        // Clear canvas first
                        ctx.clearRect(0, 0, canvas.width, canvas.height);

                        // Draw video frame (mirrored for selfie view)
                        ctx.save();
                        ctx.scale(-1, 1);
                        ctx.drawImage(videoRef.current, -canvas.width, 0, canvas.width, canvas.height);
                        ctx.restore();

                        // Draw skeleton and landmarks on top of video
                        if (results.poseLandmarks && results.poseLandmarks.length > 0) {
                            // Mirror landmarks manually since selfieMode is false
                            const mirroredLandmarks = results.poseLandmarks.map(lm => ({
                                ...lm,
                                x: 1 - lm.x
                            }));

                            drawSkeleton(ctx, canvas, mirroredLandmarks);

                            // Calculate and update progress (use mirrored landmarks for detection logic)
                            const currentProgress = gestureService.getProgress(mirroredLandmarks);
                            setProgress(currentProgress);

                            // Check for gesture trigger (use mirrored landmarks)
                            if (autoScreenshot) {
                                const triggered = gestureService.detect(mirroredLandmarks);
                                if (triggered) {
                                    handleScreenshot();
                                }
                            }
                        } else {
                            // No landmarks detected, reset progress
                            setProgress(0);
                        }

                        // Draw Threshold Line on top (dynamic based on threshold state)
                        const thresholdX = threshold / 100; // Convert percentage to 0-1
                        ctx.beginPath();
                        ctx.moveTo(canvas.width * thresholdX, 0);
                        ctx.lineTo(canvas.width * thresholdX, canvas.height);
                        ctx.strokeStyle = 'rgba(59, 130, 246, 0.8)';
                        ctx.setLineDash([15, 15]);
                        ctx.lineWidth = 4;
                        ctx.stroke();
                        ctx.setLineDash([]);
                    });
                } catch (error) {
                    console.error('Error in detection loop:', error);
                    // If error is due to context loss or closed service, we might want to stop or retry carefully
                }
            }

            // Continue loop only if still mounted
            if (videoRef.current && canvasRef.current) {
                requestRef.current = requestAnimationFrame(detectLoop);
            }
        };

        // Cancel any existing loop
        if (requestRef.current) cancelAnimationFrame(requestRef.current);
        requestRef.current = requestAnimationFrame(detectLoop);
        setIsDetecting(true);
    };

    const handleScreenshot = () => {
        if (canvasRef.current) {
            screenshotService.playShutterSound();
            // Capture canvas (which has video + skeleton + overlay)
            const dataUrl = screenshotService.capture(canvasRef.current);
            const timestamp = Date.now();
            const newScreenshot: ScreenshotData = {
                id: `screenshot-${timestamp}`,
                dataUrl,
                timestamp,
                filename: `screenshot-${new Date(timestamp).toISOString().replace(/[:.]/g, '-')}.png`
            };
            setScreenshots(prev => [newScreenshot, ...prev]);
            setLastScreenshotTime(timestamp);

            setTimeout(() => {
                setLastScreenshotTime(null);
            }, 3000);
        }
    };

    const handleDeleteScreenshot = (id: string) => {
        setScreenshots(prev => prev.filter(s => s.id !== id));
    };

    const handleDeleteAll = () => {
        if (window.confirm('Tüm ekran görüntülerini silmek istediğinize emin misiniz?')) {
            setScreenshots([]);
        }
    };

    const handleDownloadAll = () => {
        screenshots.forEach((screenshot, index) => {
            setTimeout(() => {
                screenshotService.download(screenshot.dataUrl, screenshot.filename);
            }, index * 200); // Her indirme arasında 200ms bekle
        });
    };

    const formatTimestamp = (timestamp: number): string => {
        const date = new Date(timestamp);
        return date.toLocaleString(language === 'tr' ? 'tr-TR' : 'en-US', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
    };

    const drawSkeleton = (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, landmarks: pose.NormalizedLandmark[]) => {
        if (!showSkeleton || !landmarks || landmarks.length === 0) return;

        ctx.save();

        const connect = (a: number, b: number, color: string = '#FFFF00') => {
            const p1 = landmarks[a];
            const p2 = landmarks[b];
            if (p1 && p2 && p1.visibility && p1.visibility > 0.5 && p2.visibility && p2.visibility > 0.5) {
                ctx.beginPath();
                ctx.moveTo(p1.x * canvas.width, p1.y * canvas.height);
                ctx.lineTo(p2.x * canvas.width, p2.y * canvas.height);
                ctx.strokeStyle = color;
                ctx.lineWidth = 3;
                ctx.stroke();
            }
        };

        // MediaPipe Pose Full Skeleton Connections (33 landmarks)
        // Torso - Üst vücut (ana iskelet)
        connect(11, 12, '#FFFF00'); // Omuzlar arası
        connect(11, 23, '#FFFF00'); // Sol omuz - sol kalça
        connect(12, 24, '#FFFF00'); // Sağ omuz - sağ kalça
        connect(23, 24, '#FFFF00'); // Kalça arası

        // Arms - Kollar (tam iskelet)
        // Sol kol (11 -> 13 -> 15)
        connect(11, 13, '#FF9900'); // Sol omuz - sol dirsek
        connect(13, 15, '#FF9900'); // Sol dirsek - sol bilek

        // Sağ kol (12 -> 14 -> 16)
        connect(12, 14, '#FF9900'); // Sağ omuz - sağ dirsek
        connect(14, 16, '#FF9900'); // Sağ dirsek - sağ bilek

        // Legs - Bacaklar (tam iskelet)
        // Sol bacak (23 -> 25 -> 27)
        connect(23, 25, '#00FF00'); // Sol kalça - sol diz
        connect(25, 27, '#00FF00'); // Sol diz - sol ayak bileği

        // Sağ bacak (24 -> 26 -> 28)
        connect(24, 26, '#00FF00'); // Sağ kalça - sağ diz
        connect(26, 28, '#00FF00'); // Sağ diz - sağ ayak bileği

        // Feet - Ayaklar (if landmarks exist)
        if (landmarks.length > 31) {
            // Sol ayak
            connect(27, 29, '#00FF00'); // Sol ayak bileği - sol ayak
            connect(29, 31, '#00FF00'); // Sol ayak iç
            connect(31, 27, '#00FF00'); // Sol ayak dış

            // Sağ ayak
            connect(28, 30, '#00FF00'); // Sağ ayak bileği - sağ ayak
            connect(30, 32, '#00FF00'); // Sağ ayak iç
            connect(32, 28, '#00FF00'); // Sağ ayak dış
        }

        // Draw landmark points (joints)
        landmarks.forEach((landmark, index) => {
            if (landmark.visibility && landmark.visibility > 0.5) {
                let pointSize = 6;
                let pointColor = '#FFFF00'; // Yellow for most points

                // Highlight key points
                if (index === 15 || index === 16) { // Wrists
                    pointSize = 8;
                    pointColor = '#00FF00'; // Green for wrists
                } else if (index === 11 || index === 12) { // Shoulders
                    pointSize = 7;
                    pointColor = '#FF00FF'; // Magenta for shoulders
                }

                ctx.beginPath();
                ctx.arc(landmark.x * canvas.width, landmark.y * canvas.height, pointSize, 0, 2 * Math.PI);
                ctx.fillStyle = pointColor;
                ctx.fill();
                ctx.strokeStyle = '#000000';
                ctx.lineWidth = 2;
                ctx.stroke();
            }
        });

        ctx.restore();
    };

    // Show loading state if not initialized yet
    if (!isInitialized) {
        return (
            <div className="min-h-screen bg-[#0f172a] text-white font-sans flex flex-col items-center justify-center">
                <div className="text-center">
                    <div className="bg-[#1e293b] p-4 rounded-full mb-4 animate-spin inline-block">
                        <Activity size={48} className="text-blue-500" />
                    </div>
                    <p className="text-lg font-medium text-gray-400">{t.loading}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#0f172a] text-white font-sans flex flex-col">
            {/* Header */}
            <header className="w-full h-16 px-6 border-b border-gray-800 flex justify-between items-center bg-[#0f172a]">
                <div className="flex items-center space-x-3">
                    <img src={logo} alt="DeepSport Logo" className="h-12 w-auto rounded-lg" />
                    <div className="text-xl font-bold tracking-wide">DeepSport Case</div>
                </div>
                <div className="flex items-center space-x-3">
                    <button className="p-2 rounded-full bg-[#1e293b] hover:bg-[#334155] transition-colors text-gray-400 hover:text-white">
                        <Settings size={20} />
                    </button>
                    <button className="p-2 rounded-full bg-[#1e293b] hover:bg-[#334155] transition-colors text-gray-400 hover:text-white">
                        <HelpCircle size={20} />
                    </button>
                </div>
            </header>

            {/* Main Content Grid */}
            <main className="flex-grow p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Left Column: Camera Feed (Span 2 columns) */}
                <div className="lg:col-span-2 flex flex-col space-y-6">
                    {/* Video Area */}
                    <div className="flex-grow bg-black rounded-3xl border border-gray-800 relative overflow-hidden flex flex-col items-center justify-center min-h-[400px]">
                        {/* Hidden Video Element for processing */}
                        <video ref={videoRef} className="absolute opacity-0 pointer-events-none" playsInline muted autoPlay></video>

                        {/* Canvas for display */}
                        <canvas
                            ref={canvasRef}
                            width={1280}
                            height={720}
                            className="w-full h-full object-contain"
                        ></canvas>

                        {!poseModelLoaded && (
                            <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-500 bg-black/80 z-10">
                                <div className="bg-[#1e293b] p-4 rounded-full mb-4 animate-spin">
                                    <Activity size={48} className="text-blue-500" />
                                </div>
                                <p className="text-lg font-medium text-gray-400">{t.poseModelLoading}</p>
                                <p className="text-sm text-gray-500 mt-2">{t.poseModelLoadingDesc}</p>
                                {cameraError && cameraError.includes('Pose model') && (
                                    <button
                                        onClick={() => window.location.reload()}
                                        className="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm"
                                    >
                                        {t.refreshPage}
                                    </button>
                                )}
                            </div>
                        )}

                        {!cameraActive && !cameraError && poseModelLoaded && (
                            <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-500 bg-black/80 z-10">
                                <div className="bg-[#1e293b] p-4 rounded-full mb-4">
                                    <Camera size={48} className="text-gray-400" />
                                </div>
                                <p className="text-lg font-medium text-gray-400">{t.cameraStarting}</p>
                            </div>
                        )}

                        {cameraError && (
                            <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-500 bg-black/90 z-10">
                                <div className="bg-[#1e293b] p-4 rounded-full mb-4">
                                    <Camera size={48} className="text-red-500" />
                                </div>
                                <p className="text-lg font-medium text-red-500">{t.cameraError}</p>
                                <p className="text-sm text-gray-400 mt-2">{cameraError}</p>
                            </div>
                        )}
                    </div>

                    {/* Status Bar */}
                    <div className="bg-[#111827] border border-gray-800 rounded-3xl p-6">
                        <h3 className="text-lg font-bold mb-4">{t.statusTitle}</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Camera Status */}
                            <div className="flex items-center space-x-4">
                                <div className="bg-[#1e293b] p-3 rounded-xl">
                                    <Video size={24} className="text-white" />
                                </div>
                                <div>
                                    <p className="text-sm text-gray-400">{t.cameraStatus}</p>
                                    <div className="flex items-center space-x-2">
                                        <div className={`w-2 h-2 rounded-full ${cameraActive ? 'bg-green-500' : 'bg-red-500'}`}></div>
                                        <span className="text-sm font-medium">{cameraActive ? t.active : t.passive}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Motion Status */}
                            <div className="flex items-center space-x-4">
                                <div className="bg-[#1e293b] p-3 rounded-xl">
                                    <Activity size={24} className="text-white" />
                                </div>
                                <div>
                                    <p className="text-sm text-gray-400">{t.motionDetection}</p>
                                    <div className="flex items-center space-x-2">
                                        <div className={`w-2 h-2 rounded-full ${isDetecting ? 'bg-green-500' : 'bg-gray-500'}`}></div>
                                        <span className="text-sm font-medium text-gray-400">{isDetecting ? t.running : t.waiting}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Progress Bar */}
                        <div className="mt-6">
                            <div className="flex justify-between mb-2">
                                <span className="text-sm text-gray-400">{t.handPosition}</span>
                                <span className="text-sm font-medium text-white">{Math.round(progress)}%</span>
                            </div>
                            <div className="w-full bg-gray-800 rounded-full h-2 relative">
                                <div
                                    className="bg-blue-600 h-2 rounded-full transition-all duration-300 ease-out"
                                    style={{ width: `${progress}%` }}
                                ></div>
                                {/* Threshold indicator */}
                                <div
                                    className="absolute top-0 bottom-0 w-0.5 bg-yellow-500 opacity-60 pointer-events-none"
                                    style={{ left: `${threshold}%` }}
                                ></div>
                            </div>
                            <p className="text-xs text-gray-500 mt-1">
                                {progress >= threshold
                                    ? t.thresholdExceeded
                                    : progress > 0
                                        ? t.thresholdNeeded(threshold)
                                        : t.showHand}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Right Column: Sidebar */}
                <div className="flex flex-col space-y-6">

                    {/* Settings Panel */}
                    <div className="bg-[#111827] border border-gray-800 rounded-3xl p-6">
                        <h3 className="text-lg font-bold mb-4">{t.settingsTitle}</h3>

                        {/* Camera Selection */}
                        <div className="mb-6">
                            <label className="block text-sm text-gray-400 mb-2">{t.cameraSelection}</label>
                            <select
                                value={selectedDeviceId}
                                onChange={(e) => setSelectedDeviceId(e.target.value)}
                                className="w-full bg-[#1f2937] border border-gray-700 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500"
                            >
                                {devices.map(device => (
                                    <option key={device.deviceId} value={device.deviceId}>
                                        {device.label || `Camera ${device.deviceId.slice(0, 5)}...`}
                                    </option>
                                ))}
                                {devices.length === 0 && <option>{t.cameraNotFound}</option>}
                            </select>
                        </div>

                        {/* Threshold Slider */}
                        <div className="mb-6">
                            <div className="flex justify-between mb-2">
                                <label className="text-sm text-gray-400">{t.thresholdValue(threshold)}</label>
                            </div>
                            <input
                                type="range"
                                min="50"
                                max="95"
                                value={threshold}
                                onChange={(e) => setThreshold(parseInt(e.target.value))}
                                className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
                            />
                            <p className="text-xs text-gray-500 mt-1">{t.thresholdDesc(threshold)}</p>
                        </div>

                        {/* Delay Slider */}
                        <div className="mb-6">
                            <div className="flex justify-between mb-2">
                                <label className="text-sm text-gray-400">{t.delayLabel(delay)}</label>
                            </div>
                            <input
                                type="range"
                                min="0"
                                max="5"
                                value={delay}
                                onChange={(e) => setDelay(parseInt(e.target.value))}
                                className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
                            />
                        </div>

                        {/* Manual Screenshot Button */}
                        <button
                            onClick={handleScreenshot}
                            disabled={!cameraActive}
                            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white font-bold py-3 px-6 rounded-xl transition-colors mb-4 flex items-center justify-center space-x-2"
                        >
                            <Camera size={20} />
                            <span>{t.manualScreenshot}</span>
                        </button>
                    </div>

                    {/* Gallery Panel */}
                    <div className="bg-[#111827] border border-gray-800 rounded-3xl p-6 flex-grow flex flex-col">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-bold">{t.galleryTitle(screenshots.length)}</h3>
                            {screenshots.length > 0 && (
                                <div className="flex space-x-2">
                                    <button
                                        onClick={handleDownloadAll}
                                        className="p-2 rounded-lg bg-blue-600 hover:bg-blue-700 transition-colors text-white"
                                        title={t.downloadAll}
                                    >
                                        <Download size={16} />
                                    </button>
                                    <button
                                        onClick={handleDeleteAll}
                                        className="p-2 rounded-lg bg-red-600 hover:bg-red-700 transition-colors text-white"
                                        title={t.deleteAll}
                                    >
                                        <Trash size={16} />
                                    </button>
                                </div>
                            )}
                        </div>
                        <div className="grid grid-cols-2 gap-3 overflow-y-auto max-h-[400px] flex-grow">
                            {screenshots.length === 0 ? (
                                <p className="col-span-2 text-gray-500 text-sm text-center py-8">{t.noScreenshots}</p>
                            ) : (
                                screenshots.map((screenshot) => (
                                    <div key={screenshot.id} className="aspect-video bg-gray-800 rounded-lg overflow-hidden relative group border border-gray-700">
                                        <img src={screenshot.dataUrl} alt={screenshot.filename} className="w-full h-full object-cover" />
                                        {/* Timestamp overlay */}
                                        <div className="absolute top-0 left-0 right-0 bg-gradient-to-b from-black/70 to-transparent p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <p className="text-xs text-white">{formatTimestamp(screenshot.timestamp)}</p>
                                        </div>
                                        {/* Action buttons */}
                                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center space-x-2">
                                            <button
                                                onClick={() => screenshotService.download(screenshot.dataUrl, screenshot.filename)}
                                                className="text-white text-xs bg-blue-600 hover:bg-blue-700 px-3 py-2 rounded flex items-center space-x-1 transition-colors"
                                                title={t.download}
                                            >
                                                <Download size={14} />
                                                <span>{t.download}</span>
                                            </button>
                                            <button
                                                onClick={() => handleDeleteScreenshot(screenshot.id)}
                                                className="text-white text-xs bg-red-600 hover:bg-red-700 px-3 py-2 rounded flex items-center space-x-1 transition-colors"
                                                title={t.delete}
                                            >
                                                <Trash2 size={14} />
                                                <span>{t.delete}</span>
                                            </button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Toast Notification */}
                    {lastScreenshotTime && (
                        <div className="bg-[#1f2937] border border-gray-700 rounded-lg p-3 flex items-center space-x-3 shadow-lg animate-fade-in-up">
                            <div className="bg-green-500/20 p-1 rounded-full">
                                <CheckCircle size={16} className="text-green-500" />
                            </div>
                            <span className="text-sm font-medium">{t.screenshotTaken}</span>
                        </div>
                    )}

                </div>
            </main>
        </div>
    );
};

export default MainScreen;
