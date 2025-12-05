import React, { useState, useEffect } from 'react';
import { Video, Loader2, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';
import logo from '../assets/logo.png';
import { useLanguage } from '../contexts/LanguageContext';

type PermissionStatus = 'pending' | 'requesting' | 'granted' | 'denied';

interface CameraAllowScreenProps {
    onAllow: () => Promise<void>;
}

const translations = {
    tr: {
        pendingTitle: 'Kamera İzni Gerekiyor',
        requestingTitle: 'İzin bekleniyor...',
        grantedTitle: 'İzin verildi! Yönlendiriliyorsunuz...',
        deniedTitle: 'İzin reddedildi',
        description1: 'Ekran görüntüsü almak için el hareketlerinizi algılayabilmemiz adına kameranıza erişmemiz gerekiyor.',
        description2: 'Gizliliğiniz bizim için önemlidir. Kamera görüntünüz hiçbir zaman kaydedilmez veya saklanmaz. Tüm hareket tanıma işlemleri tamamen bilgisayarınızda, tarayıcınızın içinde gerçekleşir.',
        checkBrowser: 'Tarayıcınızın izin istediğini kontrol edin...',
        success: 'Kamera erişimi başarıyla sağlandı!',
        allowBtn: 'İzin Ver',
        retryBtn: 'Tekrar Dene',
        moreInfo: 'Daha Fazla Bilgi',
        errors: {
            notAllowed: 'Kamera izni reddedildi. Lütfen tarayıcı ayarlarından izin verin.',
            notFound: 'Kamera bulunamadı. Lütfen bir kameranın bağlı olduğundan emin olun.',
            notReadable: 'Kamera başka bir uygulama tarafından kullanılıyor olabilir.',
            generic: 'Kamera erişiminde bir hata oluştu. Lütfen tekrar deneyin.'
        }
    },
    en: {
        pendingTitle: 'Camera Permission Required',
        requestingTitle: 'Waiting for permission...',
        grantedTitle: 'Permission granted! Redirecting...',
        deniedTitle: 'Permission denied',
        description1: 'We need access to your camera to detect your hand gestures for taking screenshots.',
        description2: 'Your privacy is important to us. Your camera feed is never recorded or stored. All gesture recognition processing happens entirely locally on your device, within your browser.',
        checkBrowser: 'Please check your browser for the permission request...',
        success: 'Camera access granted successfully!',
        allowBtn: 'Allow Access',
        retryBtn: 'Try Again',
        moreInfo: 'More Information',
        errors: {
            notAllowed: 'Camera permission denied. Please allow access in browser settings.',
            notFound: 'Camera not found. Please ensure a camera is connected.',
            notReadable: 'Camera might be in use by another application.',
            generic: 'An error occurred while accessing the camera. Please try again.'
        }
    }
};

const CameraAllowScreen: React.FC<CameraAllowScreenProps> = ({ onAllow }) => {
    const { language } = useLanguage();
    const t = translations[language];
    const [status, setStatus] = useState<PermissionStatus>('pending');
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    const handleRequestPermission = async () => {
        setStatus('requesting');
        setErrorMessage(null);

        try {
            await onAllow();
            setStatus('granted');
        } catch (error: any) {
            console.error('Camera permission error:', error);
            setStatus('denied');

            // User-friendly error messages
            if (error?.name === 'NotAllowedError') {
                setErrorMessage(t.errors.notAllowed);
            } else if (error?.name === 'NotFoundError') {
                setErrorMessage(t.errors.notFound);
            } else if (error?.name === 'NotReadableError') {
                setErrorMessage(t.errors.notReadable);
            } else {
                setErrorMessage(t.errors.generic);
            }
        }
    };

    // Auto-redirect when permission is granted
    useEffect(() => {
        if (status === 'granted') {
            const timer = setTimeout(() => {
                // onAllow already handles navigation in App.tsx
            }, 1500); // 1.5 second delay to show success message
            return () => clearTimeout(timer);
        }
    }, [status]);

    const getStatusIcon = () => {
        switch (status) {
            case 'requesting':
                return <Loader2 size={40} className="text-blue-500 animate-spin" />;
            case 'granted':
                return <CheckCircle2 size={40} className="text-green-500" />;
            case 'denied':
                return <XCircle size={40} className="text-red-500" />;
            default:
                return <Video size={40} className="text-blue-500" fill="currentColor" fillOpacity={0.2} />;
        }
    };

    const getStatusText = () => {
        switch (status) {
            case 'requesting':
                return t.requestingTitle;
            case 'granted':
                return t.grantedTitle;
            case 'denied':
                return t.deniedTitle;
            default:
                return t.pendingTitle;
        }
    };

    return (
        <div className="min-h-screen bg-[#0f172a] flex flex-col font-sans">
            {/* Header */}
            <header className="w-full p-6 flex justify-center items-center">
                <div className="flex items-center space-x-3">
                    <img src={logo} alt="DeepSport Logo" className="h-24 w-auto rounded-lg" />
                    <div className="text-xl font-bold tracking-wide text-white">DeepSport Case</div>
                </div>
            </header>

            <div className="flex-grow flex items-center justify-center p-4">
                {/* Modal Container */}
                <div className="bg-[#111827] border border-gray-800 rounded-3xl p-8 max-w-md w-full text-center shadow-2xl relative overflow-hidden">

                    {/* Icon */}
                    <div className="flex justify-center mb-6">
                        <div className="bg-[#1e293b] p-4 rounded-full relative">
                            {getStatusIcon()}
                        </div>
                    </div>

                    {/* Title */}
                    <h2 className="text-2xl font-bold text-white mb-4">
                        {getStatusText()}
                    </h2>

                    {/* Description */}
                    {status === 'pending' && (
                        <>
                            <p className="text-gray-400 text-sm mb-6 leading-relaxed">
                                {t.description1}
                            </p>
                            <p className="text-gray-400 text-sm mb-8 leading-relaxed">
                                {t.description2}
                            </p>
                        </>
                    )}

                    {status === 'requesting' && (
                        <p className="text-gray-400 text-sm mb-8 leading-relaxed">
                            {t.checkBrowser}
                        </p>
                    )}

                    {status === 'granted' && (
                        <p className="text-green-400 text-sm mb-8 leading-relaxed">
                            {t.success}
                        </p>
                    )}

                    {status === 'denied' && errorMessage && (
                        <div className="mb-6 p-4 bg-red-900/20 border border-red-700/50 rounded-lg">
                            <div className="flex items-start space-x-3">
                                <AlertCircle size={20} className="text-red-500 flex-shrink-0 mt-0.5" />
                                <p className="text-red-400 text-sm text-left leading-relaxed">
                                    {errorMessage}
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Action Button */}
                    {status === 'pending' && (
                        <button
                            onClick={handleRequestPermission}
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-xl transition-colors mb-4"
                        >
                            {t.allowBtn}
                        </button>
                    )}

                    {status === 'denied' && (
                        <button
                            onClick={handleRequestPermission}
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-xl transition-colors mb-4"
                        >
                            {t.retryBtn}
                        </button>
                    )}

                    {/* More Info Link */}
                    {status !== 'granted' && (
                        <button className="text-gray-500 text-xs hover:text-gray-400 underline">
                            {t.moreInfo}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default CameraAllowScreen;
