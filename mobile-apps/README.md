# Grocery POS Mobile Applications (Android & iOS)

This directory contains the complete native mobile applications for **Grocery Billing ERP & POS**, separated for **Android** and **iOS**.

---

## 📁 Directory Structure

```
mobile-apps/
├── android/                    <-- Native Android Studio Project
│   ├── app/
│   │   ├── src/main/
│   │   │   ├── AndroidManifest.xml (Camera barcode & cleartext LAN enabled)
│   │   │   ├── java/com/grocerypos/billing/MainActivity.java
│   │   │   └── res/ (Layouts, Strings, Colors, Themes)
│   │   └── build.gradle
│   ├── build.gradle
│   └── settings.gradle
│
├── ios/                        <-- Native iOS Xcode Project
│   └── GroceryPOS/
│       ├── AppDelegate.swift
│       ├── ViewController.swift (WKWebView with safe-area & connection switcher)
│       └── Info.plist (Camera barcode permission & LAN HTTP transport)
│
└── build-apk.bat               <-- 1-Click APK Builder script
```

---

## 🤖 1. Android Application (`.apk`)

### Features:
- **Hardware-Accelerated WebView**: Ultra-fast POS rendering and invoice printing.
- **Pull-To-Refresh**: Swipe down from the top to refresh transactions.
- **Smart Connection Settings**: If server IP changes or Wi-Fi drops, a dialog appears allowing the cashier to update the Server IP (`http://192.168.84.103:3000` or custom domain) on the fly!
- **Camera Barcode Scanning**: Full hardware camera permissions enabled.

### How to Build the `.apk`:
1. **Using Android Studio**:
   - Open **Android Studio**.
   - Click **Open** and select the folder: `d:\Billing_software\mobile-apps\android`.
   - Wait for Gradle sync to complete.
   - Go to menu: **Build** $\rightarrow$ **Build Bundle(s) / APK(s)** $\rightarrow$ **Build APK(s)**.
   - The compiled installable APK will be saved at:
     ```
     mobile-apps/android/app/build/outputs/apk/debug/app-debug.apk
     ```
   - Copy `app-debug.apk` to any Android phone via USB/WhatsApp and tap to install!

2. **Using 1-Click Cloud APK Builder (Instant without Android Studio)**:
   - Go to: **[https://www.pwabuilder.com](https://www.pwabuilder.com)**
   - Enter your active store URL: `https://flat-parents-buy.loca.lt` (or your public IP).
   - Click **Package for Android** $\rightarrow$ **Generate APK**.
   - Download the signed `.apk` file directly!

---

## 🍎 2. iOS Application (iPhone & iPad)

### Features:
- Built with Apple's native **WebKit (WKWebView)** and Swift.
- Safe Area insets handled for iPhone notch, Dynamic Island, and home indicator.
- Camera access for scanning barcodes with `NSCameraUsageDescription`.
- Local Area Network permission enabled in `Info.plist`.

### How to Run / Install on iPhone:
1. **Method A: Native Xcode Project**:
   - Open the `mobile-apps/ios` project folder on a Mac in **Xcode**.
   - Connect your iPhone via USB.
   - Select your iPhone in Xcode and click **Run (▶)**.
   - The app installs natively onto your iPhone!

2. **Method B: Instant Native iOS App (No Mac needed)**:
   - On your iPhone, open **Safari**.
   - Navigate to: `http://192.168.84.103:3000` (or `https://flat-parents-buy.loca.lt`).
   - Tap the **Share** button (the square with an arrow pointing up at the bottom of Safari).
   - Scroll down and tap **"Add to Home Screen"**.
   - Tap **Add**.
   - A dedicated **Grocery POS** app icon will appear on your iPhone home screen. It runs full-screen like an App Store app!
