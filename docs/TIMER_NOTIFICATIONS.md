# Fitur Notifikasi Timer ⏰

## Ringkasan
Ketika timer fokus selesai, aplikasi akan memberikan notifikasi lengkap dengan:
- ✅ **Notifikasi Push** (Mobile & Web)
- ✅ **Suara Alarm** (Beep pattern 3x)
- ✅ **Getaran/Vibration** (Pattern kuat)

## Cara Kerja

### 1. Permission Request
- Saat pertama kali membuka halaman LogCreator, app akan meminta permission untuk notifikasi
- User harus **Allow/Izinkan** agar notifikasi bisa muncul

### 2. Saat Timer Habis
Ketika countdown mencapai 0:
1. **Notifikasi muncul** dengan judul "⏰ Timer Selesai!" dan menampilkan niat yang diinput
2. **Alarm berbunyi** dengan pattern beep 3x (800Hz)
3. **HP bergetar** dengan pattern kuat (jika device support)
4. UI berubah ke mode "Selesai" untuk input realita

### 3. Platform Support

#### Web Browser
- Notifikasi browser native
- Suara alarm via Web Audio API
- Vibration API (jika browser support)
- Notification tetap muncul sampai user klik (requireInteraction: true)

#### Android
- Native notification dengan Capacitor Local Notifications
- System default notification sound
- Vibration pattern
- Notification muncul di notification tray

#### iOS
- Native notification dengan Capacitor Local Notifications  
- System default notification sound
- Haptic feedback

## Integrasi Huawei GT5 (Future Enhancement)

### Current State
- Notifikasi sudah bisa muncul di Android phone
- Jika Huawei GT5 terhubung via **Huawei Health app**, notifikasi dari phone akan di-mirror ke smartwatch

### Future Integration (Requires Additional Development)
Untuk integrasi penuh dengan Huawei GT5 (input realita langsung dari smartwatch):

1. **Requirements:**
   - Huawei Health SDK / Wearable SDK
   - Huawei Mobile Services (HMS) Core
   - Companion app di GT5

2. **Implementation Steps:**
   ```
   a. Add Huawei Health SDK to project
   b. Create Wear OS companion app
   c. Implement data sync between phone & watch
   d. Add voice/text input capability on watch
   e. Sync reality input back to phone app
   ```

3. **Consideration:**
   - GT5 Lite Wearable SDK memiliki limitation
   - Voice input di GT5 perlu custom implementation
   - Data sync requires background service

## Files Modified

### New Files
- `src/lib/notification-utils.ts` - Notification, sound, and vibration utilities

### Modified Files  
- `src/pages/LogCreatorPage.tsx` - Added notification trigger when timer finishes
- `android/app/src/main/AndroidManifest.xml` - Added notification permissions

### Dependencies Added
- `@capacitor/local-notifications@8.0.0`

## Testing

### Web
1. Open http://localhost:8080 di browser
2. Buka LogCreator page
3. Allow notification permission
4. Set timer mode dengan durasi pendek (misal 1 menit untuk testing)
5. Tunggu timer habis
6. Verify: notifikasi muncul, alarm bunyi, vibration aktif

### Android
1. Build & install app: `npx cap run android`
2. Buka app, masuk LogCreator
3. Allow notification permission
4. Set timer dan tunggu habis
5. Verify: 
   - Notification muncul di notification tray
   - Alarm bunyi
   - Vibration terasa
   - Bisa tap notification untuk buka app

### Huawei GT5 (Current)
1. Pastikan GT5 terhubung dengan HP via Huawei Health app
2. Set notification mirroring ON di Huawei Health
3. Jalankan timer di app
4. Verify: Notifikasi dari HP muncul di GT5

## Notes
- Notification sound menggunakan Web Audio API generated beep untuk web
- Native platform menggunakan system default notification sound
- Vibration pattern bisa di-customize di `notification-utils.ts`
- Untuk custom alarm sound, bisa tambahkan audio file dan gunakan `new Audio()` API
