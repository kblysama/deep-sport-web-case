import React from 'react';
import { Hand, Cpu, Shield } from 'lucide-react';
import logo from '../assets/logo.png';
import { useLanguage } from '../contexts/LanguageContext';

const translations = {
    tr: {
        header: 'DeepSport Case',
        heroTitle: 'Hoş Geldiniz',
        heroSubtitle: 'İskelet takibi ile ekran görüntüsü almanızı sağlayan bir uygulama.',
        featuresTitle: 'Özelliklere Genel Bakış',
        featuresSubtitle: 'Web kameranızı kullanarak ekran görüntülerini yakalamanın modern yolunu keşfedin.',
        feature1Title: 'Hareketle Ekran Görüntüsü',
        feature1Desc: "Belirli bir el hareketini yaparak (örneğin, eliniz ekranın %75'ini geçtiğinde) anında bir ekran görüntüsü alın.",
        feature2Title: 'Akıllı Teknoloji',
        feature2Desc: 'Tarayıcınızda doğru hareket tanıma için MediaPipe ve TensorFlow.js kullanır.',
        feature3Title: 'Gizlilik Odaklı',
        feature3Desc: 'Tüm işlemler cihazınızda yerel olarak yapılır.',
        cta: 'Hadi Başlayalım!',
        privacy: 'Gizlilik Politikası',
        terms: 'Hizmet Şartları',
        copyright: '© 2024 DeepSport Case. Tüm hakları saklıdır.'
    },
    en: {
        header: 'DeepSport Case',
        heroTitle: 'Welcome',
        heroSubtitle: 'A simple application that lets you take screenshots with skeleton tracking.',
        featuresTitle: 'Features Overview',
        featuresSubtitle: 'Discover the modern way to capture screenshots using your webcam.',
        feature1Title: 'Gesture Screenshot',
        feature1Desc: "Take an instant screenshot by making a specific hand gesture (e.g., when your hand crosses 75% of the screen).",
        feature2Title: 'Smart Technology',
        feature2Desc: 'Uses MediaPipe and TensorFlow.js for accurate motion recognition in your browser.',
        feature3Title: 'Privacy Focused',
        feature3Desc: 'All processing is done locally on your device. Your camera data is never sent to our servers.',
        cta: "Let's Get Started!",
        privacy: 'Privacy Policy',
        terms: 'Terms of Service',
        copyright: '© 2024 DeepSport Case. All rights reserved.'
    }
};

interface WelcomeScreenProps {
    onStart: () => void;
}

const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onStart }) => {
    const { language, setLanguage } = useLanguage();
    const t = translations[language];

    return (
        <div className="min-h-screen bg-[#0f172a] text-white flex flex-col font-sans">
            {/* Header */}
            <header className="w-full px-6 py-4 border-b border-gray-800 flex justify-between items-center">
                <div className="flex items-center space-x-3">
                    <img src={logo} alt="DeepSport Logo" className="h-14 w-auto rounded-lg" />
                    <div className="text-xl font-bold tracking-wide">{t.header}</div>
                </div>

                {/* Language Switcher */}
                <div className="flex items-center space-x-2 bg-[#1e293b] rounded-lg p-1 border border-gray-700">
                    <button
                        onClick={() => setLanguage('tr')}
                        className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${language === 'tr' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'}`}
                    >
                        TR
                    </button>
                    <button
                        onClick={() => setLanguage('en')}
                        className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${language === 'en' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'}`}
                    >
                        EN
                    </button>
                </div>
            </header>

            {/* Main Content */}
            <main className="flex-grow flex flex-col items-center justify-center px-4 py-12 text-center">

                {/* Hero Section */}
                <div className="mb-16 max-w-3xl">
                    <h1 className="text-5xl md:text-6xl font-extrabold mb-4 tracking-tight">
                        {t.heroTitle}
                    </h1>
                    <p className="text-gray-400 text-lg md:text-xl">
                        {t.heroSubtitle}
                    </p>
                </div>

                {/* Features Section */}
                <div className="mb-16 w-full max-w-5xl">
                    <h2 className="text-3xl font-bold mb-4">{t.featuresTitle}</h2>
                    <p className="text-gray-400 mb-10 max-w-2xl mx-auto">
                        {t.featuresSubtitle}
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Feature 1 */}
                        <div className="bg-[#1e293b] p-8 rounded-2xl border border-gray-700 flex flex-col items-center hover:border-blue-500 transition-colors duration-300">
                            <div className="mb-4 text-blue-500">
                                <Hand size={48} strokeWidth={1.5} />
                            </div>
                            <h3 className="text-xl font-bold mb-3">{t.feature1Title}</h3>
                            <p className="text-gray-400 text-sm leading-relaxed">
                                {t.feature1Desc}
                            </p>
                        </div>

                        {/* Feature 2 */}
                        <div className="bg-[#1e293b] p-8 rounded-2xl border border-gray-700 flex flex-col items-center hover:border-blue-500 transition-colors duration-300">
                            <div className="mb-4 text-blue-500">
                                <Cpu size={48} strokeWidth={1.5} />
                            </div>
                            <h3 className="text-xl font-bold mb-3">{t.feature2Title}</h3>
                            <p className="text-gray-400 text-sm leading-relaxed">
                                {t.feature2Desc}
                            </p>
                        </div>

                        {/* Feature 3 */}
                        <div className="bg-[#1e293b] p-8 rounded-2xl border border-gray-700 flex flex-col items-center hover:border-blue-500 transition-colors duration-300">
                            <div className="mb-4 text-blue-500">
                                <Shield size={48} strokeWidth={1.5} />
                            </div>
                            <h3 className="text-xl font-bold mb-3">{t.feature3Title}</h3>
                            <p className="text-gray-400 text-sm leading-relaxed">
                                {t.feature3Desc}
                            </p>
                        </div>
                    </div>
                </div>

                {/* CTA Button */}
                <button
                    onClick={onStart}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-10 rounded-full text-lg transition-all transform hover:scale-105 shadow-lg shadow-blue-500/30"
                >
                    {t.cta}
                </button>

            </main>

            {/* Footer */}
            <footer className="w-full max-w-6xl mx-auto p-6 border-t border-gray-800 text-center text-gray-500 text-sm">
                <div className="flex justify-center space-x-6 mb-4">
                    <a href="#" className="hover:text-white transition-colors">{t.privacy}</a>
                    <a href="#" className="hover:text-white transition-colors">{t.terms}</a>
                </div>
                <p>{t.copyright}</p>
            </footer>
        </div>
    );
};

export default WelcomeScreen;
