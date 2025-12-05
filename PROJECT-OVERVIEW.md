# PoseCapture – Gesture-Based Screenshot Web Application

## 1. Overview

PoseCapture, MediaPipe ve TensorFlow.js kullanarak tarayıcıda çalışan bir görüntü işleme web uygulamasıdır. Uygulama, kullanıcının kamerasını açar, gerçek zamanlı iskelet/pose bilgisini video görüntüsünün üzerine çizer ve kullanıcının eli ekran genişliğinin %75'ini geçtiğinde otomatik olarak screenshot alır. Bu screenshotlar ana ekranın altındaki galeri bölümünde gösterilir.

UI, 4 adımlı bir akış üzerinden tasarlanacaktır:

1. **Welcome Screen** – Kullanıcıyı karşılayan, uygulamayı kısaca anlatan giriş ekranı.  
2. **Camera Allow Pop-Up Screen** – Kamera izni için yönlendirme yapan, izin durumunu gösteren ekran.  
3. **Introduction & Calibration Screen** – Gesture mantığını anlatan ve basit bir kalibrasyon/threshold ayarı sağlayan ekran.  
4. **Main Screen** – Canlı kamera görüntüsü, iskelet overlay, gesture ilerleme ve screenshot galerisi.

Proje Antigravity ile geliştirilecek, UI tasarımları Stitch üzerinden oluşturulacak ve sonrasında React tabanlı yapıya uygulanacaktır.

---

## 2. Flow Detayı

### 1. Welcome Screen
- Uygulama adı ve kısa açıklama.
- “Başla” butonu ile kamera izni adımına geçiş.
- Alt kısımda kısa gizlilik/izin notu.

### 2. Camera Allow Pop-Up Screen
- Modal/pop-up hissi oluşturan tasarım.
- Kamera erişimi gerektiğini açıklayan metin.
- “Kamerayı Aç” butonu → `getUserMedia` çağrısı.
- İzin durumu (Bekleniyor / İzin verildi / Reddedildi) UI’da gösterilir.
- Hata mesajları için alan (ör. kullanıcı izni reddederse).

### 3. Introduction & Calibration Screen
- Sol tarafta nasıl çalıştığını anlatan text + maddeler (gesture mantığı).
- Sağ tarafta küçük bir kalibrasyon alanı:
  - Mini kamera önizleme (veya placeholder alan).
  - Elin x pozisyonunu temsil eden progress bar.
  - Opsiyonel threshold slider (%50–%95).
- “Devam et” ile ana ekrana geçiş, “Geri” ile kamera izin ekranına dönüş.

### 4. Main Screen
- Üstte app bar (PoseCapture başlık + canlı durumu tag).
- Sol tarafta büyük kamera alanı:
  - Video feed (16:9).
  - MediaPipe iskelet overlay.
  - Sağ tarafta %75’lik threshold çizgisi.
  - El pozisyonu için progress bar ve inline mesajlar.
- Sağ tarafta durum & ayarlar paneli:
  - Kamera izni, stream durumu, model durumu, son screenshot zaman bilgisi.
  - Threshold slider, otomatik screenshot toggle, manuel screenshot butonu.
- Alt kısımda screenshot galerisi:
  - Responsive grid (desktop/tablet/mobile).
  - Her screenshot için preview, timestamp, sil/indir aksiyonları.
  - “Tümünü Sil” ve “Tümünü İndir” aksiyonları.

---

## 3. Teknoloji Stack

- **Frontend:**
  - React (veya Antigravity ile oluşturulmuş React benzeri yapı)
  - TypeScript tercih edilebilir.
  - CSS / Tailwind / benzeri utility-first yaklaşım (proje kararına göre).

- **Görüntü İşleme:**
  - MediaPipe (pose/hand tracking).
  - TensorFlow.js (model entegrasyonu ve gerektiğinde ek hesaplamalar).

- **Tarayıcı API’leri:**
  - `MediaDevices.getUserMedia` → kamera erişimi.
  - Canvas üzerinden frame yakalama → screenshot üretme.

---

## 4. Ana Özellikler

- Kamera izni yönetimi ve durum gösterimi.
- İskelet / pose takibi ve overlay.
- Elin x konumundan gesture progress hesaplama.
- Eşik (threshold) değeri: varsayılan %75, UI üzerinden değiştirilebilir.
- Eşik aşıldığında otomatik screenshot.
- Screenshot galerisi, silme ve indirme fonksiyonları.
- Otomatik/manuel screenshot modları.

---


