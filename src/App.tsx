import { useState, Component, type ErrorInfo, type ReactNode } from 'react';
import WelcomeScreen from './pages/WelcomeScreen';
import CameraAllowScreen from './pages/CameraAllowScreen';
import IntroCalibrationScreen from './pages/IntroCalibrationScreen';
import MainScreen from './pages/MainScreen';
import { cameraService } from './services/camera.service';
import { LanguageProvider } from './contexts/LanguageContext';

type Screen = 'welcome' | 'camera-allow' | 'intro-calibration' | 'main';

interface ErrorBoundaryState {
    hasError: boolean;
    error: Error | null;
}

class ErrorBoundary extends Component<{ children: ReactNode }, ErrorBoundaryState> {
    constructor(props: { children: ReactNode }) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error: Error): ErrorBoundaryState {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('ErrorBoundary caught an error:', error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen bg-[#0f172a] text-white flex items-center justify-center p-4">
                    <div className="text-center max-w-md">
                        <h1 className="text-2xl font-bold mb-4 text-red-500">Bir Hata Oluştu</h1>
                        <p className="text-gray-400 mb-4">
                            {this.state.error?.message || 'Beklenmeyen bir hata oluştu.'}
                        </p>
                        <button
                            onClick={() => {
                                this.setState({ hasError: false, error: null });
                                window.location.reload();
                            }}
                            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-lg"
                        >
                            Sayfayı Yenile
                        </button>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

function App() {
    const [currentScreen, setCurrentScreen] = useState<Screen>('welcome');

    const handleStart = () => {
        setCurrentScreen('camera-allow');
    };

    const handleAllowCamera = async () => {
        try {
            await cameraService.requestPermission();
            console.log('Camera permission granted');
            setCurrentScreen('intro-calibration');
        } catch (error) {
            console.error('Camera permission denied', error);
            alert('Kamera izni gereklidir. Lütfen tarayıcı ayarlarından izin verin.');
        }
    };

    const handleCalibrationComplete = () => {
        console.log('Calibration complete or skipped');
        setCurrentScreen('main');
    };

    return (
        <LanguageProvider>
            <ErrorBoundary>
                {currentScreen === 'welcome' && <WelcomeScreen onStart={handleStart} />}
                {currentScreen === 'camera-allow' && <CameraAllowScreen onAllow={handleAllowCamera} />}
                {currentScreen === 'intro-calibration' && <IntroCalibrationScreen onComplete={handleCalibrationComplete} />}
                {currentScreen === 'main' && <MainScreen />}
            </ErrorBoundary>
        </LanguageProvider>
    );
}

export default App;
